# Taskflow Backend (Node.js + Express)

Backend Node.js thay thế backend C# cho `taskflow-mvp`, khớp hợp đồng API mà frontend Next.js đang gọi.

## Yêu cầu

- Node.js 20+
- npm
- PostgreSQL 16 (`postgres:16-alpine` qua Docker — xem `docker-compose.yml` ở repo root)

## Chạy local

```bash
# Từ repo root — bật Postgres (port host 5434, tránh trùng iris-app 5433)
docker compose up -d postgres

cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Server mặc định lắng nghe cổng `8080`. Frontend cấu hình `BACKEND_URL=http://localhost:8080` trong `frontend/.env`.

## Tích hợp frontend

Trong `frontend/.env`:

```env
MOCK_MODE=false
BACKEND_URL=http://localhost:8080
DEV_USER_EMAIL=dev@example.com
DEV_USER_PASSWORD=DevPassword123!
```

## Biến môi trường

| Biến | Mô tả | Mặc định |
|------|--------|----------|
| `PORT` | Cổng HTTP | `8080` |
| `JWT_KEY` | Khóa ký JWT (HMAC-SHA256) | khóa dev |
| `JWT_ISSUER` | Issuer JWT | `Taskflow` |
| `JWT_AUDIENCE` | Audience JWT | `TaskflowClient` |
| `DATABASE_URL` | PostgreSQL Prisma | `postgresql://postgres:taskflow@localhost:5434/taskflow_db?sslmode=disable` |
| `DATABASE_URL_DOCKER` | URL trong compose (backend → postgres) | `postgres://postgres:taskflow@postgres:5432/taskflow_db?sslmode=disable` |

> **SQLite:** chỉ tham chiếu tại `prisma/schema.sqlite.prisma` + `prisma/migrations-sqlite/` — không dùng runtime.
| `GEMINI_API_KEY` | Khóa Google Gemini (AI) | (rỗng) |
| `CORS_ORIGIN` | Origin frontend | `http://localhost:3000` |

## Docker

```bash
docker compose up -d --build
```

Health check: `GET /health`

## Test

```bash
npm test
npm run build
```

## API (MVP)

- Auth: `POST /api/auth/register`, `login`, `refresh`
- Tasks, Lists, Habits, Countdown: CRUD
- Pomodoro: sessions + state (`GET /api/pomodoro/state` → `204` khi chưa có)
- Settings, Profile (summary + achievements)
- AI: briefing, tasks/analyze, chat
- `GET /health`
