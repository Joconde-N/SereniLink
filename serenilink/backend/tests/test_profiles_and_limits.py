from unittest import TestCase
from unittest.mock import MagicMock, patch
from types import SimpleNamespace

import test_chat_and_booking as chat_tests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient
from app.api.deps import get_db, get_current_user
from app.api.routes import auth, ai, ai_guest, counselor_applications
from app.core.rate_limit import install_rate_limiting, limiter
from app.models import User


class ProfileEmailTests(TestCase):
    headers = chat_tests.ChatAndBookingTests.headers
    token = chat_tests.ChatAndBookingTests.token
    update = chat_tests.ChatAndBookingTests.update

    def setUp(self):
        chat_tests.ChatAndBookingTests.setUp(self)
        self.update(User, 1, email="before@example.com")

    def test_invalid_email_does_not_persist_or_break_profile(self):
        response = self.client.patch("/auth/me", headers=self.headers(), json={"email": "not-an-email"})
        self.assertEqual(response.status_code, 422)
        profile = self.client.get("/auth/me", headers=self.headers())
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.json()["email"], "before@example.com")

    def test_blank_null_and_whitespace_clear_optional_email(self):
        for value in ("", "   ", None):
            self.update(User, 1, email="before@example.com")
            response = self.client.patch("/auth/me", headers=self.headers(), json={"email": value})
            self.assertEqual(response.status_code, 200, response.text)
            self.assertIsNone(response.json()["email"])
            self.assertEqual(self.client.get("/auth/me", headers=self.headers()).status_code, 200)

    def test_omission_preserves_email_and_duplicate_is_rejected(self):
        response = self.client.patch("/auth/me", headers=self.headers(), json={})
        self.assertEqual(response.json()["email"], "before@example.com")
        self.update(User, 3, email="taken@example.com")
        response = self.client.patch("/auth/me", headers=self.headers(), json={"email": "taken@example.com"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.client.get("/auth/me", headers=self.headers()).json()["email"], "before@example.com")

    def test_valid_update_normalizes_and_clears_old_reset_link(self):
        self.update(User, 1, password_reset_token="old-email-link")
        response = self.client.patch("/auth/me", headers=self.headers(), json={"email": "  new@EXAMPLE.COM  "})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["email"], "new@example.com")
        with self.sessions() as db:
            self.assertIsNone(db.get(User, 1).password_reset_token)


class RateLimitTests(TestCase):
    def setUp(self):
        limiter.reset()
        self.addCleanup(limiter.reset)
        enabled = patch.object(limiter, "enabled", True)
        enabled.start()
        self.addCleanup(enabled.stop)
        app = FastAPI()
        install_rate_limiting(app)
        app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])
        for router in (auth.router, ai.router, ai_guest.router, counselor_applications.router):
            app.include_router(router)
        @app.get("/ordinary")
        def ordinary():
            return {"ok": True}
        self.db = MagicMock()
        self.db.query.return_value.filter.return_value.first.return_value = None
        app.dependency_overrides[get_db] = lambda: self.db
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=1)
        self.client = TestClient(app)
        self.addCleanup(self.client.close)

    def test_default_limit_applies_to_undecorated_routes_and_keeps_cors(self):
        for _ in range(200):
            self.assertEqual(self.client.get("/ordinary").status_code, 200)
        response = self.client.get("/ordinary", headers={"Origin": "http://localhost:5173"})
        self.assertEqual(response.status_code, 429)
        self.assertIsInstance(response.json()["detail"], str)
        self.assertEqual(response.headers["access-control-allow-origin"], "http://localhost:5173")
        self.assertEqual(response.headers["retry-after"], "60")

    def test_existing_login_and_forgot_password_limits_still_work(self):
        for _ in range(5):
            self.assertEqual(self.client.post("/auth/forgot-password", json={"email": "missing@example.com"}).status_code, 200)
        self.assertEqual(self.client.post("/auth/forgot-password", json={"email": "missing@example.com"}).status_code, 429)
        for _ in range(10):
            self.assertEqual(self.client.post("/auth/login", data={"username": "missing", "password": "invalid"}).status_code, 401)
        self.assertEqual(self.client.post("/auth/login", data={"username": "missing", "password": "invalid"}).status_code, 429)

    def test_ai_limit_stops_work_before_model_or_database_writes(self):
        with patch.object(ai, "get_or_create_conversation", side_effect=HTTPException(418, "test sentinel")) as work:
            for _ in range(10):
                self.assertEqual(self.client.post("/ai/chat", json={"message": "hello"}).status_code, 418)
            self.assertEqual(self.client.post("/ai/chat", json={"message": "hello"}).status_code, 429)
            self.assertEqual(work.call_count, 10)

    def test_upload_limit_and_reset_limit(self):
        # Existing application short-circuits the upload handler without saving files.
        self.db.query.return_value.filter.return_value.first.return_value = SimpleNamespace()
        data = {"full_name": "Test Applicant", "email": "test@example.com", "specialization": "General"}
        for _ in range(5):
            self.assertEqual(self.client.post("/counselor-applications/", data=data).status_code, 409)
        self.assertEqual(self.client.post("/counselor-applications/", data=data).status_code, 429)
        self.db.query.return_value.filter.return_value.with_for_update.return_value.first.return_value = None
        for _ in range(10):
            self.assertEqual(self.client.post("/auth/reset-password", json={"token": "invalid", "new_password": "Password9!"}).status_code, 400)
        self.assertEqual(self.client.post("/auth/reset-password", json={"token": "invalid", "new_password": "Password9!"}).status_code, 429)
