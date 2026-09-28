import tempfile
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import patch

import test_chat_and_booking as chat_tests
from fastapi import HTTPException
from sqlalchemy import create_engine, event
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker
from app.api.routes import availability, booking
from app.models import User, Counselor, AvailabilitySlot, Booking, AuditLog, Notification
from app.schemas.booking import BookingCreate


class BookingSafetyTests(TestCase):
    headers = chat_tests.ChatAndBookingTests.headers
    token = chat_tests.ChatAndBookingTests.token
    update = chat_tests.ChatAndBookingTests.update

    def setUp(self):
        chat_tests.ChatAndBookingTests.setUp(self)
        self.app.include_router(availability.router)
        clock = patch.object(availability, "utc_now", return_value=self.now)
        clock.start()
        self.addCleanup(clock.stop)

    def test_offset_conversion_and_aware_output(self):
        response = self.client.post("/availability/me", headers=self.headers(2), json={
            "start_time": "2026-01-02T10:00:00+02:00", "end_time": "2026-01-02T11:00:00+02:00"})
        self.assertEqual(response.status_code, 201, response.text)
        self.assertEqual(response.json()["start_time"], "2026-01-02T08:00:00Z")
        slot_id = response.json()["id"]
        response = self.client.post("/bookings/", headers=self.headers(), json={"slot_id": slot_id, "counselor_id": 1})
        self.assertEqual(response.status_code, 201, response.text)
        self.assertEqual(response.json()["scheduled_for"], "2026-01-02T08:00:00Z")

    def test_naive_times_rejected_and_past_instant_uses_offset(self):
        for start, end, code in (("2026-01-02T10:00:00", "2026-01-02T11:00:00", 422),
                                 ("2026-01-01T13:00:00+02:00", "2026-01-01T14:00:00+02:00", 409)):
            response = self.client.post("/availability/me", headers=self.headers(2), json={"start_time": start, "end_time": end})
            self.assertEqual(response.status_code, code, response.text)

    def test_overlap_with_booked_slot_and_adjacent_slot(self):
        for start, end, code in (("12:20", "13:20", 409), ("12:50", "13:50", 201)):
            response = self.client.post("/availability/me", headers=self.headers(2), json={
                "start_time": f"2026-01-01T{start}:00Z", "end_time": f"2026-01-01T{end}:00Z"})
            self.assertEqual(response.status_code, code, response.text)

    def test_update_cannot_overlap_booked_slot_or_move_into_past(self):
        with self.sessions() as db:
            db.add(AvailabilitySlot(id=2, counselor_id=1, status="AVAILABLE",
                                   start_time=self.now + timedelta(days=1), end_time=self.now + timedelta(days=1, hours=1)))
            db.commit()
        for start, end in (("12:20", "13:20"), ("10:00", "11:00")):
            response = self.client.patch("/availability/me/2", headers=self.headers(2), json={
                "start_time": f"2026-01-01T{start}:00Z", "end_time": f"2026-01-01T{end}:00Z"})
            self.assertEqual(response.status_code, 409, response.text)

    def test_database_blocks_duplicate_active_booking_but_allows_cancelled_history(self):
        with self.sessions() as db:
            db.add(Booking(user_id=3, counselor_id=1, slot_id=1, scheduled_for=self.now, status="PENDING"))
            with self.assertRaises(IntegrityError):
                db.commit()
            db.rollback()
            db.add(Booking(user_id=3, counselor_id=1, slot_id=1, scheduled_for=self.now, status="CANCELLED"))
            db.commit()

    def test_cancel_then_rebook_preserves_history(self):
        self.update(AvailabilitySlot, 1, start_time=self.now + timedelta(days=1), end_time=self.now + timedelta(days=1, hours=1))
        self.update(Booking, 1, scheduled_for=self.now + timedelta(days=1))
        self.assertEqual(self.client.delete("/bookings/1", headers=self.headers()).status_code, 204)
        response = self.client.post("/bookings/", headers=self.headers(3), json={"slot_id": 1, "counselor_id": 1})
        self.assertEqual(response.status_code, 201, response.text)
        with self.sessions() as db:
            self.assertEqual(db.get(Booking, 1).status, "CANCELLED")

    def test_two_simultaneous_claims_have_one_winner(self):
        # Separate connections and force both requests to reach the claim with
        # an AVAILABLE snapshot. PostgreSQL additionally uses row locks.
        with tempfile.TemporaryDirectory() as folder:
            engine = create_engine("sqlite:///" + (Path(folder) / "race.db").as_posix(),
                                   connect_args={"check_same_thread": False, "timeout": 10})
            try:
                factory = sessionmaker(bind=engine)
                for model in (User, Counselor, AvailabilitySlot, Booking, AuditLog, Notification):
                    model.__table__.create(engine)
                with factory() as db:
                    db.add_all([User(id=i, nickname=f"u{i}", password_hash="unused", is_active=True) for i in (1, 2, 3)])
                    db.add(Counselor(id=1, user_id=2, full_name="Counselor", specialization="General", is_active=True, application_status="APPROVED"))
                    db.add(AvailabilitySlot(id=1, counselor_id=1, status="AVAILABLE", start_time=self.now + timedelta(days=1), end_time=self.now + timedelta(days=1, hours=1)))
                    db.commit()
                barrier = threading.Barrier(2)
                def synchronize(conn, cursor, statement, parameters, context, executemany):
                    if statement.startswith("UPDATE availability_slots SET"):
                        barrier.wait(timeout=5)
                event.listen(engine, "before_cursor_execute", synchronize)
                def reserve(user_id):
                    with factory() as db:
                        try:
                            booking.create_booking(BookingCreate(counselor_id=1, slot_id=1),
                                                   SimpleNamespace(client=None), db, db.get(User, user_id))
                            return 201
                        except HTTPException as exc:
                            return exc.status_code
                with ThreadPoolExecutor(max_workers=2) as pool:
                    results = list(pool.map(reserve, (1, 3)))
                self.assertEqual(sorted(results), [201, 409])
                with factory() as db:
                    self.assertEqual(db.query(Booking).count(), 1)
                    self.assertEqual(db.get(AvailabilitySlot, 1).status, "BOOKED")
            finally:
                engine.dispose()
