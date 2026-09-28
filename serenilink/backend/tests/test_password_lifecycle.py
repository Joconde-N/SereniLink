from datetime import datetime, timedelta
from unittest import TestCase

import test_chat_and_booking as chat_tests
from starlette.websockets import WebSocketDisconnect
from app.core.security import hash_password, verify_password
from app.models import User


class PasswordLifecycleTests(TestCase):
    headers = chat_tests.ChatAndBookingTests.headers
    token = chat_tests.ChatAndBookingTests.token
    update = chat_tests.ChatAndBookingTests.update
    socket = chat_tests.ChatAndBookingTests.socket

    def setUp(self):
        chat_tests.ChatAndBookingTests.setUp(self)
        self.update(User, 1, password_hash=hash_password("OriginalPass9!"))

    def test_current_password_required_and_wrong_password_does_not_change_it(self):
        for payload, code in (({"new_password": "Replacement9!"}, 422),
                              ({"current_password": "wrong", "new_password": "Replacement9!"}, 400)):
            response = self.client.post("/auth/change-password", headers=self.headers(), json=payload)
            self.assertEqual(response.status_code, code, response.text)
        with self.sessions() as db:
            self.assertTrue(verify_password("OriginalPass9!", db.get(User, 1).password_hash))

    def test_change_revokes_old_http_and_websocket_tokens_and_returns_working_token(self):
        old_headers = self.headers()
        self.update(User, 1, password_reset_token="outstanding", password_reset_expires=datetime.utcnow() + timedelta(minutes=10))
        with self.socket() as ws:
            ws.receive_json()
            response = self.client.post("/auth/change-password", headers=old_headers,
                                        json={"current_password": "OriginalPass9!", "new_password": "Replacement9!"})
            self.assertEqual(response.status_code, 200, response.text)
            self.assertEqual(self.client.get("/auth/me", headers=old_headers).status_code, 401)
            new_headers = {"Authorization": "Bearer " + response.json()["access_token"]}
            self.assertEqual(self.client.get("/auth/me", headers=new_headers).status_code, 200)
            ws.send_json({"message": "old session"})
            with self.assertRaises(WebSocketDisconnect) as caught:
                ws.receive_json()
            self.assertEqual(caught.exception.code, 4401)
        with self.sessions() as db:
            self.assertIsNone(db.get(User, 1).password_reset_token)

    def test_reset_revokes_existing_session(self):
        old_headers = self.headers()
        self.update(User, 1, password_reset_token="reset", password_reset_expires=datetime.utcnow() + timedelta(minutes=10))
        response = self.client.post("/auth/reset-password", json={"token": "reset", "new_password": "Replacement9!"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get("/auth/me", headers=old_headers).status_code, 401)

    def test_temporary_password_is_enforced_by_api_then_unlocked(self):
        self.update(User, 1, must_change_password=True)
        headers = self.headers()
        self.assertEqual(self.client.get("/auth/me", headers=headers).status_code, 200)
        self.assertEqual(self.client.get("/bookings/me", headers=headers).status_code, 403)
        with self.socket() as ws:
            with self.assertRaises(WebSocketDisconnect):
                ws.receive_json()
        response = self.client.post("/auth/change-password", headers=headers,
                                    json={"current_password": "OriginalPass9!", "new_password": "Replacement9!"})
        self.assertEqual(response.status_code, 200, response.text)
        new_headers = {"Authorization": "Bearer " + response.json()["access_token"]}
        self.assertEqual(self.client.get("/bookings/me", headers=new_headers).status_code, 200)

    def test_shared_strength_policy_rejects_weak_password_in_all_flows(self):
        self.update(User, 1, password_reset_token="reset", password_reset_expires=datetime.utcnow() + timedelta(minutes=10))
        for password in ("Short1!", "lowercase9!", "MissingNumber!", "MissingSymbol9", " A1! "):
            for route, body in (
                ("/auth/register", {"nickname": "newperson", "password": password}),
                ("/auth/reset-password", {"token": "reset", "new_password": password}),
                ("/auth/change-password", {"current_password": "OriginalPass9!", "new_password": password}),
            ):
                with self.subTest(route=route, password=password):
                    response = self.client.post(route, headers=self.headers(), json=body)
                    self.assertEqual(response.status_code, 400, response.text)
