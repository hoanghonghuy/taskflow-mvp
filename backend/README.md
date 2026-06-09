# Taskflow Backend (Node.js + Express)

API backend cho `taskflow-mvp` — Express + Prisma + PostgreSQL 16.

## Yêu cầu

- Node.js 20+
- npm
- PostgreSQL 16 (`postgres:16-alpine` qua Docker — xem `docker-compose.yml` ở repo root)

## Biến môi trường

| File | Phạm vi |
|------|---------|
| `backend/.env` | JWT, `DATABASE_URL`, AI, `CORS_ORIGIN`, `PORT` |
| `.env` (repo root) | Docker Compose: `DATABASE_URL_DOCKER`, `BACKEND_PORT`, Postgres |

```bash
cp .env.example .env              # repo root — nếu chạy Docker
cp backend/.env.example backend/.env
```

### `backend/.env`

| Biến | Mô tả | Mặc định |
|------|--------|----------|
| `PORT` | Cổng HTTP (trong container / `npm run dev`) | `8080` |
| `JWT_KEY` | Khóa ký JWT (HMAC-SHA256) | khóa dev |
| `JWT_ISSUER` | Issuer JWT | `Taskflow` |
| `JWT_AUDIENCE` | Audience JWT | `TaskflowClient` |
| `DATABASE_URL` | PostgreSQL Prisma (local dev) | `postgresql://postgres:taskflow@localhost:5434/taskflow_db?sslmode=disable` |
| `AI_PROVIDER` | `gemini` hoặc `openai` / `openai-compatible` | `gemini` |
| `GEMINI_API_KEY` | Google Gemini (khi `AI_PROVIDER=gemini`) | (rỗng) |
| `OPENAI_API_KEY` | OpenAI-compatible | (rỗng) |
| `OPENAI_BASE_URL` | Base URL (OpenAI, Ollama, LM Studio, …) | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | Tên model | `gpt-4o-mini` |
| `CORS_ORIGIN` | Origin frontend | `http://localhost:3000` |

User có thể ghi đè API key qua Settings (`geminiApiKey` — dùng chung cho cả hai provider).

> **SQLite:** chỉ tham chiếu tại `prisma/schema.sqlite.prisma` + `prisma/migrations-sqlite/` — không dùng runtime.

## Chạy local

```bash
# Từ repo root — bật Postgres (port host 5434)
docker compose up -d postgres

cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev          # http://localhost:8080
```

Frontend (`frontend/.env`): `BACKEND_URL=http://localhost:8080` khi backend chạy `npm run dev`; `http://localhost:8081` khi backend chạy trong Docker (`BACKEND_PORT` ở `.env` gốc).

## Docker (full stack)

```bash
# Từ repo root
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up -d --build
```

Compose ghi đè `DATABASE_URL` của backend bằng `DATABASE_URL_DOCKER` từ `.env` gốc.

Health check: `GET /health` — từ host: `http://localhost:8081/health`

## Test

```bash
npm test             # 112 tests
npm run build
```

Contract E2E với backend thật (từ frontend):

```bash
REAL_BACKEND_TEST=true BACKEND_URL=http://localhost:8081 npm test -- real-backend-contract
```

## API (MVP)

- Auth: `POST /api/auth/register`, `login`, `refresh`
- Tasks: CRUD + `POST /api/tasks/reorder` (`{ taskIds: string[] }`)
- Lists, Habits, Countdown: CRUD
- Pomodoro: sessions + state (`GET /api/pomodoro/state` → `204` khi chưa có)
- Settings, Profile (summary + achievements)
- AI: `GET /api/ai/status`, briefing, `tasks/analyze`, `tasks/subtasks`, chat
- `GET /health`
