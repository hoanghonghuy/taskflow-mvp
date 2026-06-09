# Taskflow MVP

Ứng dụng quản lý công việc cá nhân — monorepo gồm frontend Next.js và backend Node.js (Express + Prisma).

## Cấu trúc

| Thư mục | Mô tả |
|---------|--------|
| `frontend/` | Next.js 16 app (UI + API routes proxy) |
| `backend/` | Express API + SQLite (Prisma) |

## Chạy local

### Docker (khuyến nghị)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8080

### Chạy riêng từng service

Xem `frontend/.env.example` và `backend/.env.example`.

```bash
# Backend
cd backend && npm install && npx prisma migrate dev && npm run dev

# Frontend (terminal khác)
cd frontend && npm install && npm run dev
```

## Test

```bash
cd backend && npm test
cd frontend && npm test
```

## Tài liệu thêm

- [backend/README.md](backend/README.md) — API, env, Docker
