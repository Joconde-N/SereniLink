# SereniLink — Project Structure Guide

This document explains **how the codebase is organized**, **what each important file does**, and **how to find things quickly**.

Start here if you are new to the repo. For setup commands, see [README.md](./README.md).

## Contents

- [Big Picture](#big-picture)
- [How to Navigate (Cheat Sheet)](#how-to-navigate-cheat-sheet)
- [Frontend Structure](#frontend-structure)
- [Backend Structure](#backend-structure)
- [Migrations and Configuration](#migrations-and-configuration)
- [Tests](#tests)
- [Specialization Filtering](#specialization-filtering-how-it-works)
- [Theme System](#theme-system-how-light-mode-works)
- [Auth and Route Protection](#auth--route-protection-flow)
- [Naming Conventions](#naming-conventions)
- [Suggested Learning Path](#suggested-learning-path)

## Big Picture

```text
SereniLinkApp/
├── README.md
├── PROJECT_STRUCTURE.md          ← this file
├── .gitignore
└── serenilink/
    ├── backend/                  ← Python FastAPI API
    └── frontend/                 ← React (Vite) single-page app
```

- The **frontend** talks to the **backend** over HTTP (REST) and WebSockets (booking chat).
- Auth uses JWT tokens stored on the client; `AuthContext` keeps the logged-in user.
- Theme (light/dark) is global via `ThemeContext` and `body.light` / `body.dark` CSS classes.

## How to Navigate (Cheat Sheet)

| I want to… | Go here |
|------------|---------|
| Change a public page (Home, About, …) | `frontend/src/pages/<name>/` |
| Change login / register UI | `frontend/src/pages/login/` or `register/` |
| Change user dashboard screens | `frontend/src/pages/user-dashboard/` |
| Change counselor dashboard screens | `frontend/src/pages/counselor-dashboard/` |
| Change admin dashboard screens | `frontend/src/pages/admin-dashboard/` |
| Change sidebar / shell layout | `frontend/src/components/<role>-dashboard/` |
| Change shared UI (loader, settings, auth gate) | `frontend/src/components/shared/` |
| Change routes / who can open a page | `frontend/src/App.jsx` |
| Change API base URL / axios | `frontend/src/api/axios.js` |
| Change an API endpoint | `backend/app/api/routes/<feature>.py` |
| Change a database table | `backend/app/models/<feature>.py` |
| Change request/response shapes | `backend/app/schemas/<feature>.py` |
| Change JWT / password hashing | `backend/app/core/security.py` |
| Change env settings | `backend/app/core/config.py` + `backend/.env.example`; local values in `backend/.env` |
| Understand database setup / migrations | `README.md`, `backend/alembic/`, `backend/BOOKING_MIGRATION.md` |
| Change theme persistence / palette | `frontend/src/context/ThemeContext.jsx`, `utils/theme.js`, `components/user-dashboard/DashboardLayout.css` |
| Find regression tests | `frontend/tests/`, `backend/tests/` |
| Register routers | `backend/app/main.py` |

## Frontend Structure

Root: `serenilink/frontend/`

```text
frontend/
├── package.json
├── index.html
├── .env                         ← VITE_API_URL
└── src/
    ├── main.jsx                 ← React entry: providers + CSS
    ├── App.jsx                  ← All routes + ProtectedRoute
    ├── api/
    ├── assets/
    ├── components/
    ├── context/
    ├── hooks/
    ├── pages/
    ├── styles/
    └── utils/
```

### Entry & routing

| File | Role |
|------|------|
| `index.html` | Restores the saved theme before React renders, then loads `src/main.jsx` |
| `src/main.jsx` | Mounts the app; wraps with `BrowserRouter`, `ThemeProvider`, `AuthProvider`; loads global CSS |
| `src/App.jsx` | Declares public and role-specific routes; uses `PublicOnlyRoute` for the home page, `ProtectedRoute` for dashboards, and `ErrorBoundary` around the route tree |

### `src/api/`

| File | Role |
|------|------|
| `axios.js` | Shared HTTP client using `VITE_API_URL`; attaches JWTs, normalizes errors, handles expired sessions, and saves replacement tokens after password changes |
| `errors.js` | Converts API validation payloads into readable error messages and preserves validation details |

### `src/context/`

| File | Role |
|------|------|
| `AuthContext.jsx` | Restores the current user; login/logout; keeps remembered tokens in localStorage and other tokens in sessionStorage |
| `ThemeContext.jsx` | Global light/dark state; applies the theme before paint and synchronizes changes across tabs through storage events |

### `src/hooks/`

| File | Role |
|------|------|
| `useBookingChat.js` | Booking WebSocket connection, message history and sends; REST fallback for history/send requests (not periodic polling) |
| `useUnreadCount.js` | Polls notifications and returns unread count for badges |

### `src/utils/`

| File | Role |
|------|------|
| `chatWs.js` | Builds the WebSocket URL for booking chat (includes token) |
| `reportPdf.js` | Shared `buildReportPdf()` helper — branded A4 PDF with header, footer, striped tables, totals row support |
| `password.js` | Shared password-strength validation and help text for account forms |
| `theme.js` | Validates saved themes, applies body classes and browser color scheme, and safely reads/writes storage |

### `src/styles/`

| File | Role |
|------|------|
| `global.css` | Public chrome, calendar styling, theme transitions, reduced-motion support and light-mode overrides |

### `src/assets/`

Bundled page images, authentication illustrations, counselor portraits in
`counselors/`, and resource thumbnails in `resources/`. These are frontend assets,
separate from private documents uploaded to the backend.

### `src/components/`

Grouped by **where they are used**.

#### `components/shared/` — reusable across roles

| File | Role |
|------|------|
| `ProtectedRoute.jsx` | Waits for session restoration, blocks unauthenticated users and redirects wrong roles |
| `PublicOnlyRoute.jsx` | Waits for session restoration and redirects signed-in visitors to their role dashboard |
| `ErrorBoundary.jsx` | Catches React render errors; shows a safe fallback |
| `PageLoader.jsx` | Full-page loading spinner |
| `SettingsPage.jsx` | Shared settings UI (profile email, password, theme) with small role differences |
| `ChangePasswordModal.jsx` | Forced password-change overlay for newly approved counselors |
| `ExportMenu.jsx` | Dropdown button with CSV and PDF export options; used across admin pages |

#### `components/layout/` — public site chrome

| File | Role |
|------|------|
| `Layout.jsx` | Wraps public pages with Navbar + Footer + outlet |
| `Navbar.jsx` | Top nav + theme toggle |
| `Footer.jsx` | Site footer |
| `GuestChatWidget.jsx` | Floating guest AI chat entry |

#### `components/user-dashboard/`

| File | Role |
|------|------|
| `DashboardLayout.jsx` | User shell (sidebar + main + notification bell) |
| `DashboardLayout.css` | Shared dark/light palette, projection-friendly light colors, status/chart tokens, form focus styles and dashboard layout |
| `DashboardSidebar.jsx` | User nav links + unread badge |
| `MobileSidebarDrawer.jsx` | Mobile sidebar behavior |
| `NotificationBell.jsx` | Top-right bell with unread badge |
| `RiskMonitorCard.jsx` | User-facing support level + recommendations |

#### `components/counselor-dashboard/`

| File | Role |
|------|------|
| `CounselorLayout.jsx` | Counselor shell; shows `ChangePasswordModal` when required |
| `CounselorSidebar.jsx` | Counselor nav + unread badge |
| `PatientRiskCard.jsx` | Risk/support card for a client |

#### `components/admin-dashboard/`

| File | Role |
|------|------|
| `AdminLayout.jsx` | Admin shell |
| `AdminSidebar.jsx` | Admin nav |

### `src/pages/`

Most page folders use lowercase or kebab-case names. The tables below follow the
current source import paths. Git records the login directory as `pages/Login/`,
while imports use `pages/login/`; this casing difference matters on case-sensitive
filesystems. No files are renamed by this guide.

#### Public

| Folder / file | Role |
|---------------|------|
| `home/Home.jsx` | Landing page; calm tools, resources preview, how it works steps |
| `home/Home.css` | Landing page styles |
| `home/GuestAiSupport.jsx` | Guest AI chat full page |
| `about/About.jsx` | About Us — who we are, mission, vision, values, bottom CTA |
| `about/About.css` | About page styles |
| `counselors/Counselors.jsx` | Public counselor directory + specialization filter |
| `counselors/Counselors.css` | Counselors page styles |
| `resources/Resources.jsx` | Public resources list |
| `resources/ResourceView.jsx` | Single resource view |
| `resources/Resources.css` | Resources page styles |
| `login/Login.jsx` | Login (+ forgot password modal) |
| `login/Login.css` | Login page styles |
| `login/ResetPassword.jsx` | Password reset from email link |
| `register/Register.jsx` | User registration |
| `register/Register.css` | Register page styles |
| `counselor-application/CounselorApplication.jsx` | Apply to become a counselor |
| `counselor-application/CounselorApplication.css` | Counselor application page styles |
| `NotFound.jsx` | 404 page |

#### User dashboard (`pages/user-dashboard/`)

| File | Role |
|------|------|
| `Overview.jsx` | Welcome, quick actions, stats, risk card, sessions, tips |
| `FindCounselors.jsx` | Authenticated counselor browse + booking |
| `MyBookings.jsx` / `BookingDetails.jsx` | User bookings |
| `SessionChat.jsx` | Live chat with counselor for a booking |
| `Messages.jsx` | List of chat threads (shows counselor name) |
| `Screenings.jsx` | PHQ-9 / GAD-7 |
| `MoodCheckins.jsx` | Mood check-ins |
| `AiSupport.jsx` | Logged-in AI chat (+ high-risk book CTA) |
| `Exercises.jsx` | Wellness exercises |
| `DashboardResources.jsx` | In-app resources |
| `Progress.jsx` | Progress tracking |
| `Notifications.jsx` | Notification list |
| `Settings.jsx` | Thin wrapper → shared `SettingsPage` |

#### Counselor dashboard (`pages/counselor-dashboard/`)

| File | Role |
|------|------|
| `CounselorOverview.jsx` | Stats + quick actions |
| `BookingRequests.jsx` | Pending appointment requests |
| `MySessions.jsx` / `CounselorBookingDetails.jsx` | Sessions |
| `MyAvailability.jsx` | Availability slots |
| `MyClients.jsx` | Assigned clients + expandable assessment history |
| `CounselorMessages.jsx` / `CounselorChat.jsx` | Messaging (shows user nickname) |
| `CounselorNotifications.jsx` | Notifications |
| `CounselorProfile.jsx` | Counselor profile edit |
| `CounselorSettings.jsx` | Thin wrapper → shared `SettingsPage` |

#### Admin dashboard (`pages/admin-dashboard/`)

| File | Role |
|------|------|
| `AdminOverview.jsx` | Summary + quick actions |
| `CounselorApplications.jsx` | Approve / reject applications |
| `AdminUsers.jsx` / `AdminCounselors.jsx` | User & counselor management |
| `BookingsManagement.jsx` | All bookings |
| `ContentManagement.jsx` / `ExercisesManagement.jsx` | Content & exercises CRUD |
| `AdminInsights.jsx` | Charts, anonymous support-level distribution, 30-day trends; CSV + PDF export |
| `AdminAuditLogs.jsx` | Searchable/filterable audit log table; CSV + PDF export |
| `AdminProfile.jsx` | Read-only admin account info (id, nickname, email, role) |
| `AdminSettings.jsx` | Thin wrapper → shared `SettingsPage` |

## Backend Structure

Root: `serenilink/backend/`

```text
backend/
├── .env / .env.example
├── requirements.txt
├── alembic.ini
├── alembic/                     ← DB migrations
├── uploads/                     ← uploaded files (images, docs)
└── app/
    ├── main.py                  ← FastAPI app + router includes
    ├── api/
    ├── core/
    ├── db/
    ├── models/
    └── schemas/
```

### Pattern (important)

For almost every feature you will see three matching pieces:

1. **`models/`** — SQLAlchemy table
2. **`schemas/`** — Pydantic request/response shapes
3. **`api/routes/`** — HTTP (or WebSocket) endpoints

Example: bookings → `models/booking.py` + `schemas/booking.py` + `api/routes/booking.py`

### `app/main.py`

Creates the FastAPI app, configures CORS and rate limiting, registers routers, and
ensures the uploads directory exists. It also calls `Base.metadata.create_all()`
and checks PostgreSQL booking timestamps and the active-booking index at startup.
Those checks can block startup until the booking migration is applied. Uploaded
files are served through the protected files router, not a public static mount.

### `app/api/`

| Path | Role |
|------|------|
| `deps.py` | Database sessions, JWT/password-version validation, disabled-account and required-password-change checks, and admin authorization |
| `routes/*.py` | One module per feature area (see table below) |

#### Route modules

| File | Responsibility |
|------|----------------|
| `auth.py` | Registration, login, profile, password reset and password change |
| `admin_users.py` | Admin user management |
| `counselors.py` | Counselor list, profile, **specializations** (split/deduped tags), filter by tag |
| `counselor_applications.py` | Apply / admin review |
| `booking.py` | Booking lifecycle, slot claims, session timing and names for chat lists |
| `availability.py` | Counselor slots, timezone-aware scheduling and overlap checks |
| `chat.py` | REST messages + **WebSocket** `/chat/ws/{booking_id}` |
| `ai.py` / `ai_guest.py` | Authenticated & guest AI chat |
| `screenings.py` | PHQ-9 / GAD-7 |
| `moods.py` | Mood check-ins |
| `assessment.py` | Assessment-related endpoints |
| `risk_monitoring.py` | Support level calculation & recommendations (user self, counselor view, admin anonymous stats) |
| `content.py` / `exercises.py` | Educational content & exercises |
| `notifications.py` | User notifications |
| `progress.py` | Progress data |
| `session_notes.py` | Counselor session notes |
| `dashboard.py` | Dashboard summary payloads (user `/me`, admin `/insights` with 30-day trends) |
| `audit_logs.py` | Admin audit log list, JSON export (for PDF), CSV export with context header |
| `files.py` | Admin-only uploaded-document downloads with path traversal and symlink checks |

### `app/core/`

| File | Role |
|------|------|
| `config.py` | Pydantic settings from environment and backend `.env`; includes `DATABASE_URL`, `JWT_SECRET`, AI, SMTP and CORS settings |
| `security.py` | JWT creation, password hashing/strength checks, and password-bound token validation |
| `ai_client.py` | Creates the OpenAI-compatible client for the configured Hugging Face Router endpoint and model |
| `email.py` | Outbound email helpers (e.g. reset) |
| `audit.py` | `log_action()` helper — writes AuditLog rows; accepts ip_address from routes |
| `datetime.py` | `utc_now()` and `UTCDateTime`: timezone-aware values for PostgreSQL and UTC handling in SQLite tests |
| `rate_limit.py` | Shared SlowAPI limiter, middleware setup and rate-limit error handling |

### `app/db/`

| File | Role |
|------|------|
| `base.py` | SQLAlchemy declarative base |
| `session.py` | Engine + session factory |

### `app/models/` & `app/schemas/`

Models define database tables; schemas define API payloads. They are related but
not one-to-one: for example, audit logs have a model without a dedicated schema
module, while authentication has a schema without an `auth` table model.

| Model modules | Domain |
|---------------|--------|
| `user.py`, `counselor.py`, `counselor_application.py` | Accounts, counselor profiles and applications |
| `booking.py`, `availability.py`, `chat.py`, `session_note.py` | Scheduling, session chat and counselor notes |
| `assessment.py`, `screening.py`, `mood.py`, `progress.py` | Assessments, screenings and wellness tracking |
| `ai_conversation.py`, `ai_message.py`, `user_ai_summary.py` | AI conversation history and summaries |
| `content.py`, `exercise.py`, `exercise_log.py` | Resources, exercises and completion records |
| `notification.py`, `audit_log.py` | Notifications and audit history |

`models/__init__.py` imports all model classes so Alembic and table initialization
can see them. Schema modules cover `ai`, `assessment`, `auth`, `availability`,
`booking`, `chat`, `content`, `counselor`, `counselor_application`, `exercise`,
`mood`, `notification`, `progress`, `screening`, `session_note` and `user`.

## Migrations and Configuration

| Path (under `serenilink/`) | Purpose |
|---------------------------|---------|
| `backend/.env.example` | Complete backend settings template, without real credentials |
| `backend/requirements.txt` | Backend dependencies, including email validation and WebSocket support |
| `backend/alembic.ini` | Alembic script location and logging configuration |
| `backend/alembic/env.py` | Loads `DATABASE_URL`, handles encoded URL characters and imports model metadata |
| `backend/alembic/script.py.mako` | Template used when generating a revision |
| `backend/alembic/versions/20260925_booking_safety.py` | Existing root revision: converts legacy booking timestamps and adds active-slot uniqueness |
| `backend/BOOKING_MIGRATION.md` | Historical timezone selection, conflicts, backups and migration validation |
| `frontend/package.json`, `frontend/package-lock.json` | Frontend scripts, dependencies and resolved npm versions |
| `frontend/.env` | Local `VITE_API_URL` setting; values are exposed to browser code |

The current migration is **not a complete initial schema migration**. It expects
application tables to exist. Follow the [README migration guide](README.md#database-migrations)
for fresh initialization, existing databases, schema checks and new revisions.

Local `.env` files, virtual environments, `node_modules/`, caches and generated
build output are not source-code sections of this guide. `backend/uploads/` holds
runtime documents; it is not interchangeable with frontend assets.

## Tests

### Frontend (`serenilink/frontend/tests/`)

| File | Coverage |
|------|----------|
| `api-errors.test.mjs` | Readable API errors, validation rendering, password rules and replacement-token storage |
| `theme.test.mjs` | Theme persistence, invalid/blocked storage and early HTML theme restoration |

Run from `serenilink/frontend`:

```bash
node --test tests/api-errors.test.mjs tests/theme.test.mjs
npm run build
```

### Backend (`serenilink/backend/tests/`)

| File | Coverage |
|------|----------|
| `test_booking_safety.py` | UTC scheduling, overlaps, active-slot uniqueness and concurrent claims |
| `test_chat_and_booking.py` | Booking lifecycle and HTTP/WebSocket chat access |
| `test_checkins_and_recovery.py` | Atomic mood check-ins and password recovery |
| `test_password_lifecycle.py` | Password changes, session invalidation and required first password change |
| `test_profiles_and_limits.py` | Profile email validation and API rate limits |
| `test_security_regressions.py` | Audit privacy and protected uploaded-file access |

Run from `serenilink/backend` with the virtual environment active:

```bash
python -B -m unittest discover -s tests -v
```

Backend tests use isolated SQLite databases. PostgreSQL migration execution and
PostgreSQL-specific locking require separate validation.

## Specialization Filtering (How It Works)

Counselors store specializations as a **comma-separated string**, e.g. `Anxiety, Stress`.

1. **`GET /counselors/specializations`**
   Splits every row on commas → trims → **dedupes** (case-insensitive) → sorted list of tags.

2. **`GET /counselors/?specialization=Anxiety`**
   Matches any counselor whose field **contains** that tag (so `Anxiety, Stress` is included).

3. **UI**
   Public `Counselors.jsx` and dashboard `FindCounselors.jsx` both load options from `/specializations`.

## Theme System (How Light Mode Works)

1. `index.html` restores the saved theme before React renders, preventing a wrong-theme flash.
2. `ThemeContext` wraps the entire app in `main.jsx`, so route changes share the same selection.
3. `utils/theme.js` validates `light`/`dark`, safely handles storage, sets the body class and updates the browser color scheme.
4. `DashboardLayout.css` supplies the global palette; light-only status and chart tokens preserve dark-mode fallback colors.
5. Public page CSS applies additional `body.light` overrides. `global.css` coordinates transitions and respects reduced-motion preferences.
6. Navbar and settings use the same context. Selection persists across reloads and sign-in/sign-out, and storage events synchronize open tabs.

## Auth & Route Protection Flow

```text
User opens /dashboard
        ↓
ProtectedRoute checks AuthContext
        ↓
  loading? → PageLoader
  no user? → /login
  wrong role? → redirect to that role’s home
  ok → render DashboardLayout + child page
```

`PublicOnlyRoute` protects the home-page entry from showing to signed-in users;
`App.jsx` does not wrap every public page with it. Server-side checks in
`app/api/deps.py` enforce account and role access independently of frontend routing.
Password changes/reset invalidate tokens tied to the old password; newly approved
counselors must change their temporary password before using protected endpoints.

Roles:

- `user` → `/dashboard`
- `counselor` → `/counselor`
- `admin` → `/admin`

## Naming Conventions

| Area | Convention | Example |
|------|------------|---------|
| Page folders | Mostly lowercase / kebab-case; see login casing note above | `counselor-application/`, `user-dashboard/` |
| React components | PascalCase files | `MyClients.jsx` |
| Shared UI | under `components/shared/` | `SettingsPage.jsx` |
| Backend routes | snake_case modules | `risk_monitoring.py` |
| CSS | same name as page | `Home.jsx` + `Home.css` |

## Suggested Learning Path

1. Read `frontend/src/App.jsx` — see every route.
2. Open `backend/app/main.py` — see every API router.
3. Pick one feature (e.g. bookings): follow `booking` model → schema → route → matching frontend page.
4. Skim `AuthContext`, `PublicOnlyRoute` and `ProtectedRoute` to understand login gates.
5. Skim `ThemeContext` + one public CSS file’s `body.light` block to understand theming.
