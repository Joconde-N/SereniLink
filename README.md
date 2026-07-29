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
# Create all database tables
alembic upgrade head

# Start the server
uvicorn app.main:app --reload
```

- API: http://127.0.0.1:8000
- Swagger docs: http://127.0.0.1:8000/docs

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
