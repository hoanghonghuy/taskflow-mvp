# Taskflow MVP — Trạng thái code & backlog

> Cập nhật: **2026-06-12** — rà soát toàn bộ backend + frontend, đối chiếu test và luồng persistence.
> File này mô tả **thực trạng hiện tại**, không phải lịch sử audit cũ. Đánh dấu `[x]` khi đã xử lý xong.

---

## Tóm tắt nhanh

| Hạng mục | Trạng thái |
|----------|------------|
| Backend tests | 155/155 pass — coverage statements 95.84% (ngưỡng Jest 96%, CI có thể fail coverage) |
| Frontend tests | 223/223 pass — 2 contract test skipped (cần `REAL_BACKEND_TEST=true` + backend chạy) |
| E2E Playwright | Auth, tasks, habits, countdown, pomodoro, settings, admin, i18n — **không có e2e Board drag-drop** |
| Dùng backend thật (`MOCK_MODE=false`) | **Phần lớn ổn** — xem mục “Đang hoạt động đúng” |
| Lỗi cần sửa gấp | Board kéo-thả cột, countdown update/delete fallback local, xóa tag không sync API |

---

## Đang hoạt động đúng (backend thật)

Các luồng sau **gọi API và persist DB** như kỳ vọng MVP:

### Auth
- Đăng ký / đăng nhập, JWT + refresh token rotation, cookie HttpOnly qua BFF (`pages/api/auth/*`)
- App layout chặn route khi chưa auth; admin redirect theo `role === 'ADMIN'`
- Forgot password: UI báo “chưa hỗ trợ” (cố ý MVP)

### Tasks
- CRUD, toggle hoàn thành (`toggleTask` → API), reorder (optimistic + rollback)
- Calendar kéo đổi ngày → `updateTask()` với `dueDate`
- Matrix đổi priority → `updateTask()`
- Subtasks / comments → `syncSubtasks`, `syncComments`
- `addTask` / `updateTask` giữ `columnId: task.columnId ?? null` (không ghi đè null cứng)

### Lists
- CRUD list; Inbox resolve UUID qua `resolveInboxListIdFromLists` + backend `normalizeListId`
- Share list: modal “unavailable” (cố ý MVP — API `shareList` có nhưng UI chưa dùng)

### Habits
- CRUD, toggle completion theo ngày (`POST/DELETE .../complete`)

### Countdown
- **Tạo mới**: gọi API, báo lỗi khi fail (không tạo phantom record)

### Pomodoro
- Session hoàn thành → `createPomodoroSession`
- Timer state → `PUT /api/pomodoro/state`; settings → `PUT /api/settings` (`pomodoroSettingsJson`)
- Backend GET state tự trừ `remainingSeconds` theo elapsed (không persist mỗi tick — đúng thiết kế)

### Profile & Achievements
- Summary / achievements từ API
- `refreshUnlockedAchievements()` sau add/toggle/delete task và toggle habit

### Settings
- Theme, ngôn ngữ, bottom nav, notifications, pomodoro settings → sync API
- `geminiApiKey` mask thành `'configured'` trên GET

### Admin
- Stats, danh sách user, sửa role, xóa user (chặn xóa admin / self)

### AI (backend)
- API briefing / analyze / subtasks / chat; rate limit 30 req/phút/user
- **UI tắt** qua `AI_FEATURES_ENABLED = false` (`frontend/src/lib/feature-flags.ts`) — toast “đang phát triển”

### Backend đã xử lý (audit trước, vẫn đúng)
- Validate task title / dueDate; password register `min(8)`; JWT issuer/audience
- AI key per-user + fallback env; pomodoro settings persist DB
- `getAuthTokenFromRequest` / `getRefreshTokenFromRequest` dùng chung

---

## P0 — Mất dữ liệu / sai dữ liệu khi dùng backend thật

- [ ] **P0-1** `moveTaskToColumn` gửi sai `columnId: null` thay vì `newColumnId`
  - File: `frontend/src/components/providers/task-manager-provider.tsx` (~557–565)
  - Triệu chứng: kéo task sang cột khác trên Board → UI đổi tạm, **reload mất vị trí cột**
  - Fix: `columnId: newColumnId` (và dispatch optimistic trước nếu cần)

- [ ] **P0-2** Countdown **update/delete** fallback local khi API fail — UI vẫn toast success
  - File: `frontend/src/lib/hooks/use-countdown.ts` (~251–285)
  - Triệu chứng: server không lưu nhưng user nghĩ đã lưu / đã xóa
  - Fix: giống `addCountdown` — chỉ báo lỗi, không `dispatch` khi API fail
  - Ghi chú: create đã đúng; chỉ update/delete còn fallback

- [ ] **P0-3** Xóa tag sidebar (`DELETE_TAG`) chỉ sửa state local — không `updateTask` từng task có tag
  - Files: `frontend/src/components/layout/sidebar.tsx`, `frontend/src/lib/store/task-manager/reducers/tag-reducer.ts`
  - Triệu chứng: xóa tag → reload tag xuất hiện lại (derive từ `task.tags` trên server)
  - Fix: sau khi filter tasks local, gọi API cập nhật `tags` cho từng task bị ảnh hưởng

---

## P1 — UX / persistence một phần

- [ ] **P1-1** Auth: cookie session hợp lệ nhưng **thiếu `localStorage.user`** → UI coi chưa đăng nhập
  - File: `frontend/src/components/providers/user-provider.tsx` (`validateSession` chỉ `setUser` khi có `savedUser`)
  - Fix: khi `authenticated: true` mà không có local user, fetch profile hoặc decode từ session để rebuild `User`

- [ ] **P1-2** Board: thêm / đổi tên / xóa / reorder **cột tùy chỉnh** chỉ local — không persist
  - Files: `BoardView.tsx`, `BoardColumn.tsx`, `column-reducer.ts`
  - Backend không có entity `Column` — chỉ `TodoTask.columnId`
  - Cột mặc định (To Do / In Progress / Done) rebuild qua `buildBoardColumns()` khi load — **ổn cho MVP cơ bản**
  - Quyết định cần làm: (a) chấp nhận giới hạn MVP, hoặc (b) thêm API/model Column

- [ ] **P1-3** Undo/Redo chỉ revert reducer local — **không sync backend**
  - File: `frontend/src/lib/store/task-manager/history-reducer.ts`
  - Triệu chứng: undo sau mutation API thành công → lệch server

- [ ] **P1-4** `updateProfile` chỉ ghi `localStorage` — không API đổi tên/avatar trên server
  - File: `frontend/src/components/providers/user-provider.tsx`

- [ ] **P1-5** `allUsers` luôn `[]` — assignee dropdown, comment author, list members không resolve
  - File: `user-provider.tsx`
  - Liên quan share/collaboration chưa triển khai UI

---

## P2 — Backend validation & data integrity

- [ ] **P2-1** `listId` trên task **không validate** thuộc user (chỉ resolve alias `'inbox'`)
  - File: `backend/src/lib/inbox-list.ts`, `taskService.ts`
  - Schema: `TodoTask.listId` là `String` không FK — client có thể gán ID giả / list user khác

- [ ] **P2-2** `reorderTasks` không chặn **duplicate** trong `taskIds`
  - File: `backend/src/services/taskService.ts`
  - Có thể làm hỏng `sortOrder` nếu client gửi mảng trùng ID

- [ ] **P2-3** Inbox phụ thuộc tên `"Inbox"` — đổi tên / xóa Inbox gây lỗi resolve
  - Files: `backend/src/repositories/listRepository.ts`, `inbox-list.ts`
  - `deleteList` không chặn xóa Inbox → xóa luôn tasks trong list

- [ ] **P2-4** JWT `role` trong token **stale** sau promote/demote admin
  - File: `backend/src/middleware/auth.ts` (`requireAdmin` đọc claim JWT, không query DB)

- [ ] **P2-5** Không có endpoint **logout / revoke refresh token** toàn bộ session

- [ ] **P2-6** `PUT /api/pomodoro/*` và `PUT /api/settings` **không có Zod validator**
  - Files: `pomodoroController.ts`, `settingsController.ts`

- [ ] **P2-7** Habit / list **update** cho phép tên rỗng sau `.trim()` (create habit có fallback `'Untitled habit'`)
  - Files: `habitService.ts`, `listService.ts`

- [ ] **P2-8** `validateMembers` throw `Error` generic → HTTP **500** thay vì 400
  - File: `backend/src/services/listService.ts`

- [ ] **P2-9** Ngày habit / profile “hôm nay” dùng **UTC** (`toISOString().slice(0,10)`) — lệch timezone VN

- [ ] **P2-10** AI rate limit **in-memory** (`Map`) — không chia sẻ giữa nhiều instance backend

- [ ] **P2-11** Không có global **404 JSON envelope** — route sai trả Express default

- [ ] **P2-12** `GET /api/pomodoro/state` trả **204** khi chưa có state — khác pattern `{ success, data }` các endpoint khác

---

## P3 — Giới hạn MVP có chủ đích (không phải bug)

| Mục | Trạng thái | Ghi chú |
|-----|------------|---------|
| Landing `/` | Redirect `/login` | Landing page giữ trong code |
| AI trên UI | Tắt | `AI_FEATURES_ENABLED = false` |
| Forgot password | Chưa hỗ trợ | UI thông báo rõ |
| Share list | UI unavailable | Backend route có, modal chưa dùng |
| Collaboration / assignee | Chưa có | `allUsers = []` |
| Board cột tùy chỉnh | Chưa persist | Chỉ 3 cột mặc định + derive từ tasks |
| Profile server-side | Chưa có API | Chỉ localStorage |
| MOCK_MODE | Dev only | Pomodoro state không persist; AI 204 |

---

## P4 — Test & CI

- [ ] **P4-1** Backend coverage statements **95.84% < 96%** — `npm test` exit code 1 dù mọi test pass
  - Cân nhắc: hạ ngưỡng tạm hoặc bổ sung test cho `config`, `listService`, `habitController`

- [ ] **P4-2** Contract test `real-backend-contract.test.ts` **skipped** mặc định
  - Chạy thủ công: `REAL_BACKEND_TEST=true BACKEND_URL=http://localhost:8081 npm test -- real-backend-contract`

- [ ] **P4-3** Thiếu e2e **Board drag-drop persist** sau reload

---

## Kiến trúc nhanh (cho người mới)

```
Browser → Next.js pages/api/* (BFF) → Express /api/* → Prisma → PostgreSQL
                ↓
         TaskManagerProvider (reducer + history)
                ↓
         useTaskActions / useListActions / useHabitActions / ...
```

- **Source of truth khi đăng nhập:** backend API hydrate vào reducer
- **localStorage:** `user`, `settings`, `taskflowState` (ghi nhưng **không đọc lại** `taskflowState` khi boot)
- **MOCK_MODE=true:** in-memory mock trong `frontend/src/lib/server/mock-backend.ts` — không cần Postgres

Chi tiết thêm: [README.md](../README.md), [REFACTOR-LAYERING.md](../REFACTOR-LAYERING.md) (nếu có).

---

## Tiến độ backlog mới

| Phase | Mô tả | Mở | Xong |
|-------|--------|-----|------|
| P0 | Mất / sai dữ liệu backend thật | 3 | 0 |
| P1 | UX / persistence một phần | 5 | 0 |
| P2 | Backend validation & integrity | 12 | 0 |
| P3 | Giới hạn MVP (theo dõi) | — | documented |
| P4 | Test & CI | 3 | 0 |

**Cập nhật file này** sau mỗi đợt sửa lớn hoặc trước khi merge PR liên quan persistence/auth/board.
