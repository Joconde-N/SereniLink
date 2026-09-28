"""Chat permissions and booking lifecycle tests using an isolated SQLite DB."""
import os
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET"] = "security-tests-only"
os.environ["HF_API_KEY"] = "unused"

from fastapi import FastAPI
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.api.deps import get_db
from app.api.routes import auth, booking, chat
from app.core.security import create_access_token
from app.models import User, Counselor, Booking, AvailabilitySlot, ChatMessage, Notification, AuditLog


class ChatAndBookingTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        self.addCleanup(self.engine.dispose)
        for model in (User, Counselor, AvailabilitySlot, Booking, ChatMessage, Notification, AuditLog):
            model.__table__.create(self.engine)
        self.sessions = sessionmaker(bind=self.engine)
        self.now = datetime(2026, 1, 1, 12, tzinfo=timezone.utc)
        with self.sessions() as db:
            db.add_all([
                User(id=1, nickname="client", role="user", password_hash="unused", is_active=True),
                User(id=2, nickname="counselor", role="counselor", password_hash="unused", is_active=True),
                User(id=3, nickname="outsider", role="user", password_hash="unused", is_active=True),
                User(id=4, nickname="admin", role="admin", password_hash="unused", is_active=True),
                Counselor(id=1, user_id=2, full_name="Counselor", specialization="General", application_status="APPROVED", is_active=True),
                AvailabilitySlot(id=1, counselor_id=1, start_time=self.now - timedelta(minutes=10),
                                 end_time=self.now + timedelta(minutes=50), status="BOOKED"),
                Booking(id=1, user_id=1, counselor_id=1, slot_id=1,
                        scheduled_for=self.now - timedelta(minutes=10), status="APPROVED"),
            ])
            db.commit()
        self.app = FastAPI()
        for router in (chat.router, booking.router, auth.router):
            self.app.include_router(router)
        def db_override():
            with self.sessions() as db:
                yield db
        self.app.dependency_overrides[get_db] = db_override
        for target, attr, value in ((chat, "SessionLocal", self.sessions), (auth.limiter, "enabled", False)):
            patcher = patch.object(target, attr, value)
            patcher.start()
            self.addCleanup(patcher.stop)
        patcher = patch.object(booking, "utc_now")
        self.clock = patcher.start()
        self.clock.return_value = self.now
        self.addCleanup(patcher.stop)
        self.addCleanup(chat.chat_rooms.clear)
        self.client = TestClient(self.app)
        self.addCleanup(self.client.close)

    def token(self, user_id=1):
        with self.sessions() as db:
            return create_access_token(subject=str(user_id), password_hash=db.get(User, user_id).password_hash)

    def headers(self, user_id=1):
        return {"Authorization": "Bearer " + self.token(user_id)}

    def socket(self, user_id=1):
        return self.client.websocket_connect("/chat/ws/1?token=" + self.token(user_id))

    def update(self, model, key, **values):
        with self.sessions() as db:
            item = db.get(model, key)
            for name, value in values.items():
                setattr(item, name, value)
            db.commit()

    def assert_socket_denied(self, user_id, code):
        with self.socket(user_id) as ws:
            with self.assertRaises(WebSocketDisconnect) as caught:
                ws.receive_json()
            self.assertEqual(caught.exception.code, code)

    def test_disabled_user_cannot_login_or_access_http_or_websocket_chat(self):
        self.update(User, 1, is_active=False)
        with patch.object(auth, "verify_password", return_value=True):
            response = self.client.post("/auth/login", data={"username": "client", "password": "test"})
        self.assertEqual(response.status_code, 403)
        self.assertNotIn("access_token", response.json())
        self.assertEqual(self.client.get("/chat/booking/1", headers=self.headers()).status_code, 403)
        self.assert_socket_denied(1, 4401)

    def test_non_participants_cannot_read_or_write(self):
        for user_id in (3, 4):
            with self.subTest(user_id=user_id):
                self.assertEqual(self.client.get("/chat/booking/1", headers=self.headers(user_id)).status_code, 403)
                self.assertEqual(self.client.post("/chat/", headers=self.headers(user_id),
                                                 json={"booking_id": 1, "message": "hello"}).status_code, 403)
                self.assert_socket_denied(user_id, 4403)

    def test_pending_cancelled_declined_deny_http_and_websocket(self):
        for status in ("PENDING", "CANCELLED", "DECLINED"):
            self.update(Booking, 1, status=status)
            with self.subTest(status=status):
                self.assertEqual(self.client.get("/chat/booking/1", headers=self.headers()).status_code, 403)
                self.assertEqual(self.client.post("/chat/", headers=self.headers(),
                                                 json={"booking_id": 1, "message": "hello"}).status_code, 403)
                self.assert_socket_denied(1, 4403)

    def test_completed_chat_is_read_only_on_both_transports(self):
        self.update(Booking, 1, status="COMPLETED")
        for user_id in (1, 2):
            with self.subTest(user_id=user_id):
                self.assertEqual(self.client.get("/chat/booking/1", headers=self.headers(user_id)).status_code, 200)
                self.assertEqual(self.client.post("/chat/", headers=self.headers(user_id),
                                                 json={"booking_id": 1, "message": "blocked"}).status_code, 403)
                with self.socket(user_id) as ws:
                    self.assertEqual(ws.receive_json()["type"], "history")
                    ws.send_json({"message": "blocked"})
                    self.assertEqual(ws.receive_json()["type"], "error")
        with self.sessions() as db:
            self.assertEqual(db.query(ChatMessage).count(), 0)

    def test_approved_participants_can_send_http_and_websocket_messages(self):
        response = self.client.post("/chat/", headers=self.headers(), json={"booking_id": 1, "message": "HTTP"})
        self.assertEqual(response.status_code, 201)
        with self.socket(2) as ws:
            self.assertEqual(ws.receive_json()["messages"][0]["message"], "HTTP")
            ws.send_json({"message": "WebSocket"})
            self.assertEqual(ws.receive_json()["message"], "WebSocket")

    def test_deactivation_and_cancellation_revoke_existing_socket_writes(self):
        for model, values, code in ((User, {"is_active": False}, 4401), (Booking, {"status": "CANCELLED"}, 4403)):
            self.update(User, 1, is_active=True)
            self.update(Booking, 1, status="APPROVED")
            with self.subTest(model=model.__name__), self.socket() as ws:
                ws.receive_json()
                self.update(model, 1, **values)
                ws.send_json({"message": "must not save"})
                with self.assertRaises(WebSocketDisconnect) as caught:
                    ws.receive_json()
                self.assertEqual(caught.exception.code, code)
        with self.sessions() as db:
            self.assertEqual(db.query(ChatMessage).count(), 0)

    def test_disabled_recipient_does_not_receive_broadcast(self):
        with self.socket() as recipient, self.socket(2) as sender:
            recipient.receive_json()
            sender.receive_json()
            self.update(User, 1, is_active=False)
            sender.send_json({"message": "private"})
            self.assertEqual(sender.receive_json()["message"], "private")
            with self.assertRaises(WebSocketDisconnect):
                recipient.receive_json()

    def test_existing_socket_becomes_read_only_on_completion(self):
        with self.socket() as ws:
            ws.receive_json()
            self.update(Booking, 1, status="COMPLETED")
            ws.send_json({"message": "blocked"})
            self.assertEqual(ws.receive_json()["type"], "error")
        with self.sessions() as db:
            self.assertEqual(db.query(ChatMessage).count(), 0)

    def test_auto_completion_waits_until_end_including_exact_boundary(self):
        for end_delta, expected in ((50, "APPROVED"), (0, "COMPLETED"), (-1, "COMPLETED")):
            self.update(Booking, 1, status="APPROVED")
            self.update(AvailabilitySlot, 1, end_time=self.now + timedelta(minutes=end_delta))
            with self.subTest(end_delta=end_delta), self.sessions() as db:
                booking.expire_stale_bookings(db)
                self.assertEqual(db.get(Booking, 1).status, expected)

    def test_listing_during_session_preserves_approved_status_and_contact(self):
        response = self.client.get("/bookings/me", headers=self.headers())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["status"], "APPROVED")
        self.assertEqual(self.client.get("/bookings/1/contact", headers=self.headers()).status_code, 200)

    def test_pending_request_still_expires_at_start(self):
        self.update(Booking, 1, status="PENDING", scheduled_for=self.now)
        with self.sessions() as db:
            booking.expire_stale_bookings(db)
            self.assertEqual(db.get(Booking, 1).status, "DECLINED")
            self.assertEqual(db.get(AvailabilitySlot, 1).status, "AVAILABLE")

    def test_manual_completion_uses_end_time_for_admin_and_counselor(self):
        for user_id, route in ((4, "status"), (2, "counselor-status")):
            for end_delta, expected in ((50, 409), (0, 200), (-1, 200)):
                self.update(Booking, 1, status="APPROVED")
                self.update(AvailabilitySlot, 1, end_time=self.now + timedelta(minutes=end_delta))
                with self.subTest(user_id=user_id, end_delta=end_delta):
                    response = self.client.patch(f"/bookings/1/{route}", headers=self.headers(user_id),
                                                 json={"status": "COMPLETED"})
                    self.assertEqual(response.status_code, expected, response.text)

    def test_terminal_bookings_cannot_be_reopened_or_pending_completed(self):
        for old_status, new_status in (("CANCELLED", "APPROVED"), ("DECLINED", "PENDING"),
                                       ("COMPLETED", "APPROVED"), ("PENDING", "COMPLETED")):
            self.update(Booking, 1, status=old_status, scheduled_for=self.now + timedelta(days=1))
            response = self.client.patch("/bookings/1/status", headers=self.headers(4), json={"status": new_status})
            self.assertEqual(response.status_code, 409)


if __name__ == "__main__":
    unittest.main()
