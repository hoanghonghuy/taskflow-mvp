# Taskflow MVP

Ứng dụng quản lý công việc cá nhân, gồm frontend Next.js và backend Node.js
(Express, Prisma, PostgreSQL).

## Cấu trúc

| Thư mục / tệp | Mô tả |
|---|---|
| `frontend/` | Giao diện Next.js, hỗ trợ tiếng Việt và tiếng Anh |
| `backend/` | REST API với Express và Prisma |
| `docker-compose.yml` | Môi trường full Docker: frontend, backend, PostgreSQL, Caddy |
| `docker-compose.local.yml` | Môi trường local-dev: PostgreSQL + Caddy trong Docker |

## Yêu cầu

- Docker Desktop
- Hoặc Node.js 20+ và PostgreSQL 16

## Chạy bằng Docker

### Full Docker

Sao chép tệp cấu hình môi trường:

```bash
cp .env.example .env
```

Khởi động toàn bộ ứng dụng:

```bash
docker compose up -d --build
```

Các địa chỉ mặc định:

| Thành phần | Địa chỉ |
|---|---|
| Frontend | https://taskflow-mvp.duckdns.org |
| Backend API | http://localhost:8081 |
| PostgreSQL | `localhost:5434` |

Docker Compose đã cấu hình hot reload khi chỉnh sửa mã nguồn. Dừng ứng dụng bằng:

```bash
docker compose down
```

Muốn xóa cả dữ liệu PostgreSQL:

```bash
docker compose down -v
```

### Local app + Docker infra

Mode này giữ `postgres` và `caddy` trong Docker, còn `backend` / `frontend`
chạy trực tiếp trên host để sửa file là áp dụng ngay tại chỗ.

Khởi động hạ tầng:

```bash
cp .env.example .env
docker compose -f docker-compose.local.yml up -d
```

Chạy backend:

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Chạy frontend ở terminal khác:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Khi đó:

| Thành phần | Địa chỉ |
|---|---|
| Frontend local | http://localhost:3000 |
| Backend local | http://localhost:8080 |
| DuckDNS + HTTPS | https://taskflow-mvp.duckdns.org |
| PostgreSQL | `localhost:5434` |

`Caddy` trong Docker sẽ proxy từ `taskflow-mvp.duckdns.org` vào frontend local
ở `localhost:3000`.

## Biến môi trường

Các tệp `.env` không được commit. Dùng theo mode:

| Tệp | Nội dung chính |
|---|---|
| [`.env.example`](.env.example) | Nguồn env cho Docker Compose (`docker-compose.yml`, `docker-compose.local.yml`) |
| [`backend/.env.example`](backend/.env.example) | Env cho backend khi chạy trực tiếp trên host |
| [`frontend/.env.example`](frontend/.env.example) | Env cho frontend khi chạy trực tiếp trên host |

Khi chạy backend trực tiếp trên máy, đặt `BACKEND_URL` trong
`frontend/.env` thành `http://localhost:8080`. Khi chạy full Docker, frontend
container sẽ tự dùng `http://backend:8080` qua `BACKEND_INTERNAL_URL` từ `.env`
gốc.

## Chạy từng service ở local

Nếu chỉ cần database:

```bash
docker compose -f docker-compose.local.yml up -d postgres
```

Nếu muốn vừa có database vừa có HTTPS/DuckDNS qua Caddy:

```bash
docker compose -f docker-compose.local.yml up -d
```

## Tính năng

- Quản lý task theo list, board, matrix và calendar
- Kéo-thả để sắp xếp task và lưu vào database
- Habits, countdown và Pomodoro
- Profile, thống kê và achievements
- Cài đặt giao diện, ngôn ngữ và AI provider
- Đăng ký, đăng nhập bằng JWT
- Quản trị người dùng và thống kê hệ thống

## Tài khoản dùng cho phát triển

### Admin

Thêm vào `.env` khi chạy full Docker, hoặc `backend/.env` khi chạy backend local:

```env
ADMIN_EMAIL=admin@taskflow.app
ADMIN_PASSWORD=Admin123@
ADMIN_NAME=System Admin
```

Backend sẽ tự tạo hoặc cập nhật tài khoản admin khi khởi động. Đăng nhập tại
`/login`.

### Demo user

Thêm vào `.env` khi chạy full Docker, hoặc `backend/.env` khi chạy backend local:

```env
DEMO_EMAIL=demo@taskflow.app
DEMO_PASSWORD=Demo123@
DEMO_NAME=Demo User
```

Backend sẽ tạo tài khoản demo cùng dữ liệu mẫu khi khởi động. Có thể seed lại
dữ liệu bằng:

```bash
cd backend
DEMO_SEED_FORCE=true npm run seed:demo
```

## Kiểm thử

Unit và integration test:

```bash
cd backend
npm test

cd ../frontend
npm test
```

Chạy browser E2E với PostgreSQL:

```bash
cd backend
npm ci
npx prisma generate

cd ../frontend
npm ci
npx playwright install chromium
npm run test:e2e
```

Nếu chỉ muốn chạy E2E ở mock mode:

```powershell
cd frontend
$env:E2E_MOCK_MODE="true"
npm run test:e2e:mock
```

## Tài liệu

- [backend/README.md](backend/README.md) — API và cấu hình backend
