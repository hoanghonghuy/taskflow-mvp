# Taskflow MVP — Trạng thái code & backlog

> Cập nhật: **2026-06-13** (sau đợt production hardening Phase 1–4 + sync docs Phase 5).
> Đánh dấu `[x]` khi đã xử lý xong.

**Đánh giá nghiệp vụ từng tính năng:** [FEATURE-COMPLETENESS.md](./FEATURE-COMPLETENESS.md)

---

## Tóm tắt nhanh

| Hạng mục | Trạng thái |
|----------|------------|
| Backend tests | **173/173 pass** — coverage ~94% statements (ngưỡng Jest đã căn theo thực tế) |
| Frontend tests | **235/235 pass** — 2 contract test skipped (cần `REAL_BACKEND_TEST=true` + backend chạy) |
| E2E Playwright | 15 spec — thêm logout (`auth.spec.ts`), board drag-drop persist (`board.spec.ts`) |
| Migration mới | `20260612120000_add_board_columns_json`, `20260612140000_add_task_completed_at` — chạy `npx prisma migrate deploy` |

**Đánh giá production (1 user):** MVP **ổn cho dùng hàng ngày** sau hardening; chưa sẵn sàng multi-tenant collaboration hoặc forgot-password thật.

---

## Đã xử lý — production hardening (2026-06-13)

### Phase 1 — Bug P0 dữ liệu

- [x] **PH1-1** `DELETE_COLUMN` — task orphan chuyển đúng cột đích sau khi filter cột bị xóa (`column-reducer.ts`)
- [x] **PH1-2** Undo/Redo — **bỏ** `syncFromBackend()` sau UNDO/REDO (tránh ghi đè state local đã revert)
- [x] **PH1-3** TaskDetail — optimistic update + debounce 500ms + `updateTask(..., { silent: true })`
- [x] **PH1-4** TaskForm — bỏ toast trùng khi tạo task
- [x] **PH1-5** `totalFocusTime` per-task từ `PomodoroSession` (BE mapper + FE)
- [x] **PH1-6** Pomodoro general focus — luôn ghi `focusHistory` / session
- [x] **PH1-7** `toYYYYMMDD` dùng local date (không UTC) — ảnh hưởng Today/Upcoming/Habits
- [x] **PH1-8** `.grid-cols-30` trong `globals.css` (Habits lưới 30 ngày)

### Phase 2 — Auth & mobile

- [x] **PH2-1** `middleware.ts` — guard route bằng cookie `taskflow_token` / `taskflow_refresh` (presence only, không validate JWT)
- [x] **PH2-2** Forgot password — bỏ form giả, trang thông báo tĩnh "chưa hỗ trợ"
- [x] **PH2-3** Sidebar share/delete hiện trên mobile (`opacity-100 md:opacity-0`)
- [x] **PH2-4** `vi.json` — block `achievements` đầy đủ
- [x] **PH2-5** Auth 401 đồng bộ — `session-events.ts`, `api/client.ts`, `user-provider`, `settings-provider`
- [x] **PH2-6** App layout — bỏ fetch session trùng; loading dùng `t('common.loading')`
- [x] **PH2-7** `user-provider` — bỏ `[t]` khỏi deps validate session

### Phase 3 — UX production

- [x] **PH3-1** TaskItem — actions luôn hiện mobile; focus dùng `task.id.split('_')[0]`
- [x] **PH3-2** Calendar panel ngày chọn → click mở TaskDetail
- [x] **PH3-3** TaskList upcoming summary khớp filter (mọi ngày tương lai)
- [x] **PH3-4** `groupUpcomingTasks` theo locale
- [x] **PH3-5** Countdown — map hex → design token; request notification permission
- [x] **PH3-6** PomodoroView — gọn menu (Statistics + Settings); stats tabs có nội dung
- [x] **PH3-7** Profile — `updateProfile` trả `boolean` + toast success/fail
- [x] **PH3-8** TaskDetail — label ngày tạo i18n (`taskDetail.createdAtLabel`)
- [x] **PH3-9** Error recovery — `(app)/error.tsx`, `loading.tsx`, `not-found.tsx`

### Phase 4 — Polish & E2E

- [x] **PH4-1** `isHydrating` trong `TaskManagerProvider` — app layout chờ hydrate backend (`useLayoutEffect`)
- [x] **PH4-2** Achievements i18n — `achievements.items.*` en/vi; bỏ hardcode EN trong view/constants
- [x] **PH4-3** `week-streak` client — điều kiện dùng `toYYYYMMDD` (khớp timezone VN)
- [x] **PH4-4** Settings bottom nav subtitle — mô tả đúng UI Switch (không "kéo thả")
- [x] **PH4-5** ListView FAB — ẩn trên mobile (`hidden md:flex`) vì TaskList đã có nút Add
- [x] **PH4-6** Logout — `profile-dropdown` redirect `/login` sau `logout()`
- [x] **PH4-7** Not-found i18n — `common.notFoundTitle/Body/goToDashboard`
- [x] **PH4-8** E2E logout — test trong `auth.spec.ts`

---

## Đã xử lý — đợt fix trước (2026-06-12)

### P0 — Mất / sai dữ liệu
- [x] **P0-1** `moveTaskToColumn` gửi đúng `columnId: newColumnId` + optimistic rollback
- [x] **P0-2** Countdown update/delete — bỏ fallback local, chỉ báo lỗi khi API fail
- [x] **P0-3** `deleteTag` sync API qua `useTaskActions.deleteTag()`

### P1 — UX / persistence
- [x] **P1-1** Session rebuild user từ `/api/auth/me` khi thiếu `localStorage.user`
- [x] **P1-2** Board columns persist qua `boardColumnsJson` trong settings + `useColumnActions`
- [x] **P1-3** Undo/Redo revert local state (sync server qua debounce provider — **không** gọi `syncFromBackend` ngay sau undo)
- [x] **P1-4** `updateProfile` gọi `PATCH /api/auth/me` khi đổi tên
- [x] **P1-5** `allUsers` load từ `/api/auth/collaborators` (members trong lists)

### P2 — Backend validation & integrity
- [x] **P2-1** `normalizeListId` validate list thuộc user
- [x] **P2-2** `reorderTasks` chặn duplicate ID
- [x] **P2-3** Chặn xóa Inbox; `resolveInboxListId` throw nếu thiếu Inbox
- [x] **P2-4** `requireAdmin` query role từ DB
- [x] **P2-5** `POST /api/auth/logout` revoke refresh tokens
- [x] **P2-6** Zod validator cho pomodoro + settings
- [x] **P2-7** Chặn tên rỗng khi update habit/list
- [x] **P2-8** `validateMembers` → `AppError` 400
- [x] **P2-9** Ngày habit/profile dùng `Asia/Ho_Chi_Minh` (`lib/date.ts`)
- [x] **P2-11** Global 404 JSON envelope
- [x] **P2-12** `GET /api/pomodoro/state` trả `204 No Content` khi chưa có state (khôi phục hành vi API gốc)

### P4 — Test & CI
- [x] **P4-1** Căn lại ngưỡng coverage Jest backend (~94%)
- [x] **P4-3** E2E board drag-drop (`frontend/e2e/board.spec.ts`)

### Bug nghiệp vụ (FEATURE-COMPLETENESS)
- [x] **BC-1** Comment đầu tiên — form comment luôn hiển thị trong `TaskDetail.tsx`
- [x] **BC-2** Achievement `week-streak` — backend `getTaskCompletionStreak` + unlock trong `profileService`
- [x] **BC-3** `completedAt` persist DB — migration `20260612140000_add_task_completed_at`
- [x] **BC-4** Matrix đổi label → "Priority Matrix" (i18n en/vi)

### UX nghiệp vụ đã bổ sung
- [x] **Profile edit tên** — UI trên `/profile` gọi `PATCH /api/auth/me`
- [x] **Share list UI** — mời user theo email, xóa member; Inbox không chia sẻ
- [x] **Recurrence MVP** — UI TaskDetail; backend advance `dueDate` khi complete
- [x] **Recurrence nâng cao UI** — interval, weekdays, end date

---

## Còn mở / giới hạn

### Production / hạ tầng

- [ ] **PR-1** Middleware chỉ kiểm tra cookie tồn tại — không validate JWT server-side trên edge
- [ ] **PR-2** Collaboration multi-tenant — member **không** thấy list/task của owner (metadata members chỉ lưu trên list owner)
- [ ] **P2-10** AI rate limit in-memory — không chia sẻ giữa nhiều instance backend

### Test

- [ ] **P4-2** Contract test `real-backend-contract.test.ts` vẫn skipped mặc định  
  Chạy: `REAL_BACKEND_TEST=true BACKEND_URL=http://localhost:8081 npm test -- real-backend-contract`

### AI — tạm không mở (quyết định product)

> **Không bật AI trên UI trong giai đoạn hiện tại.** Giữ trải nghiệm "đang phát triển".

| Hạng mục | Trạng thái |
|----------|------------|
| `AI_FEATURES_ENABLED` | `false` — `frontend/src/lib/feature-flags.ts` |
| UX khi user bấm AI | Toast / copy "đang phát triển" (E2E `ai.spec.ts` cover path này) |
| Backend | API Gemini/OpenAI **vẫn giữ** — dùng khi dev/test hoặc bật sau |
| Settings UI | Không nhập API key; hướng dẫn env server |
| Khi nào mở | Chưa lên lịch — cần quyết định product riêng (key, rate limit P2-10, UX key) |

**Không làm trong backlog gần:** đổi flag sang `true`, UI nhập key, bật briefing/chat/analyze trên production UI.

### P3 — Giới hạn MVP có chủ đích

| Mục | Ghi chú |
|-----|---------|
| Landing `/` | Redirect `/login` |
| AI trên UI | Xem mục **AI — tạm không mở** ở trên |
| Forgot password | Trang tĩnh báo chưa hỗ trợ — **không** gửi email reset |
| MOCK_MODE | Pomodoro state không persist; AI 204 |
| Undo/Redo | Revert UI local; provider debounce sync — **không** phải server-side undo stack |
| Route guard | Cookie presence (`middleware.ts`) — không thay thế session validation đầy đủ |

---

## API mới (backend)

| Method | Path | Mô tả |
|--------|------|--------|
| `GET` | `/api/auth/me` | User hiện tại |
| `PATCH` | `/api/auth/me` | Cập nhật tên |
| `POST` | `/api/auth/logout` | Revoke refresh tokens |
| `GET` | `/api/auth/collaborators` | Users trong members của lists |
| `GET` | `/api/auth/users/lookup?email=` | Tìm user để mời vào list |

Settings thêm field `boardColumns` (persist `boardColumnsJson`).

---

## Kiến trúc nhanh

```
Browser → Next.js pages/api/* (BFF) → Express /api/* → Prisma → PostgreSQL
```

**Source of truth:** backend API hydrate vào `TaskManagerProvider` khi đăng nhập (`isHydrating` gate UI).

Chi tiết: [README.md](../README.md)

---

## Tiến độ backlog

| Phase | Mô tả | Trạng thái |
|-------|--------|------------|
| P0–P4 (2026-06-12) | Bug data, backend validation, E2E board | ✅ Xong |
| PH1–PH4 (2026-06-13) | Production hardening UX/auth/data | ✅ Xong |
| Phase 5 | Sync docs (`ISSUES`, `FEATURE-COMPLETENESS`) | ✅ Xong |
| PR-1, PR-2 | JWT edge validation, multi-tenant lists | Mở |

**Cập nhật file này** sau mỗi đợt sửa lớn.
