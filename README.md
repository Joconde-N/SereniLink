# SereniLink — Mental Health Support & Counseling Platform

SereniLink is an AI-powered mental health support platform that connects users with wellness tools, screenings, and professional counselors through a single web app.

## Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [User Roles](#user-roles)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Database Migrations](#database-migrations)
- [Testing](#testing)
- [Security and AI Safety](#security-and-ai-safety)

## Features

- **AI Chat** — guest and authenticated AI support with risk awareness and counselor referral
- **Screenings** — PHQ-9 and GAD-7 assessments with scoring and history
- **Mood tracking** — daily check-ins and wellness tips
- **Counseling** — browse counselors, filter by specialization, book sessions, real-time chat
- **Exercises & resources** — calm tools, articles, and self-help content
- **Support level** — Low / Moderate / High indicator based on screenings and mood (visible to user and their counselor only)
- **Audit logs** — admin search, filter, pagination, and CSV export of system activity
- **Light / dark theme** — persists across the whole app

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React, Vite, React Router, Axios, Context API, Recharts, Lucide icons |
| Backend | FastAPI, SQLAlchemy, PostgreSQL, Alembic, JWT, Argon2 |
| Realtime | WebSockets (booking chat) |
| AI | Hugging Face Router → GPT-OSS-20B (Groq) |

## User Roles

| Role | Access |
|------|--------|
| **User** | Dashboard, screenings, mood, AI chat, find/book counselors, messages, exercises, resources, settings |
| **Counselor** | Availability, booking requests, sessions, client support levels, messages, profile, settings |
| **Admin** | Users, counselor applications, content, bookings, platform insights, audit logs, settings |

## Project Structure

```
SereniLinkApp/
├── README.md
├── PROJECT_STRUCTURE.md   ← detailed file-by-file guide
├── .gitignore
└── serenilink/
    ├── backend/           ← FastAPI + PostgreSQL
    └── frontend/          ← React (Vite) SPA
```

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for a full breakdown of every folder and file.

## Getting Started

### Prerequisites

- **Python 3.11** ? the version used for backend tests.
- **PostgreSQL** ? create a `serenilink` database and a role allowed to create and alter tables.
- **Node.js and npm** ? for the React frontend.

The application creates tables, not the PostgreSQL database itself.

### 1. Set up the backend

From the repository root:

```bash
cd serenilink/backend
python -m venv venv
```

Activate the virtual environment using the command for your platform:

| Platform | Command |
|----------|---------|
| Windows PowerShell | `.\venv\Scripts\Activate.ps1` |
| macOS / Linux | `source venv/bin/activate` |

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Copy [backend/.env.example](serenilink/backend/.env.example) to `backend/.env`.
Keep your existing `.env` if it is already configured.

| Platform | Command (from `serenilink/backend`) |
|----------|------------------------------------|
| Windows PowerShell | `Copy-Item .env.example .env` |
| macOS / Linux | `cp .env.example .env` |

Set `DATABASE_URL`, `JWT_SECRET`, and `HF_API_KEY`. See
[Environment Configuration](#environment-configuration) for the complete reference.

### 2. Prepare the database

Choose the instructions that match your setup:

| Your database | Next step |
|---------------|-----------|
| New, empty database | [Initialize a fresh database](#initialize-a-fresh-database) |
| Existing application database | [Apply existing migrations](#apply-existing-migrations) |

**Do not generate a new initial migration for a normal checkout.** This repository
already has a migration history, but its first revision expects application tables
to exist. The fresh-database instructions account for this.

After completing the appropriate steps, start the backend from `serenilink/backend`:

```bash
python -m uvicorn app.main:app --reload
```

### 3. Set up the frontend

Open a second terminal at the repository root:

```bash
cd serenilink/frontend
npm install
```

Create or update `serenilink/frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the frontend:

```bash
npm run dev
```

### Local addresses

| Service | URL |
|---------|-----|
| Web application | http://localhost:5173 |
| Backend API | http://127.0.0.1:8000 |
| API documentation | http://127.0.0.1:8000/docs |

## Environment Configuration

Backend settings are defined in `app/core/config.py`. Run backend commands from
`serenilink/backend` so the application finds `.env`. Existing shell environment
variables take precedence over values in that file.

### Required settings

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection URL, such as `postgresql://USER:PASSWORD@localhost:5432/serenilink`. |
| `JWT_SECRET` | Long, random signing secret. The application does **not** read `SECRET_KEY`. |
| `HF_API_KEY` | Required at startup; a valid Hugging Face token is needed for AI requests. |

Generate a JWT secret:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

URL-encode special characters in database credentials, such as `@` as `%40`.
Use normal URL encoding in `.env`, not doubled percent signs. Never commit real
credentials. Frontend `VITE_*` values are public browser settings.

### Optional settings and defaults

| Variable | Default / purpose |
|----------|-------------------|
| `APP_NAME` | `SereniLink` |
| `ENV` | `dev` |
| `JWT_ALGORITHM` | `HS256` |
| `JWT_EXPIRES_MINUTES` | `10080` (seven days) |
| `HF_BASE_URL` | `https://router.huggingface.co/v1` |
| `AI_MODEL` | `openai/gpt-oss-20b:groq` |
| `FRONTEND_URL` | `http://localhost:5173`; used for password-reset links. |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000`; comma-separated CORS origins. |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587`; SMTP uses STARTTLS. |
| `SMTP_USER`, `SMTP_PASSWORD` | Blank by default; email delivery is disabled without credentials. |
| `SMTP_FROM` | `noreply@serenilink.com` |

**CORS:** add `http://127.0.0.1:5173` to `ALLOWED_ORIGINS` if you use that frontend
address. `localhost` and `127.0.0.1` are different origins.

**Email:** password-reset and counselor-account emails require SMTP credentials.
The counselor welcome email currently contains a hardcoded
`http://localhost:5173/login` link; `FRONTEND_URL` only controls password-reset links.

<details>
<summary>Backend dependency notes</summary>

`requirements.txt` includes Pydantic email validation for `EmailStr`, Uvicorn's
standard extras for WebSocket chat, and HTTPX for backend TestClient tests.
Alembic 1.12+ supports `alembic check` and enables type comparison by default.

</details>

## Database Migrations

Run these commands from `serenilink/backend`, with the virtual environment active
and `DATABASE_URL` pointing to the intended PostgreSQL database.

Alembic is already configured in `alembic.ini` and `alembic/env.py`, which imports
all models into `Base.metadata`. **Do not run `alembic init` again.**

### Initialize a fresh database

The committed revision `20260925_booking_safety` upgrades booking tables; it does
not create the full schema. Running `alembic upgrade head` on an empty database
therefore fails.

The application currently calls `Base.metadata.create_all()` at startup. For an
empty database, create those same model tables explicitly before applying the
committed migration:

```bash
python -c "from app.db.base import Base; import app.models; from app.db.session import engine; Base.metadata.create_all(bind=engine)"
python -m alembic upgrade head
python -m alembic current
```

Current models already create timezone-aware appointment columns and the active
booking index, so no `legacy_timezone` argument is needed for this fresh setup.

### Apply existing migrations

Stop the backend and back up the database. Inspect its revision state:

```bash
python -m alembic current
python -m alembic heads
python -m alembic history
```

For a database without legacy timezone conversion needs:

```bash
python -m alembic upgrade head
```

**Legacy booking timestamps:** if the booking-safety revision is pending and old
appointment values have no timezone, supply the timezone in which they were
originally entered. For historical appointments entered in Rwanda local time:

```bash
python -m alembic -x legacy_timezone=Africa/Kigali upgrade head
```

Do not infer the historical timezone from the server's current location. See
[Booking migration guidance](serenilink/backend/BOOKING_MIGRATION.md) for mixed-zone
data, conflict checks, locking and backups.

The migration refuses duplicate active bookings and overlapping active slots; it
does not delete conflicts automatically. Automatic downgrade is disabled. Do not
use `alembic stamp head` to bypass it: stamping records a revision without applying
its schema or data changes.

### Check for schema changes

After applying existing revisions:

```bash
python -m alembic check
```

| Command | What it checks |
|---------|----------------|
| `alembic current` | The database's recorded revision. |
| `alembic heads` | The latest revision(s) in the migration files. |
| `alembic check` | Differences between the database schema and model metadata. |

`check` neither creates a migration file nor applies schema changes. A nonzero exit
can indicate schema differences, unapplied revisions, or a connection/configuration
error; read the output. Autogenerate cannot reliably infer renames or data
conversions. Server-default comparison is not enabled in this project.

### Generate and apply a new migration

Use a development database at the existing head. After an intentional model change,
run the following **before starting or reloading the backend**: its `create_all()`
can create new tables and hide those differences from autogenerate.

```bash
python -m alembic check
python -m alembic revision --autogenerate -m "Describe the schema change"
```

Review the generated file in `alembic/versions` before applying it. Check
`upgrade()` and `downgrade()`, destructive operations, constraints, defaults,
imports and required data backfills. References to custom types such as
`app.core.datetime.UTCDateTime` need a matching import or an appropriate SQLAlchemy
type in the migration.

Test the reviewed migration on a disposable PostgreSQL database:

```bash
python -m alembic upgrade head
python -m alembic current
python -m alembic check
```

Only generate revisions for actual schema changes. Commit the reviewed migration
with its related model change; do not edit already-applied revisions.

<details>
<summary>Initial migration creation ? only for a new migration history</summary>

This is reference material for a genuinely new project/history, **not a setup step
for this checkout**, which already has a root revision.

With Alembic configured, no existing revision files, and an empty development
database before `create_all()` has run:

```bash
python -m alembic revision --autogenerate -m "Initial schema"
```

Review that the migration creates the complete schema and has
`down_revision = None`, then apply and check it:

```bash
python -m alembic upgrade head
python -m alembic check
```

Generating against an already-created schema may produce an empty revision. Do
not delete this repository's migration history or generate a second root to follow
this example. A full migration-only bootstrap requires separately planned work.

</details>

For further detail, see the
[Alembic autogeneration guide](https://alembic.sqlalchemy.org/en/latest/autogenerate.html).

## Testing

Run the backend regression tests from `serenilink/backend`:

```bash
python -B -m unittest discover -s tests -v
```

These tests use isolated SQLite databases. They do not validate PostgreSQL
migration execution or PostgreSQL-specific locking behavior.

## Security and AI Safety

- JWT authentication, Argon2 password hashing, and role-based access control.
- Rate limiting through SlowAPI and a secure password-reset flow.
- Low / Moderate / High support indicators are wellness guidance, not clinical diagnoses.
- High-risk chats show a **Book a Counselor** prompt.
- Rwanda emergency contacts: **112** (national) and **114** (medical / ambulance).
