# Taskflow MVP

Ứng dụng quản lý công việc cá nhân — monorepo gồm frontend Next.js và backend Node.js (Express + Prisma + PostgreSQL).

## Cấu trúc

| Thư mục | Mô tả |
|---------|--------|
| `frontend/` | Next.js 16 — UI, i18n (vi/en), API routes proxy tới backend |
| `backend/` | Express API, Prisma ORM, PostgreSQL 16 |
| `docker-compose.yml` | Postgres + backend + frontend |

## Yêu cầu

- Docker Desktop (khuyến nghị), hoặc Node.js 20+ + PostgreSQL 16
- Port host trống: `3000` (frontend), `8081` (backend), `5434` (postgres)  
  *(tránh trùng `iris-api` / `iris-app` thường dùng `8080` / `5433`)*

## Biến môi trường

Ba file `.env` (gitignore — clone repo cần copy từ `.env.example`):

| File | Phạm vi |
|------|---------|
| [`.env.example`](.env.example) | Docker Compose: port, Postgres, `DATABASE_URL_DOCKER`, `BACKEND_INTERNAL_URL` |
| [`backend/.env.example`](backend/.env.example) | JWT, `DATABASE_URL`, AI provider (`gemini` / `openai-compatible`) |
| [`frontend/.env.example`](frontend/.env.example) | `BACKEND_URL`, `MOCK_MODE`, dev user |

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**Local dev:** `frontend/.env` → `BACKEND_URL=http://localhost:8081`  
**Docker:** compose ghi đè `BACKEND_URL=http://backend:8080` (tên service trong network).

## Chạy với Docker (khuyến nghị)

```bash
docker compose up --build
```

| Service | URL / port host |
|---------|-----------------|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8081 |
| Postgres | `localhost:5434` |
| Health check | http://localhost:8081/health |

Backend tự chạy `prisma migrate deploy` khi container khởi động.

Dừng và xóa volume (mất data DB):

```bash
docker compose down -v
```

## Chạy riêng từng service (dev)

```bash
# 1. Postgres
docker compose up -d postgres

# 2. Backend
cd backend
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev          # http://localhost:8080

# 3. Frontend (terminal khác)
cd frontend
npm install
npm run dev          # http://localhost:3000
```

Đảm bảo `frontend/.env` có `MOCK_MODE=false` và `BACKEND_URL` trỏ đúng cổng backend (`8080` khi chạy `npm run dev`, `8081` khi backend chạy trong Docker).

## Tính năng

- **Tasks** — list, board, matrix, calendar; kéo-thả sắp xếp (persist DB)
- **Habits**, **Countdown**, **Pomodoro**
- **Profile** — summary, achievements
- **Settings** — theme, ngôn ngữ, API key AI
- **Auth** — đăng ký / đăng nhập (JWT qua NextAuth proxy)

### Ghi chú MVP tạm thời

- `/` redirect sang `/login` (landing page giữ trong code, chưa xóa)
- AI trên UI tắt qua `AI_FEATURES_ENABLED` trong `frontend/src/lib/feature-flags.ts` — hiện toast “đang phát triển”; backend vẫn hỗ trợ Gemini / OpenAI-compatible

## Test

```bash
cd backend && npm test    # 112 tests
cd frontend && npm test   # 127 tests (+ 2 skipped contract E2E)
```

Contract E2E với backend Docker đang chạy:

```bash
cd frontend
REAL_BACKEND_TEST=true BACKEND_URL=http://localhost:8081 npm test -- real-backend-contract
```

## Tài liệu thêm

- [backend/README.md](backend/README.md) — API endpoints, biến env chi tiết
- [REFACTOR-LAYERING.md](REFACTOR-LAYERING.md) — kiến trúc layer frontend/backend
- [ISSUES.md](ISSUES.md) — backlog / ghi chú kỹ thuật
