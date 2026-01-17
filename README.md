# UofTHacks2026 – Behavioral Interview Feedback (Boilerplate)

Monorepo scaffold:
- `frontend/`: Next.js + TypeScript + Tailwind + shadcn-style UI + MediaRecorder upload flow
- `backend/`: Django + DRF + Celery + Redis + Postgres + S3 (Vultr Object Storage) presigned uploads

## Local dev (Docker)

1) Create env files:

- `backend/.env` (copy from `backend/env.example`)
- `frontend/.env.local` (copy from `frontend/env.local.example`)

2) Start services:

```bash
docker compose up --build
```

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000` (run separately)

## Frontend dev

```bash
cd frontend
cp env.local.example .env.local
npm install
npm run dev
```

## Backend dev (without Docker)

```bash
cd backend
cp env.example .env
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Notes:
- By default, `backend/env.example` sets `USE_SQLITE=1` and `CELERY_TASK_ALWAYS_EAGER=1` so you can run **without Postgres/Redis/Celery**.
- If you configure `S3_*`, the frontend will upload via presigned URL. If not, it auto-falls back to a **local multipart upload** endpoint and stores videos under `backend/media/` in dev.

## Deployment notes

- Frontend: Vercel
- Backend: containerize or deploy to VPS; configure Postgres (Vultr Managed Postgres), Redis, and Vultr Object Storage (S3-compatible)
- Background jobs: run a Celery worker (and optionally Celery Beat)
- AI: TwelveLabs for transcription; OpenAI GPT for question generation + STAR analysis
