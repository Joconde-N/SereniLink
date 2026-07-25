# SereniLink — Mental Health Support & Counseling Platform

SereniLink is an AI-powered mental health support and counseling platform that helps people access wellness tools, screenings, and professional counselors through a single web app.

## What You Can Do

- **AI-assisted support** — chat with an AI companion (guest or logged-in), with risk awareness and counselor referral CTAs
- **Screenings** — PHQ-9 and GAD-7 assessments with scoring and history
- **Mood & progress** — daily check-ins, wellness tips, and progress tracking
- **Counseling** — browse counselors, filter by specialization, book sessions, chat in real time (WebSocket)
- **Exercises & resources** — calm tools, articles, and self-help content
- **Risk monitoring** — support level (Low / Moderate / High) for users and their assigned counselors; admins only see anonymous aggregates
- **Audit logging** — admin search, filter, and CSV export of important system actions
- **Light / dark theme** — one toggle that persists across the whole app

---

## Technology Stack

| Layer | Stack |
|-------|--------|
| Frontend | React, Vite, React Router, Axios, Context API, Recharts, Lucide icons |
| Backend | FastAPI, SQLAlchemy, PostgreSQL, Alembic, JWT, Argon2 |
| Realtime | WebSockets (booking chat) |
| AI | Hugging Face Router → GPT-OSS-20B (Groq), OpenAI-compatible API |

---

## Repository Layout

```text
SereniLinkApp/
├── README.md                 ← you are here
├── PROJECT_STRUCTURE.md      ← detailed file-by-file guide
├── .gitignore
└── serenilink/
    ├── backend/              ← FastAPI API + database models
    └── frontend/             ← React (Vite) SPA
```

For a full walkthrough of every folder and file, see **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**.

---

## Quick Start

### Backend

```bash
cd serenilink/backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `serenilink/backend/.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/serenilink
SECRET_KEY=your-secret-key
HF_API_KEY=your_huggingface_key
HF_BASE_URL=https://router.huggingface.co/v1
AI_MODEL=openai/gpt-oss-20b:groq
```

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

- API: http://127.0.0.1:8000  
- Swagger: http://127.0.0.1:8000/docs  

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

## User Roles

| Role | Main areas |
|------|------------|
| **User** | Dashboard, screenings, mood, AI chat, find/book counselors, messages, exercises, resources, settings |
| **Counselor** | Availability, booking requests, sessions, client assessments, messages, profile, settings |
| **Admin** | Users, counselor applications, content/exercises, bookings, insights, audit logs, settings |

---

## Key Features (Recent)

- **Support Level recommendations** — based on latest PHQ-9 / GAD-7 and recent moods (not a medical diagnosis)
- **Specialization filters** — comma-separated tags like `Anxiety, Stress` are split into unique filter options; filtering by `Anxiety` matches any counselor who lists that tag
- **Protected routes** — role-gated dashboards
- **Shared settings** — one `SettingsPage` component for all roles
- **Notification badges** — unread counts on sidebar + bell
- **Audit logs** — admin filtering by action/resource, pagination, CSV export

---

## Security

- JWT authentication  
- Argon2 password hashing  
- Role-based access control  
- Rate limiting (SlowAPI)  
- Protected API routes  
- Secure password reset  

---

## AI Safety Notes

- Risk levels: Low / Moderate / High  
- High-risk AI chats show a **Book a Counselor** CTA  
- Emergency numbers (Rwanda): **112** (national), **114** (medical / ambulance)  
- The app does **not** make clinical diagnoses  

---

## Future Ideas

- Video counseling sessions  
- Multi-factor authentication  
- Mobile application  
- Advanced analytics dashboards  

---

## Docs

| File | Purpose |
|------|---------|
| [README.md](./README.md) | Setup, stack, overview |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | How the codebase is organized and how to navigate it |
