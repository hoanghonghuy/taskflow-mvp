# Refactor Layering — Checklist

> Mục tiêu: backend phân tầng giống `project-demo` (routes → controllers → services → repositories), **giữ Prisma**.
> Frontend giữ cấu trúc hiện tại, tách API client dần.

**Pattern mục tiêu (backend):**

```
routes/*.ts        → mount path + middleware
controllers/*.ts   → parse HTTP, status code, validation (Zod)
services/*.ts      → business logic (không import prisma)
repositories/*.ts  → Prisma CRUD
mappers/*.ts       → entity → DTO (giữ)
types/*.ts         → DTO / input types (tách dần)
```

---

## Phase 0 — Chuẩn bị

- [x] **R0-1** Tạo file checklist này
- [x] **R0-2** Pilot domain `tasks`
- [x] **R0-3** `app.ts` mount từ `routes/`

---

## Phase 1 — Backend: tách từng domain

| Domain | routes | controller | service | repository | Xong |
|--------|--------|------------|---------|------------|------|
| tasks | `routes/tasks.ts` | `taskController.ts` | `taskService.ts` | `taskRepository.ts` | [x] |
| lists | `routes/lists.ts` | `listController.ts` | `listService.ts` | `listRepository.ts` | [x] |
| habits | `routes/habits.ts` | `habitController.ts` | `habitService.ts` | `habitRepository.ts` | [x] |
| countdown | `routes/countdown.ts` | `countdownController.ts` | `countdownService.ts` | `countdownRepository.ts` | [x] |
| pomodoro | `routes/pomodoro.ts` | `pomodoroController.ts` | `pomodoroService.ts` | `pomodoroRepository.ts` | [x] |
| settings | `routes/settings.ts` | `settingsController.ts` | `settingsService.ts` | `settingsRepository.ts` | [x] |
| profile | `routes/profile.ts` | `profileController.ts` | `profileService.ts` | (dùng task/habit/pomodoro repos) | [x] |
| auth | `routes/auth.ts` | `authController.ts` | `authService.ts` | `authRepository.ts` | [x] |
| ai | `routes/ai.ts` | `aiController.ts` | `aiService.ts` + `llmService.ts` + `geminiService.ts` + `openaiService.ts` | (dùng settings + domain repos) | [x] |
| health | `routes/health.ts` | `healthController.ts` | — | `healthRepository.ts` | [x] |

- [x] Xóa `modules/*` (file cũ)
- [x] Test backend pass (**112/112**)

---

## Phase 2 — Backend: types & validation

- [x] **R2-1** `types/auth.types.ts` (UserDto, AuthResponse)
- [x] **R2-2** Zod schema per domain trong `validators/` (task, list, habit, countdown, auth, ai)
- [x] **R2-3** ~~Gom DTO vào `types/`~~ — **giữ trong `mappers/`** (đủ dùng, không cần gom)
- [x] **R2-4** Xóa thư mục `modules/` (file legacy)

---

## Phase 3 — Backend: dọn cross-cutting

- [x] **R3-1** `lib/inbox-list.ts` → dùng `listRepository`
- [x] **R3-2** `seed.ts` → dùng `listRepository`
- [x] **R3-3** Response envelope `{ success, data }` — backend + FE `lib/api` + mock-backend

---

## Phase 4 — Frontend (giữ cấu trúc, tách nội bộ)

- [x] **F4-1** Tạo `lib/api/` — `client`, `mappers`, `tasks`, `lists`, `habits`, `countdown`, `pomodoro`, `settings`, `profile`
- [x] **F4-2** Tách fetch từ `task-manager-provider` + `settings-provider` sang `lib/api/*`
- [x] **F4-3** `use-countdown`, `use-pomodoro-notifications` dùng `lib/api/*`
- [x] **F4-4** `task-manager-provider` chỉ dispatch + gọi API layer
- [x] **F4-5** Test frontend pass (**127/127**)
- [x] **F4-6** `auth.ts`, `ai.ts` + migrate `user-provider`, `layout`, `use-gemini`, AI views, profile/dashboard

---

## Cấu trúc backend hiện tại

```
backend/src/
├── routes/          # 10 routers
├── controllers/     # 10 controllers
├── services/        # 12 domain + LLM (gemini, openai, llm)
├── repositories/    # 8 repositories
├── mappers/
├── types/
├── middleware/
├── lib/
├── config/
├── seed.ts
├── app.ts
└── server.ts
```

## Tiến độ

| Phase | Tổng | Xong |
|-------|------|------|
| 0 | 3 | 3 |
| 1 | 10 domains | 10 |
| 2 | 4 | 4 |
| 3 | 3 | 3 |
| 4 | 6 | 6 |

**Refactor layering hoàn tất.** Tùy chọn sau: Zod cho settings/pomodoro.
