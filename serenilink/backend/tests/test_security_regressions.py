"""Run with python -B -m unittest discover -s tests -v (no application DB)."""
import os
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

# Import routers without importing main.py, which initializes database tables.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET"] = "security-tests-only"
os.environ["HF_API_KEY"] = "unused"

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from app.api.deps import get_current_user, get_db
from app.api.routes import audit_logs, files
from app.core.audit import log_action


class FileAccessTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "uploads"
        self.root.mkdir()
        self.document = self.root / "applications" / "certifications" / "test.pdf"
        self.document.parent.mkdir(parents=True)
        self.document.write_bytes(b"private certificate")
        self.outside = self.root.parent / "secret.txt"
        self.outside.write_text("must not be served")
        patcher = patch.object(files, "UPLOAD_DIR", self.root)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.app = FastAPI()
        self.app.include_router(files.router)
        self.client = TestClient(self.app)
        self.addCleanup(self.client.close)
        self.url = "/files/applications/certifications/test.pdf"

    def as_role(self, role):
        self.app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(role=role)

    def test_anonymous_is_denied(self):
        self.assertEqual(self.client.get(self.url).status_code, 401)

    def test_users_and_counselors_are_denied(self):
        for role in ("user", "counselor"):
            with self.subTest(role=role):
                self.as_role(role)
                self.assertEqual(self.client.get(self.url).status_code, 403)

    def test_admin_download(self):
        self.as_role("admin")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, b"private certificate")
        self.assertEqual(response.headers["cache-control"], "no-store")
        self.assertIn("attachment", response.headers["content-disposition"])

    def test_unsafe_paths_are_denied_even_for_admin(self):
        for path in ("../secret.txt", "applications/../../secret.txt", "/etc/passwd",
                     "C:/secret.txt", "C:secret.txt", "..\\secret.txt",
                     "\\\\server\\share", "test.pdf:stream", "bad\x00file"):
            with self.subTest(path=path), self.assertRaises(HTTPException) as caught:
                files.resolve_upload(path)
            self.assertEqual(caught.exception.status_code, 404)

    def test_encoded_traversal_is_denied(self):
        self.as_role("admin")
        for path in ("%2e%2e%2fsecret.txt", "%2e%2e%5csecret.txt", "%2fetc%2fpasswd"):
            with self.subTest(path=path):
                response = self.client.get("/files/" + path)
                self.assertEqual(response.status_code, 404)
                self.assertNotIn("must not be served", response.text)

    def test_missing_files_and_directories_are_denied(self):
        self.as_role("admin")
        for path in ("missing.pdf", "applications"):
            self.assertEqual(self.client.get("/files/" + path).status_code, 404)

    def test_resolved_symlink_escape_is_denied(self):
        # Mock the OS resolution so this also runs on Windows without the
        # privilege required to create symlinks.
        with patch.object(Path, "resolve", side_effect=[self.root, self.outside]):
            with self.assertRaises(HTTPException) as caught:
                files.resolve_upload("linked.txt")
        self.assertEqual(caught.exception.status_code, 404)


class AuditPrivacyTests(unittest.TestCase):
    def setUp(self):
        self.user = SimpleNamespace(id=1, nickname="person", role="user")
        self.sensitive = "PHQ9 completed, score=27, severity=Severe"

    def test_new_screening_entries_never_store_results(self):
        db = MagicMock()
        log_action(db, "ASSESSMENT_COMPLETED", user=self.user, resource="screening",
                   resource_id=9, detail=self.sensitive)
        entry = db.add.call_args.args[0]
        self.assertEqual(entry.detail, "Screening completed")
        self.assertEqual(entry.user_id, 1)
        db.commit.assert_called_once()

    def test_non_health_audit_details_are_preserved(self):
        db = MagicMock()
        log_action(db, "USER_LOGIN", user=self.user, resource="auth", detail="User logged in")
        self.assertEqual(db.add.call_args.args[0].detail, "User logged in")

    def test_all_admin_read_and_export_routes_redact_legacy_results(self):
        legacy = SimpleNamespace(
            id=1, user_id=1, user_nickname="person", user_role="user",
            action="ASSESSMENT_COMPLETED", resource="screening", resource_id="9",
            detail=self.sensitive, ip_address="127.0.0.1", created_at=datetime(2026, 1, 1),
        )
        db = MagicMock()
        query = db.query.return_value
        for method in ("filter", "order_by", "offset", "limit"):
            getattr(query, method).return_value = query
        query.count.return_value = 1
        query.all.return_value = [legacy]
        app = FastAPI()
        app.include_router(audit_logs.router)
        app.dependency_overrides[get_db] = lambda: db
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(role="admin")
        with TestClient(app) as client:
            for route in ("/audit-logs/", "/audit-logs/export-json", "/audit-logs/export-csv"):
                with self.subTest(route=route):
                    response = client.get(route)
                    self.assertEqual(response.status_code, 200)
                    self.assertIn("Screening completed", response.text)
                    for value in ("PHQ9", "score=27", "Severe"):
                        self.assertNotIn(value, response.text)
        self.assertEqual(legacy.detail, self.sensitive)  # Reads never mutate DB rows.


if __name__ == "__main__":
    unittest.main()
