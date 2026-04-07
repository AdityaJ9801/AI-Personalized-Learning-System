# EduAI – AI Personalized Learning System

> **Prototype** — Full-stack AI-powered learning platform with OpenAI GPT, Flask, React, PostgreSQL, Docker.

---

## 🏗️ Architecture

<img width="917" height="614" alt="Screenshot 2026-04-07 005109" src="https://github.com/user-attachments/assets/7efa7ac5-9c7d-4665-b5f1-e754eeb46a0f" />


## 🚀 Quick Start (Local Dev — No Docker)

### Prerequisites
- Python 3.11+
- Node.js 20+
- OpenAI API Key or Ollama

### 1. Clone & Setup

```powershell
# Copy environment file
cp .env.example .env
# Edit .env and set your OPENAI_API_KEY

# Run the dev launcher
.\start_dev.ps1
# Choose option 2 (local dev)
```

### 2. Or run manually:

**Backend:**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
$env:DATABASE_URL="sqlite:///eduai_dev.db"
$env:OPENAI_API_KEY="sk-your-key"
$env:SECRET_KEY="dev-secret-key-32chars-minimum!"
python run.py
```

**Frontend:**
```powershell
cd frontend
npm install
npm run dev -- --port 3000
```

Open: **http://localhost:3000**

---

## 🐳 Docker (Full Stack with PostgreSQL + Redis)

```powershell
# 1. Setup env
cp .env.example .env
# Edit .env → set OPENAI_API_KEY

# 2. Start everything
docker compose up --build

# 3. Open app
# http://localhost:80  (Nginx)
# http://localhost:3000 (Frontend direct)
# http://localhost:5000 (Backend direct)
```

---

## 📋 Feature Flow

| Step | Feature | Description |
|------|---------|-------------|
| 1 | **Register/Login** | JWT auth, language + grade selection |
| 2 | **Upload Report Card** | OCR (Tesseract) + LLM extraction |
| 3 | **Manual Entry** | Enter subject marks manually |
| 4 | **AI Analysis** | Strengths · Weaknesses · Gaps · Recommendations |
| 5 | **Roadmap** | Week-by-week personalized study plan |
| 6 | **Practice** | AI Q&A sessions with live evaluation |
| 7 | **Exam Prep** | Full exam-style sessions with answers |
| 8 | **AI Chatbot** | Context-aware tutor with conversation history |
| 9 | **Badges & XP** | Gamification system with leaderboard |

---

## 🌍 Language Support

All AI responses support 20+ languages via the language preference setting:
`English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Urdu, Spanish, French, German, Arabic, Chinese, Portuguese, Russian, Japanese, Korean, Indonesian`

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | OpenAI API key (GPT-4o-mini used by default) |
| `SECRET_KEY` | ✅ Yes | JWT signing secret (min 32 chars) |
| `DATABASE_URL` | No | PostgreSQL URL (defaults to SQLite for dev) |
| `REDIS_URL` | No | Redis URL (optional) |
| `POSTGRES_*` | Docker | PostgreSQL credentials for Docker |

---

## 📁 Project Structure

```
rh_hackthon_v2/
├── docker-compose.yml          # Full stack orchestration
├── .env.example                # Environment template
├── start_dev.ps1               # Dev launcher script
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── run.py                  # Entry point
│   ├── init.sql                # DB init script
│   └── app/
│       ├── __init__.py         # Flask factory
│       ├── models/__init__.py  # SQLAlchemy models
│       ├── services/
│       │   └── llm_service.py  # All OpenAI calls
│       └── api/
│           ├── auth.py         # JWT auth
│           ├── report_card.py  # OCR + upload
│           ├── analysis.py     # AI analysis engine
│           ├── roadmap.py      # Roadmap generator
│           ├── practice.py     # Q&A + evaluation
│           ├── chatbot.py      # AI tutor chat
│           └── gamification.py # XP + badges
└── frontend/
    ├── Dockerfile
    ├── vite.config.js
    └── src/
        ├── App.jsx             # Router
        ├── api/client.js       # API client
        ├── context/AuthContext.jsx
        ├── components/
        │   └── AppShell.jsx    # Sidebar layout
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── Dashboard.jsx
            ├── ReportCardPage.jsx
            ├── AnalysisPage.jsx
            ├── RoadmapPage.jsx
            ├── PracticePage.jsx
            ├── ExamPrepPage.jsx
            ├── ChatbotPage.jsx
            └── BadgesPage.jsx
```

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login + get JWT |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/report/upload` | Upload report card (OCR) |
| POST | `/api/report/manual` | Manual subject entry |
| POST | `/api/analysis/analyze` | Run AI analysis |
| POST | `/api/roadmap/generate` | Generate learning roadmap |
| POST | `/api/practice/questions` | Generate practice Q&A |
| POST | `/api/practice/evaluate` | Evaluate student answer |
| POST | `/api/practice/exam-prep` | Full exam session |
| POST | `/api/chatbot/message` | Send chat message |
| GET | `/api/gamification/dashboard` | XP, badges, stats |
| GET | `/api/gamification/leaderboard` | Top users |

---

## 🧠 AI Model

- **Model**: `gpt-4o-mini` (change to `gpt-4o` in `llm_service.py` for better quality)
- **All AI features** use the model's knowledge — no external databases or document stores needed
- Supports **any subject, any curriculum, any grade level** universally
