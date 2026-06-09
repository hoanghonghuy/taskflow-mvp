# Taskflow MVP — Audit Issues & Fix Checklist

> Tạo từ audit backend + frontend. Sửa tuần tự theo thứ tự ưu tiên.
> Đánh dấu `[x]` khi hoàn thành.

---

## P0 — Mất dữ liệu khi dùng backend thật

- [x] **P0-1** `TaskItem` / `TaskDetail` toggle completion chỉ `dispatch(TOGGLE_TASK_COMPLETION)` — không gọi API → mất sau reload
  - Files: `frontend/src/features/tasks/components/TaskItem.tsx`, `TaskDetail.tsx`
  - Fix: dùng `toggleTask()` từ `useTaskActions`

- [x] **P0-2** `CalendarView.moveTaskToDate` chỉ dispatch local — không PUT `/api/tasks/:id`
  - File: `frontend/src/features/calendar/views/CalendarView.tsx`
  - Fix: gọi `updateTask()` từ `useTaskActions`

---

## P1 — List ID & Board

- [x] **P1-1** Magic string `listId: 'inbox'` không khớp UUID list seed backend
  - Backend: `lib/inbox-list.ts` resolve Inbox theo `userId`; `taskService.ts` + `settingsService.ts`
  - Frontend: resolve Inbox list khi load, `TaskForm`, `filterTasksByList`

- [x] **P1-2** Board columns chỉ local — reload mất columns, layout hỏng
  - Fix: `buildBoardColumns()` derive columns khi load từ backend

- [x] **P1-3** `updateTask`/`addTask` gửi `columnId: null` cứng — mất columnId khi PUT
  - Fix: `columnId: task.columnId ?? null` trong `task-manager-provider.tsx`

---

## P2 — UX / tính năng chưa hoàn chỉnh

- [x] **P2-1** Achievements chỉ load 1 lần lúc boot
  - Fix: `refreshUnlockedAchievements()` sau add/toggle/delete task và toggle habit

- [x] **P2-2** Forgot password — UI mock
  - Fix: hiển thị thông báo "chưa hỗ trợ" (`forgotUnavailable`)

- [x] **P2-3** Share list dùng `MOCK_USERS`
  - Fix: modal hiển thị `shareList.unavailable`, `allUsers: []`

- [x] **P2-4** `user-provider` restore user từ localStorage trước session validate
  - Fix: validate `/api/auth/session` trước, thêm `authReady`

- [x] **P2-5** Countdown fallback tạo id local khi API fail
  - Fix: báo lỗi, không tạo phantom record

---

## P3 — Backend validation & consistency

- [x] **P3-1** Backend update task cho phép title rỗng
- [x] **P3-2** Backend không validate `dueDate` invalid
- [x] **P3-3** Auth password chỉ `min(1)` — đổi thành `min(8)` khi register
- [x] **P3-4** Auth register trả token — backend + nextauth set cookie, user-provider bỏ login thừa
- [x] **P3-5** JWT issuer/audience config nhưng không validate khi verify
- [x] **P3-6** `geminiApiKey` lưu per-user — AI dùng user key, fallback env
- [x] **P3-7** Pomodoro GET state elapsed adjustment không persist DB
- [x] **P3-8** Pomodoro timer settings persist — `pomodoroSettingsJson` + frontend load/PUT

---

## P4 — AI & bảo mật (MVP+)

- [x] **P4-1** AI rate limit 30 req/phút/user
- [x] **P4-2** `geminiApiKey` expose qua GET settings — mask thành `'configured'`
- [x] **P4-3** `useGemini` fetch `/api/ai/status`, có `isLoading`
- [x] **P4-4** Chatbot/Briefing throw khi response rỗng + i18n `chatbot.error.empty`
- [x] **P4-5** Contract test `REAL_BACKEND_TEST=true` (`real-backend-contract.test.ts`)

---

## P5 — Code hygiene

- [x] Xóa legacy C# (`Taskflow.sln`), test pages, stub files
- [x] `tsconfig` tách tests — `next build` pass
- [x] Migrate `@/lib/hooks/use-i18n` → `@/lib/i18n/hooks` (file cũ giữ re-export deprecated)
- [x] Extract shared `getAuthTokenFromRequest` + `getRefreshTokenFromRequest` (`auth-token.ts`)

---

## Tiến độ

| Phase | Tổng | Xong |
|-------|------|------|
| P0 | 2 | 2 |
| P1 | 3 | 3 |
| P2 | 5 | 5 |
| P3 | 8 | 8 |
| P4 | 5 | 5 |
| P5 | 4 | 4 |

**Hoàn thành checklist audit.** Chạy `REAL_BACKEND_TEST=true npm test` khi backend thật đang chạy để verify contract E2E.
