# SereniLink — Mental Health Support & Counseling Platform

SereniLink is an AI-powered mental health support platform that connects users with wellness tools, screenings, and professional counselors through a single web app.

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React, Vite, React Router, Axios, Context API, Recharts, Lucide icons |
| Backend | FastAPI, SQLAlchemy, PostgreSQL, Alembic, JWT, Argon2 |
| Realtime | WebSockets (booking chat) |
| AI | Hugging Face Router → GPT-OSS-20B (Groq) |

---

## Features

- **AI Chat** — guest and authenticated AI support with risk awareness and counselor referral
- **Screenings** — PHQ-9 and GAD-7 assessments with scoring and history
- **Mood tracking** — daily check-ins and wellness tips
- **Counseling** — browse counselors, filter by specialization, book sessions, real-time chat
- **Exercises & resources** — calm tools, articles, and self-help content
- **Support level** — Low / Moderate / High indicator based on screenings and mood (visible to user and their counselor only)
- **Audit logs** — admin search, filter, pagination, and CSV export of system activity
- **Light / dark theme** — persists across the whole app

---

## User Roles

| Role | Access |
|------|--------|
| **User** | Dashboard, screenings, mood, AI chat, find/book counselors, messages, exercises, resources, settings |
| **Counselor** | Availability, booking requests, sessions, client support levels, messages, profile, settings |
| **Admin** | Users, counselor applications, content, bookings, platform insights, audit logs, settings |

---

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

---

## Quick Start

### Backend

Use Python 3.11 (the version used for the backend tests), PostgreSQL, and a database
role allowed to create and alter tables. Create the `serenilink` database before
running setup; the application creates tables, not the database itself.

```bash
cd serenilink/backend
python -m venv venv
```

Activate the environment:

```powershell
# Windows PowerShell
.\venv\Scripts\Activate.ps1
```

```bash
# macOS / Linux
source venv/bin/activate
```

```bash
python -m pip install -r requirements.txt
```

Copy `serenilink/backend/.env.example` to `.env` in the same directory (`Copy-Item
.env.example .env` in PowerShell, or `cp .env.example .env` on macOS/Linux).
Keep an existing configured `.env`; do not overwrite it. Edit these values:

- `DATABASE_URL`: PostgreSQL connection URL; URL-encode special characters in
  usernames/passwords, for example `@` as `%40`. Use normal URL encoding in `.env`,
  not doubled percent signs.
- `JWT_SECRET`: a long random secret. **`SECRET_KEY` is not read by this app.**
  Generate a value with `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
- `HF_API_KEY`: Hugging Face token for AI requests. This setting is required at
  startup, even if you do not use the AI pages. `HF_BASE_URL` and `AI_MODEL` default
  to the Hugging Face Router and `openai/gpt-oss-20b:groq`.
- `FRONTEND_URL`: frontend origin for password-reset links.
- `ALLOWED_ORIGINS`: comma-separated CORS origins. Add `http://127.0.0.1:5173` if
  you open the frontend using that host instead of `localhost`.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`: email settings.
  SMTP uses STARTTLS. With blank credentials, password-reset and counselor-account
  emails are not delivered. The counselor welcome email currently has a hardcoded
  `http://localhost:5173/login` link; `FRONTEND_URL` only controls password-reset links.

The example includes the existing defaults for `APP_NAME`, `ENV`, `JWT_ALGORITHM`
and `JWT_EXPIRES_MINUTES` (10080 minutes / seven days). Settings read `.env` relative
to the working directory, so run backend commands from `serenilink/backend`.
Environment variables already set in your shell take precedence over `.env`.
Never commit real credentials; frontend `VITE_*` values are public browser settings.

`requirements.txt` includes email validation for Pydantic `EmailStr`, Uvicorn's
standard extras for WebSocket chat, and HTTPX for the backend TestClient tests.
Alembic 1.12+ supports `alembic check` and enables type comparison by default.

### Database setup and migrations

Run all commands below from `serenilink/backend` with the virtual environment
active and `DATABASE_URL` pointing to the intended PostgreSQL database.
`alembic.ini` and `alembic/env.py` are already configured; **do not run
`alembic init` again**. The environment imports all models into `Base.metadata`.

#### Fresh database using this repository

The committed revision `20260925_booking_safety` is a booking upgrade, **not a
full initial schema migration**. It requires the `bookings` and `availability_slots`
tables to exist. Therefore, `alembic upgrade head` alone fails on an empty database.
The current application calls `Base.metadata.create_all()` at startup. For a fresh
empty database, initialize those same model tables explicitly without starting the
server, then apply the committed migration:

```bash
python -c "from app.db.base import Base; import app.models; from app.db.session import engine; Base.metadata.create_all(bind=engine)"
python -m alembic upgrade head
python -m alembic current
```

Current models already create timezone-aware appointment columns and the active
booking index, so this fresh-database path needs no `legacy_timezone` argument.
Do not create a new initial migration for a normal checkout of this repository.

#### Applying existing migrations to an existing database

Stop the backend and back up the database first. Inspect the revision state:

```bash
python -m alembic current
python -m alembic heads
python -m alembic history
```

Normally, apply the committed revisions with:

```bash
python -m alembic upgrade head
```

If the booking-safety revision is still pending and historical appointment values
have no timezone, supply the timezone in which those appointments were originally
entered. For appointments entered in Rwanda local time:

```bash
python -m alembic -x legacy_timezone=Africa/Kigali upgrade head
```

Do not infer this timezone from the server's current location. See
[BOOKING_MIGRATION.md](serenilink/backend/BOOKING_MIGRATION.md) for mixed-zone data,
conflict checks, locking and backup requirements. The migration refuses duplicate
active bookings or overlapping active slots and does not delete them automatically.
Its automatic downgrade is disabled. Do not use `alembic stamp head` to bypass it:
that records a revision without applying its schema/data changes.

#### Checking for schema changes

After applying existing revisions, compare the database with current model metadata:

```bash
python -m alembic check
```

This does not generate a migration file or apply schema changes. A nonzero exit
can mean detected differences, an unapplied revision, or a connection/configuration
error; read the output. `current`/`heads` show revision state, while `check` compares
the schema. Autogenerate cannot reliably infer renames or required data conversions;
server-default comparison is not enabled in this project's Alembic environment.

#### Generating and applying a new migration

Use a development database at the existing head. After an intentional model change,
run these commands **before starting/reloading the backend**: its `create_all()`
can otherwise create new tables and hide those changes from autogenerate.

```bash
python -m alembic check
python -m alembic revision --autogenerate -m "Describe the schema change"
# Review the generated file in alembic/versions before applying it.
python -m alembic upgrade head
python -m alembic current
python -m alembic check
```

Only generate a revision when a schema change is needed. Review `upgrade()` and
`downgrade()`, destructive operations, defaults, constraints, imports and data
backfills. Generated references to custom types such as `app.core.datetime.UTCDateTime`
need a matching import or an appropriate SQLAlchemy type in the migration. Test the
reviewed migration on a disposable PostgreSQL database before deployment, then commit
it with the related model change. Do not edit already-applied revisions.

#### Initial migration creation (only for a new migration history)

This is background for a genuinely new project/history, **not a setup step for this
checkout**, which already has a root revision. With an already configured Alembic
environment, no existing revision files, and an empty development database (before
`create_all()` has run), the initial schema migration is generated with:

```bash
python -m alembic revision --autogenerate -m "Initial schema"
# Review that it creates the complete schema and has down_revision = None.
python -m alembic upgrade head
python -m alembic check
```

Generating against an already-created schema may produce an empty revision. Do not
delete this repository's migration history or generate a second root to follow this
example. A full migration-only bootstrap would require separately planned work.
See the [Alembic autogeneration guide](https://alembic.sqlalchemy.org/en/latest/autogenerate.html)
for candidate-migration review and detection limitations.

### Running the backend

After completing the appropriate database setup above:

```bash
python -m uvicorn app.main:app --reload
```

- API: http://127.0.0.1:8000
- Swagger docs: http://127.0.0.1:8000/docs
- Backend tests (isolated SQLite databases; they do not validate PostgreSQL migration
  behavior): `python -B -m unittest discover -s tests -v`

### Frontend

```bash
cd serenilink/frontend
npm install
```

Create `serenilink/frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

```bash
npm run dev
```

- App: http://localhost:5173

---

## Security

- JWT authentication
- Argon2 password hashing
- Role-based access control
- Rate limiting (SlowAPI)
- Secure password reset flow

---

## AI Safety

- Support levels: Low / Moderate / High (wellness indicator only — not a clinical diagnosis)
- High-risk chats show a **Book a Counselor** prompt
- Emergency numbers (Rwanda): **112** (national) · **114** (medical / ambulance)
