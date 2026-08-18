# ApplyMate

A local, self-hosted job application copilot — discover real postings, score them
against your resume, generate tailored applications, and track them through the
pipeline. Built as part of a #30days30projects challenge.

Runs entirely on your own machine with a local LLM (via [Ollama](https://ollama.com)) —
no API keys, no subscriptions, no data leaving your computer.

## Why it exists

Paid auto-apply tools exist, but they cost money and hand your resume + job search
data to a third party. ApplyMate is a from-scratch version of the same idea, built
to be free, local, and transparent about what it's doing at each step.

## Design principle: human-in-the-loop, not autonomous

ApplyMate does **not** auto-submit applications. Several major job boards
(LinkedIn included) prohibit automated submission in their Terms of Service, and
a bot blindly firing off applications is a bad idea for application quality
anyway. Instead, every stage produces a **draft for you to review**:

- Discovery finds postings, it doesn't apply to them.
- Tailoring generates a resume + cover letter, it doesn't submit them.
- Tracking records what you've actually sent and where things stand.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌────────────┐
│  Discovery  │ --> │   Matching   │ --> │  Tailoring  │ --> │  Tracking  │
│ (live job   │     │  (keyword    │     │  (LLM-based │     │ (SQLite,   │
│  boards)    │     │   scoring)   │     │   rewrite)  │     │  dashboard)│
└─────────────┘     └──────────────┘     └─────────────┘     └────────────┘
```

| Phase | What it does | Tech |
|---|---|---|
| **Discovery** | Pulls live postings from Greenhouse & Lever's public, key-free job-board APIs | `requests`, FastAPI |
| **Matching** | Instantly ranks a list of postings against your resume via keyword overlap — no LLM, so it stays fast even for 50+ jobs | Pure Python |
| **Tailoring** | Sends a job description + your base resume to a local LLM, gets back a tailored resume, cover letter, match score, and honestly-flagged gaps | Ollama (local model), FastAPI |
| **Tracking** | Saves generated drafts, tracks status (draft → applied → interviewing → rejected/offer) | SQLite, SQLAlchemy |

## Stack

- **Backend:** Python, FastAPI, SQLAlchemy, SQLite
- **Frontend:** React + TypeScript, Vite
- **AI:** Local model via Ollama (default `llama3.1`, swappable)
- **No hosted API keys required**

## Running it locally

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r ../requirements.txt
cp ../.env.example .env
uvicorn app.main:app --reload --port 8000
```

### 2. Ollama (in a separate terminal)

```bash
ollama serve
ollama pull llama3.1
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`.

## API overview

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/discovery/search` | Search Greenhouse/Lever boards by company token |
| `POST` | `/api/matching/score` | Rank a list of postings against a resume |
| `POST` | `/api/tailoring/generate` | Generate tailored resume + cover letter for one job |
| `POST` | `/api/applications` | Save a tailored application as a tracked draft |
| `GET` | `/api/applications` | List tracked applications |
| `PATCH` | `/api/applications/{id}/status` | Update an application's status |
| `DELETE` | `/api/applications/{id}` | Remove a tracked application |

Interactive docs available at `http://localhost:8000/docs` once the backend is running.

## What's next

- Playwright-based form auto-fill (draft-only, still requires manual submit)
- Support for more ATS platforms beyond Greenhouse/Lever
- Swappable model backends (local model, or bring-your-own API key)

## License

Personal/portfolio project — not affiliated with LinkedIn, Greenhouse, or Lever.
