# Taskflow MVP

Ứng dụng quản lý công việc cá nhân, gồm frontend Next.js và backend Node.js
(Express, Prisma, PostgreSQL).

## Cấu trúc

| Thư mục / tệp | Mô tả |
|---|---|
| `frontend/` | Giao diện Next.js, hỗ trợ tiếng Việt và tiếng Anh |
| `backend/` | REST API với Express và Prisma |
| `docker-compose.yml` | Môi trường phát triển gồm frontend, backend và PostgreSQL |

## Yêu cầu

- Docker Desktop
- Hoặc Node.js 20+ và PostgreSQL 16

## Chạy bằng Docker

Sao chép các tệp cấu hình môi trường:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Khởi động toàn bộ ứng dụng:

```bash
docker compose up -d --build
```

Các địa chỉ mặc định:

| Thành phần | Địa chỉ |
|---|---|
| Frontend | http://localhost:3000 |
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

## Biến môi trường

Các tệp `.env` không được commit. Tạo chúng từ các tệp mẫu tương ứng:

| Tệp | Nội dung chính |
|---|---|
| [`.env.example`](.env.example) | Port, PostgreSQL và cấu hình kết nối giữa các container |
| [`backend/.env.example`](backend/.env.example) | JWT, database, CORS và AI provider |
| [`frontend/.env.example`](frontend/.env.example) | Backend URL, mock mode và cấu hình JWT |

Khi chạy backend trực tiếp trên máy, đặt `BACKEND_URL` trong
`frontend/.env` thành `http://localhost:8080`. Khi chạy bằng Docker, dùng
`http://localhost:8081`.

## Chạy từng service ở local

Khởi động PostgreSQL:

```bash
docker compose up -d postgres
```

Chạy backend:

```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Backend chạy tại http://localhost:8080.

Mở terminal khác để chạy frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại http://localhost:3000.

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

Thêm vào `backend/.env`:

```env
ADMIN_EMAIL=admin@taskflow.app
ADMIN_PASSWORD=Admin123@
ADMIN_NAME=System Admin
```

Backend sẽ tự tạo hoặc cập nhật tài khoản admin khi khởi động. Đăng nhập tại
`/login`.

### Demo user

Thêm vào `backend/.env`:

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
