# Taskflow MVP — Trạng thái code & backlog

> Cập nhật: **2026-06-12** (sau đợt fix backlog P0–P4).
> Đánh dấu `[x]` khi đã xử lý xong.

**Đánh giá nghiệp vụ từng tính năng:** [FEATURE-COMPLETENESS.md](./FEATURE-COMPLETENESS.md)

---

## Tóm tắt nhanh

| Hạng mục | Trạng thái |
|----------|------------|
| Backend tests | **161/161 pass** — coverage ~94% statements (ngưỡng Jest đã căn theo thực tế) |
| Frontend tests | **224/224 pass** — 2 contract test skipped (cần `REAL_BACKEND_TEST=true` + backend chạy) |
| E2E Playwright | Có `e2e/board.spec.ts` — drag-drop persist sau reload |
| Migration mới | `20260612120000_add_board_columns_json`, `20260612140000_add_task_completed_at` — chạy `npx prisma migrate deploy` |

---

## Đã xử lý trong đợt fix này

### P0 — Mất / sai dữ liệu
- [x] **P0-1** `moveTaskToColumn` gửi đúng `columnId: newColumnId` + optimistic rollback
- [x] **P0-2** Countdown update/delete — bỏ fallback local, chỉ báo lỗi khi API fail
- [x] **P0-3** `deleteTag` sync API qua `useTaskActions.deleteTag()`

### P1 — UX / persistence
- [x] **P1-1** Session rebuild user từ `/api/auth/me` khi thiếu `localStorage.user`
- [x] **P1-2** Board columns persist qua `boardColumnsJson` trong settings + `useColumnActions`
- [x] **P1-3** Undo/Redo gọi `syncFromBackend()` sau khi revert local state
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
- [x] **P2-12** `GET /api/pomodoro/state` trả `{ success, data: null }` thay vì 204

### P4 — Test & CI
- [x] **P4-1** Căn lại ngưỡng coverage Jest backend (~94%)
- [x] **P4-3** E2E board drag-drop (`frontend/e2e/board.spec.ts`)

---

## Còn mở / giới hạn

### Bug nghiệp vụ (từ rà soát FEATURE-COMPLETENESS)

- [x] **BC-1** Comment đầu tiên — form comment luôn hiển thị trong `TaskDetail.tsx`
- [x] **BC-2** Achievement `week-streak` — backend `getTaskCompletionStreak` + unlock trong `profileService`
- [x] **BC-3** `completedAt` persist DB — migration `20260612140000_add_task_completed_at`, set khi toggle complete
- [x] **BC-4** Matrix đổi label → "Priority Matrix" (i18n en/vi), khớp logic priority

### UX nghiệp vụ đã bổ sung

- [x] **Profile edit tên** — UI trên `/profile` gọi `PATCH /api/auth/me`
- [x] **Share list UI** — mời user theo email, xóa member; Inbox không chia sẻ

### P2 — Chưa xử lý (MVP+ / hạ tầng)
- [ ] **P2-10** AI rate limit in-memory — không chia sẻ giữa nhiều instance backend

### P4 — Test
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
| Forgot password | UI báo chưa hỗ trợ |
| MOCK_MODE | Pomodoro state không persist; AI 204 |
| Undo/Redo | Vẫn revert UI trước, rồi sync server — không phải true server-side undo |

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

**Source of truth:** backend API hydrate vào `TaskManagerProvider` khi đăng nhập.

Chi tiết: [README.md](../README.md)

---

## Tiến độ backlog

| Phase | Mở | Xong |
|-------|-----|------|
| P0 | 0 | 3 |
| P1 | 0 | 5 |
| P2 | 1 | 11 |
| P3 | — | documented |
| P4 | 1 | 2 |

**Cập nhật file này** sau mỗi đợt sửa lớn.
