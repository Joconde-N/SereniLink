import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_password_reset_email(to_email: str, reset_token: str):
    """Send a password reset link to the user."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP not configured - skipping reset email. Token: %s", reset_token)
        return

    reset_url = f"http://localhost:5173/reset-password?token={reset_token}"
    subject = "SereniLink - Reset Your Password"
    body = f"""Hello,

We received a request to reset your SereniLink password.

Click the link below to set a new password (valid for 30 minutes):

  {reset_url}

If you did not request this, you can safely ignore this email.

- The SereniLink Team""".strip()

    msg = MIMEMultipart()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, to_email, msg.as_string())
        logger.info("Password reset email sent to %s", to_email)
    except Exception as e:
        logger.error("Failed to send reset email to %s: %s", to_email, e)


def send_counselor_credentials(to_email: str, full_name: str, nickname: str, temp_password: str):
    """Send login credentials to a newly approved counselor."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            "SMTP not configured — skipping email. Credentials: nickname=%s password=%s",
            nickname, temp_password
        )
        return

    subject = "Welcome to SereniLink — Your Counselor Account is Ready"
    body = f"""
Hello {full_name},

Your application to join SereniLink as a counselor has been approved!

Here are your login credentials:

  Username: {nickname}
  Temporary Password: {temp_password}

Please log in at http://localhost:5173/login and you will be prompted to set a new password before accessing your dashboard.

If you have any questions, contact our support team.

— The SereniLink Team
""".strip()

    msg = MIMEMultipart()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, to_email, msg.as_string())
        logger.info("Credentials email sent to %s", to_email)
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, e)
