# Taskflow MVP — Checklist hoàn thiện tính năng đã có

> Tạo: **2026-06-16**  
> Mục tiêu: polish từng module **đã ship** — không mở scope mới (AI UI, email reset, collaboration write) trừ khi ghi rõ ở Phase 4.  
> Liên quan: [FEATURE-COMPLETENESS.md](./FEATURE-COMPLETENESS.md), [ISSUES.md](./ISSUES.md)

**Cách dùng:** Làm tuần tự Phase 1 → 3. Đánh `[x]` khi xong + có test/verify. Phase 4 chỉ khi product quyết định.

---

## Tóm tắt tiến độ

| Phase | Mô tả | Tiến độ |
|-------|--------|---------|
| **1** | Tasks (cốt lõi) | 5/5 |
| **2** | Habits / Pomodoro / Countdown | 4/4 |
| **3** | Lists / Auth / Admin / UX nhỏ | 6/6 |
| **4** | Deferred (product decision) | — |

---

## Phase 1 — Tasks (~90% → ~95%)

| ID | Mục | Effort | Trạng thái |
|----|-----|--------|------------|
| **T1** | TaskForm: thêm **tags** + **reminder** khi tạo task | S | [x] |
| **T2** | Search: highlight kết quả, tìm trong subtasks/comments, empty state rõ hơn | S | [x] |
| **T3** | Undo/Redo: ghi chú UI “chỉ hoàn tác local” (tooltip hoặc help text) | XS | [x] |
| **T4** | Matrix: mô tả rõ “Priority Matrix” + (tuỳ chọn) kéo đổi priority | M | [x] |
| **T5** | Task list: empty state / loading nhất quán trên Today, Upcoming, Inbox | S | [x] |

**File tham chiếu:** `TaskForm.tsx`, `SearchModal.tsx`, `feature-bar.tsx`, `MatrixView.tsx`, `TaskList.tsx`

---

## Phase 2 — Habits / Pomodoro / Countdown (~85% → ~92%)

| ID | Mục | Effort | Trạng thái |
|----|-----|--------|------------|
| **H1** | Settings: UI `autoStartPomodoro` (schema đã có) | S | [x] |
| **H2** | Pomodoro: áp dụng `autoStartPomodoro` khi session kết thúc | S | [x] |
| **H3** | Countdown: E2E assert persist sau reload | S | [x] |
| **H4** | Habits: tooltip streak / giải thích achievement liên quan | XS | [x] |

**File tham chiếu:** `SettingsView.tsx`, `settings-provider.tsx`, `PomodoroView.tsx`, `countdown.spec.ts`

---

## Phase 3 — Lists / Auth / Admin / UX nhỏ

| ID | Mục | Effort | Trạng thái |
|----|-----|--------|------------|
| **L1** | Rename list + đổi màu từ sidebar (API đã có PUT list) | M | [x] |
| **L2** | Collaboration: quyết định **PR-2b write** hoặc ẩn nút Share — document trong ISSUES | M | [x] |
| **L3** | Shared list: member thấy board columns của owner (hoặc fallback cột mặc định) | L | [x] |
| **A1** | Admin E2E: edit/delete user | M | [x] |
| **A2** | Contract test `real-backend-contract` — chạy trong CI optional job | S | [x] |
| **U1** | Profile/Settings: copy nhất quán en/vi (chuỗi admin còn EN) | S | [x] |

---

## Phase 4 — Deferred (không làm trong đợt polish trừ khi được yêu cầu)

| ID | Mục | Ghi chú |
|----|-----|---------|
| **D1** | AI UI (`AI_FEATURES_ENABLED = true`) | Cần product + rate limit P2-10 |
| **D2** | Forgot password email (`PASSWORD_RESET_ENABLED = true`) | Cần mailer + API reset |
| **D3** | Server-side search tasks | Nice-to-have scale |
| **D4** | Landing page thay redirect `/login` | Marketing |
| **D5** | OAuth / verify email | Ngoài MVP |

---

## Thứ tự triển khai đề xuất (sprint)

1. **T1** → **T2** → **T3** (Tasks quick wins)
2. **H1** + **H2** (Settings/Pomodoro)
3. **T4** hoặc **L1** (tuỳ ưu tiên UX board vs list)
4. **H3**, **A1**, **L2** (test + product decision)
5. Phase 4 khi có lệnh riêng

---

## Verify sau mỗi mục

```bash
cd backend && npm test
cd frontend && npm test && npm run typecheck
# E2E (tuỳ mục): cd frontend && npm run test:e2e
```

**Cập nhật file này** sau mỗi mục hoàn thành (đổi `[ ]` → `[x]` và cột Tiến độ Phase).
