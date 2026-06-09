# Taskflow Backend (Node.js + Express)

Backend Node.js thay thế backend C# cho `taskflow-mvp`, khớp hợp đồng API mà frontend Next.js đang gọi.

## Yêu cầu

- Node.js 20+
- npm

## Chạy local

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

Server mặc định lắng nghe cổng `8080`. Để khớp fallback frontend (`http://localhost:5134`), đặt `PORT=5134` trong `.env`.

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
| `DATABASE_URL` | SQLite Prisma | `file:./data/taskflow.db` |
| `GEMINI_API_KEY` | Khóa Google Gemini (AI) | (rỗng) |
| `CORS_ORIGIN` | Origin frontend | `http://localhost:3000` |

## Docker

```bash
docker compose up -d --build backend
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
