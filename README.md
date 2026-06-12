# Taskflow MVP

Ứng dụng quản lý công việc cá nhân — monorepo gồm frontend Next.js và backend Node.js (Express + Prisma + PostgreSQL).

## Cấu trúc

| Thư mục | Mô tả |
|---------|--------|
| `frontend/` | Next.js 16 — UI, i18n (vi/en), API routes proxy tới backend |
| `backend/` | Express API, Prisma ORM, PostgreSQL 16 |
| `docker-compose.yml` | Dev + hot reload (mount source, giống `iris-app` web) |
| `docker-compose.prod.yml` | Production (build image — khi deploy) |

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

## Docker (mặc định = dev, giống iris web)

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up -d
```

Mount source + `npm run dev` — **sửa code tự reload**, không cần `--build`. Lần đầu `up` chậm vì `npm ci`.

| Service | URL / port host |
|---------|-----------------|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8081 |
| Postgres | `localhost:5434` |

Production (build image): `docker compose -f docker-compose.prod.yml up -d --build`

Dừng: `docker compose down` — xóa volume DB: `docker compose down -v`

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
- **Admin** — quản trị user, thống kê hệ thống (`/admin`, role `ADMIN`)

### Ghi chú MVP tạm thời

- `/` redirect sang `/login` (landing page giữ trong code, chưa xóa)
- **AI trên UI tạm không mở** — `AI_FEATURES_ENABLED = false` (`frontend/src/lib/feature-flags.ts`); user thấy toast “đang phát triển”. Backend vẫn có API Gemini/OpenAI cho dev/test; chưa lên lịch bật UI (chi tiết: [docs/ISSUES.md](docs/ISSUES.md))

## Tài khoản admin (dev)

Thêm vào `backend/.env`:

```env
ADMIN_EMAIL=admin@taskflow.app
ADMIN_PASSWORD=Admin123@
ADMIN_NAME=System Admin
```

Backend tự tạo/promote admin khi khởi động. Đăng nhập tại `/login` → redirect `/admin`.

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

### E2E browser (Playwright)

Smoke test UI — **mặc định dùng Postgres + Express API thật** (Playwright tự start backend port `8099` + frontend port `3099`).

**Yêu cầu:** Postgres đang chạy (ví dụ `docker compose up -d postgres`).

```bash
cd backend && npm ci && npx prisma generate   # lần đầu
cd frontend && npm ci && npx playwright install chromium
cd frontend && npm run test:e2e
```

Biến env tùy chọn (mặc định trong `playwright.config.ts`):

| Biến | Mặc định |
|------|----------|
| `DATABASE_URL` | `postgresql://postgres:taskflow@localhost:5434/taskflow_db` |
| `E2E_BACKEND_PORT` | `8099` |
| `E2E_ADMIN_EMAIL` | `e2e-admin@taskflow.test` |
| `E2E_ADMIN_PASSWORD` | `E2eAdminPass123!` |

Mock mode (không cần DB, nhanh hơn):

```bash
cd frontend
# PowerShell:
$env:E2E_MOCK_MODE="true"; npm run test:e2e:mock
```

Lệnh khác: `npm run test:e2e:ui`, `npm run test:e2e:report`

**Coverage e2e:** auth, i18n (vi/en), tasks, navigation, admin (DB thật).

### CI (GitHub Actions)

Workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) chạy trên push/PR vào `main`:

| Job | Nội dung |
|-----|----------|
| `backend-test` | Jest + Postgres 16 service |
| `frontend-unit` | Vitest |
| `frontend-e2e` | Playwright + Postgres + backend API thật |

Khi e2e fail trên CI, artifact `playwright-report` được upload để debug.

## Tài liệu thêm

- [backend/README.md](backend/README.md) — API endpoints, biến env chi tiết
- [REFACTOR-LAYERING.md](REFACTOR-LAYERING.md) — kiến trúc layer frontend/backend
- [docs/ISSUES.md](docs/ISSUES.md) — trạng thái code & backlog kỹ thuật
- [docs/FEATURE-COMPLETENESS.md](docs/FEATURE-COMPLETENESS.md) — độ hoàn thiện tính năng so với nghiệp vụ MVP
