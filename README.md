# SereniLink - Mental Health Support and Counseling Platform

## Overview

SereniLink is an AI-powered mental health support and counseling platform designed to improve access to mental health services through digital technology.

The platform provides:

- AI-assisted mental health support
- PHQ-9 and GAD-7 mental health screenings
- Counselor appointment booking
- Mood tracking and progress monitoring
- Educational mental health resources
- Session notes and counseling support
- Administrative reporting and analytics

---

## Features

### User Management

- User registration and authentication
- Role-based access control
- Password strength validation
- Password reset functionality
- Profile management
- Counselor application workflow

### AI Mental Health Support

- Authenticated AI chat
- Guest AI support
- Risk detection (Low, Moderate, High)
- Personalized responses
- Conversation history

### Mental Health Assessments

- PHQ-9 Depression Screening
- GAD-7 Anxiety Screening
- Automatic scoring
- Severity classification
- Assessment history

### Mood Tracking

- Daily mood check-ins
- Mood trends
- Mood history

### Counseling Services

- Counselor directory
- Availability management
- Appointment booking
- Appointment approval workflow
- Session management

### Session Notes

- Counselor session notes
- Session history tracking

### Progress Tracking

- Personal milestones
- Progress analytics
- Improvement trends

### Resources

- Mental health articles
- Wellness exercises
- Self-help resources

### Reports & Analytics

- Administrative reports
- Booking analytics
- User engagement insights
- Assessment statistics

---

## Technology Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Context API

### Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- JWT Authentication
- Argon2 Password Hashing

### AI

- Hugging Face Inference Router
- GPT-OSS-20B (served through Groq)
- OpenAI-Compatible API Interface

## AI Configuration

SereniLink uses the Hugging Face Router as the AI gateway. The application communicates with an OpenAI-compatible API endpoint provided through Hugging Face and accesses the GPT-OSS-20B model running on Groq infrastructure.

Configuration:

```python
HF_API_KEY: str
HF_BASE_URL: str = "https://router.huggingface.co/v1"
AI_MODEL: str = "openai/gpt-oss-20b:groq"
```

### AI Capabilities

- Mental health support conversations
- PHQ-9 and GAD-7 assessment guidance
- Emotional support and wellbeing recommendations
- Risk detection (Low, Moderate, High)
- Context-aware responses
- Personalized support suggestions

### Safety Features

- Detection of high-risk messages
- Emergency guidance using Rwanda emergency numbers:
  - 112 (National Emergency)
  - 114 (Medical Emergency / Ambulance)
- Safe-response mechanism for crisis situations
- Counselor referral recommendations

### Additional Libraries

- SlowAPI
- Pydantic
- Python-Jose
- Passlib

---

## Project Structure

### Backend

```text
backend/
│
├── app/
│   ├── api/
│   │   ├── routes/
│   │   └── deps.py
│   │
│   ├── core/
│   │   ├── ai_client.py
│   │   ├── email.py
│   |   ├── config.py
│   │   └── security.py
│   │
│   ├── db/
│   ├── models/
│   ├── schemas/
│   └── main.py
│
├── alembic/
├── requirements.txt
└── .env
```

### Frontend

```text
frontend/
│
├── src/
│   ├── api/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
│
├── package-lock.json
└── package.json
```

---

## Backend Setup

### 1. Navigate to Backend

```bash
cd backend
```

### 2. Create Virtual Environment

```bash
python -m venv venv
```

### 3. Activate Virtual Environment

Windows:

```bash
.\venv\Scripts\activate.ps1
```
or

```bash
venv\Scripts\activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure Environment Variables

Create a `.env` file:

```env
HF_API_KEY=your_api_key_here
HF_BASE_URL=https://router.huggingface.co/v1
AI_MODEL=openai/gpt-oss-20b:groq
```

### 6. Run Database Migrations

```bash
alembic upgrade head
```

### 7. Start Backend

```bash
uvicorn app.main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

Swagger Documentation:

```text
http://127.0.0.1:8000/docs
```

---

## Frontend Setup

### 1. Navigate to Frontend

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://127.0.0.1:8000
```

### 4. Start Frontend

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## User Roles

### Patient/User

- Complete screenings
- Track moods
- Book counseling sessions
- Use AI support
- View resources
- Practice excercises
- Monitor progress

### Counselor

- Manage availability
- Review appointments
- Create session notes
- Support patients/users

### Administrator

- Manage users
- Manage content and excercises
- Approve counselors
- Generate reports
- View analytics

---

## Security Features

- JWT Authentication
- Argon2 Password Hashing
- Role-Based Access Control
- Rate Limiting
- Protected API Routes
- Secure Password Reset

---

## Future Enhancements

- Video Counseling Sessions
- Multi-Factor Authentication
- Anonymous Registration
- High-Risk Alert Dashboard
- Mobile Application
- Advanced Analytics

