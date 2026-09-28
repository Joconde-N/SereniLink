from datetime import datetime, timedelta
from unittest import TestCase
from unittest.mock import patch
from urllib.parse import quote
from email import message_from_string

import test_chat_and_booking as chat_tests
from sqlalchemy import event
from app.api.routes import moods, auth
from app.core import email
from app.core.security import verify_password
from app.models import Assessment, MoodEntry, User


class CheckinAndRecoveryTests(TestCase):
    headers = chat_tests.ChatAndBookingTests.headers
    token = chat_tests.ChatAndBookingTests.token
    update = chat_tests.ChatAndBookingTests.update

    def setUp(self):
        chat_tests.ChatAndBookingTests.setUp(self)
        for model in (Assessment, MoodEntry):
            model.__table__.create(self.engine)
        self.app.include_router(moods.router)
        self.update(User, 1, email="client@example.com")

    def test_checkin_saves_selected_emotion_and_actual_rating_together(self):
        for mood, score in (("SAD", 2), ("HAPPY", 9)):
            response = self.client.post("/moods/check-in", headers=self.headers(), json={
                "mood": mood, "mood_score": score, "stress": 4, "sleep": 7, "notes": "A note"})
            self.assertEqual(response.status_code, 201, response.text)
            self.assertEqual(response.json()["mood"], score)
        with self.sessions() as db:
            assessments = db.query(Assessment).order_by(Assessment.id).all()
            entries = db.query(MoodEntry).order_by(MoodEntry.id).all()
            self.assertEqual([a.mood for a in assessments], [2, 9])
            self.assertEqual([m.mood for m in entries], ["SAD", "HAPPY"])
            for assessment, entry in zip(assessments, entries):
                self.assertEqual(assessment.created_at, entry.created_at)
                self.assertEqual(assessment.user_id, entry.user_id)
                self.assertEqual(assessment.notes, entry.note)

    def test_invalid_checkins_do_not_save_either_record(self):
        valid = {"mood": "HAPPY", "mood_score": 8, "stress": 4, "sleep": 7}
        for change in ({"mood": "UNKNOWN"}, {"mood_score": 11}, {"stress": 0}, {"notes": "x" * 501}):
            response = self.client.post("/moods/check-in", headers=self.headers(), json={**valid, **change})
            self.assertEqual(response.status_code, 422)
        missing = {k: v for k, v in valid.items() if k != "mood_score"}
        self.assertEqual(self.client.post("/moods/check-in", headers=self.headers(), json=missing).status_code, 422)
        with self.sessions() as db:
            self.assertEqual(db.query(Assessment).count(), 0)
            self.assertEqual(db.query(MoodEntry).count(), 0)

    def test_second_insert_failure_rolls_back_whole_checkin(self):
        def fail_insert(*args):
            raise RuntimeError("Simulated mood insert failure")
        event.listen(MoodEntry, "before_insert", fail_insert)
        try:
            with self.assertRaisesRegex(RuntimeError, "Simulated"):
                self.client.post("/moods/check-in", headers=self.headers(), json={
                    "mood": "CALM", "mood_score": 8, "stress": 4, "sleep": 7})
        finally:
            event.remove(MoodEntry, "before_insert", fail_insert)
        with self.sessions() as db:
            self.assertEqual(db.query(Assessment).count(), 0)
            self.assertEqual(db.query(MoodEntry).count(), 0)

    def test_password_recovery_round_trip_and_token_cannot_be_reused(self):
        with patch.object(auth, "send_password_reset_email") as send:
            response = self.client.post("/auth/forgot-password", json={"email": "client@example.com"})
        self.assertEqual(response.status_code, 200, response.text)
        reset_token = send.call_args.args[1]
        self.assertNotIn(reset_token, response.text)
        with self.sessions() as db:
            expires = db.get(User, 1).password_reset_expires
            self.assertTrue(datetime.utcnow() < expires < datetime.utcnow() + timedelta(minutes=31))
        payload = {"token": reset_token, "new_password": "NewPassword9!"}
        self.assertEqual(self.client.post("/auth/reset-password", json=payload).status_code, 200)
        self.assertEqual(self.client.post("/auth/reset-password", json=payload).status_code, 400)
        with self.sessions() as db:
            user = db.get(User, 1)
            self.assertTrue(verify_password(payload["new_password"], user.password_hash))
            self.assertIsNone(user.password_reset_token)
        login = self.client.post("/auth/login", data={"username": "client", "password": payload["new_password"]})
        self.assertEqual(login.status_code, 200, login.text)

    def test_unknown_email_same_response_and_no_email_sent(self):
        with patch.object(auth, "send_password_reset_email") as send:
            known = self.client.post("/auth/forgot-password", json={"email": "client@example.com"})
            send.reset_mock()
            unknown = self.client.post("/auth/forgot-password", json={"email": "unknown@example.com"})
            send.assert_not_called()
        self.assertEqual(known.json(), unknown.json())
        self.assertEqual(unknown.status_code, 200)

    def test_expired_token_rejected(self):
        self.update(User, 1, password_reset_token="expired", password_reset_expires=datetime.utcnow() - timedelta(minutes=1))
        response = self.client.post("/auth/reset-password", json={"token": "expired", "new_password": "NewPassword9!"})
        self.assertEqual(response.status_code, 400)

    def test_reset_email_uses_configured_frontend(self):
        with patch.object(email.settings, "FRONTEND_URL", "https://app.example.com/"), \
             patch.object(email.settings, "SMTP_USER", "test"), \
             patch.object(email.settings, "SMTP_PASSWORD", "test"), \
             patch.object(email.smtplib, "SMTP") as smtp:
            email.send_password_reset_email("client@example.com", "safe-token")
        raw = smtp.return_value.__enter__.return_value.sendmail.call_args.args[2]
        body = message_from_string(raw).get_payload()[0].get_payload(decode=True).decode()
        self.assertIn("https://app.example.com/reset-password?token=safe-token", body)
        self.assertNotIn("localhost", body)

    def test_missing_smtp_does_not_log_reset_secret(self):
        with patch.object(email.settings, "SMTP_USER", ""), self.assertLogs(email.logger, level="WARNING") as logs:
            email.send_password_reset_email("client@example.com", "do-not-log-this-secret")
        self.assertNotIn("do-not-log-this-secret", str(logs.output))
