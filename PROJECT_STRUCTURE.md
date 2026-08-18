# SereniLink — Project Structure Guide

This document explains **how the codebase is organized**, **what each important file does**, and **how to find things quickly**.

Start here if you are new to the repo. For setup commands, see [README.md](./README.md).

---

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

---

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
| Change env settings | `backend/app/core/config.py` + `.env` |
| Register routers | `backend/app/main.py` |

---

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
| `src/main.jsx` | Mounts the app; wraps with `BrowserRouter`, `ThemeProvider`, `AuthProvider`; loads global CSS |
| `src/App.jsx` | Declares public routes, `/dashboard/*`, `/counselor/*`, `/admin/*`; wraps dashboards in `ProtectedRoute` and the whole tree in `ErrorBoundary` |

### `src/api/`

| File | Role |
|------|------|
| `axios.js` | Axios instance with `baseURL` from `VITE_API_URL`; attaches JWT to requests |

### `src/context/`

| File | Role |
|------|------|
| `AuthContext.jsx` | Login / logout / current user; persists token |
| `ThemeContext.jsx` | `dark` / `light` theme; saves to `localStorage`; sets `body` class |

### `src/hooks/`

| File | Role |
|------|------|
| `useBookingChat.js` | WebSocket chat for a booking; falls back to REST polling |
| `useUnreadCount.js` | Polls notifications and returns unread count for badges |

### `src/utils/`

| File | Role |
|------|------|
| `chatWs.js` | Builds the WebSocket URL for booking chat (includes token) |
| `reportPdf.js` | Shared `buildReportPdf()` helper — branded A4 PDF with header, footer, striped tables, totals row support |

### `src/styles/`

| File | Role |
|------|------|
| `global.css` | Site-wide styles: navbar, footer, public chrome, light-mode overrides |



### `src/components/`

Grouped by **where they are used**.

#### `components/shared/` — reusable across roles

| File | Role |
|------|------|
| `ProtectedRoute.jsx` | Blocks unauthenticated users; redirects wrong roles |
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
| `DashboardLayout.css` | Dashboard theme variables (dark + light) and shared dashboard styles |
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

---

### `src/pages/`

Page folders use **kebab-case** names.

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
| `MyBookings.jsx` | List of all user bookings with status badges |

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
| `CounselorBookingDetails.jsx` | Full detail view of a single booking for the counselor |

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

---

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

Creates the FastAPI app, CORS, rate limiting, and **includes all routers**.

### `app/api/`

| Path | Role |
|------|------|
| `deps.py` | Shared dependencies: `get_db`, `get_current_user`, role helpers |
| `routes/*.py` | One module per feature area (see table below) |

#### Route modules

| File | Responsibility |
|------|----------------|
| `auth.py` | Register, login, password reset, profile |
| `admin_users.py` | Admin user management |
| `counselors.py` | Counselor list, profile, **specializations** (split/deduped tags), filter by tag |
| `counselor_applications.py` | Apply / admin review |
| `booking.py` | Create/list/update bookings; enriches names for chat lists |
| `availability.py` | Counselor slots |
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

### `app/core/`

| File | Role |
|------|------|
| `config.py` | Settings from environment |
| `security.py` | JWT create/verify, password hashing |
| `ai_client.py` | Calls Hugging Face / Groq model |
| `email.py` | Outbound email helpers (e.g. reset) |
| `audit.py` | `log_action()` helper — writes AuditLog rows; accepts ip_address from routes |

### `app/db/`

| File | Role |
|------|------|
| `base.py` | SQLAlchemy declarative base |
| `session.py` | Engine + session factory |

### `app/models/` & `app/schemas/`

Mirror each domain entity (`user`, `counselor`, `booking`, `screening`, `audit_log`, …).  
`models/__init__.py` imports models so Alembic / metadata see them.

---

## Specialization Filtering (How It Works)

Counselors store specializations as a **comma-separated string**, e.g. `Anxiety, Stress`.

1. **`GET /counselors/specializations`**  
   Splits every row on commas → trims → **dedupes** (case-insensitive) → sorted list of tags.

2. **`GET /counselors/?specialization=Anxiety`**  
   Matches any counselor whose field **contains** that tag (so `Anxiety, Stress` is included).

3. **UI**  
   Public `Counselors.jsx` and dashboard `FindCounselors.jsx` both load options from `/specializations`.

---

## Theme System (How Light Mode Works)

1. `ThemeContext` stores `"dark"` or `"light"` in `localStorage`.
2. It sets `document.body.classList` to `dark` or `light`.
3. CSS variables live in `DashboardLayout.css` (`:root` / `body.dark` and `body.light`).
4. Public pages that used hardcoded dark hex colors also have `body.light …` overrides in their own CSS files (`Home.css`, `About.css`, `Login.css`, etc.).
5. Toggle anywhere (navbar or settings) updates the same context → theme **sticks** until toggled again.

---

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

Roles:

- `user` → `/dashboard`
- `counselor` → `/counselor`
- `admin` → `/admin`

---

## Naming Conventions

| Area | Convention | Example |
|------|------------|---------|
| Page folders | kebab-case | `counselor-application/`, `user-dashboard/` |
| React components | PascalCase files | `MyClients.jsx` |
| Shared UI | under `components/shared/` | `SettingsPage.jsx` |
| Backend routes | snake_case modules | `risk_monitoring.py` |
| CSS | same name as page | `Home.jsx` + `Home.css` |

---

## Suggested Learning Path

1. Read `frontend/src/App.jsx` — see every route.  
2. Open `backend/app/main.py` — see every API router.  
3. Pick one feature (e.g. bookings): follow `booking` model → schema → route → matching frontend page.  
4. Skim `AuthContext` + `ProtectedRoute` to understand login gates.  
5. Skim `ThemeContext` + one public CSS file’s `body.light` block to understand theming.


