# Taskflow MVP — Testing & Quality Checklist

> Tạo sau phiên mở rộng coverage (unit + E2E). Dùng làm backlog trước khi sửa.
> Đánh dấu `[x]` khi hoàn thành.

**Baseline đã đạt (phiên coverage expansion):**

| Metric | Trước | Hiện tại |
|--------|-------|----------|
| Frontend coverage (Vitest) | 71.17% ❌ | ~79% ✅ |
| Backend branch coverage | 75.24% | ~80.5% |
| E2E specs | ~14 | ~59 (ước tính) |
| Frontend unit tests | — | 223 pass |
| Backend tests | — | 155 pass |

**Chưa xác nhận:** full E2E suite pass trên CI; lint trong CI.

---

## P0 — Chặn CI / regression (làm trước)

- [ ] Chạy full E2E: `cd frontend && npm run test:e2e`
- [ ] Ghi lại danh sách spec fail + artifact (`playwright-report/`, `test-results/`)
- [ ] Sửa `frontend/e2e/settings.spec.ts`
  - [ ] Dùng selector không ambiguous (ví dụ `h1` đầu tiên, tránh match cả "Pomodoro Settings")
  - [ ] Theme preset: chờ UI ổn định thay vì assert heading chung
- [ ] Sửa `frontend/e2e/habits.spec.ts`
  - [ ] Complete habit: click đúng ô tuần / 30 ngày theo UI thật (`HabitsView.tsx`)
  - [ ] Delete habit: nút trash + dialog confirm (không tìm `getByRole('button', { name: /delete/i })`)
  - [ ] Bỏ test chỉ assert "habit tồn tại" thay cho flow thật
- [ ] Rà các spec có `if (await …isVisible())` hoặc `expect(true).toBe(true)` → assert có ý nghĩa hoặc `test.skip` có lý do
  - [ ] `frontend/e2e/ai.spec.ts`
  - [ ] `frontend/e2e/mobile-navigation.spec.ts`
  - [ ] `frontend/e2e/achievements.spec.ts`
- [ ] Chạy E2E 2–3 vòng liên tiếp để phát hiện flaky

---

## P1 — Chất lượng code & CI

- [ ] Thêm bước lint vào `.github/workflows/ci.yml` (hoặc job riêng)
- [ ] Chạy `npm run lint` (frontend) — liệt kê và xử lý **error** trước warning
- [ ] Sửa ưu tiên:
  - [ ] `frontend/src/lib/hooks/use-client-mounted.ts` — setState trong effect
  - [ ] `frontend/src/lib/hooks/use-countdown.ts` — `useCallback` thiếu dependency `success`
  - [ ] API routes: tránh `return res.status(...)` (cảnh báo Next.js "handler should not return a value")
    - [ ] `frontend/src/pages/api/pomodoro/state.ts` và các proxy tương tự
- [ ] Nâng coverage threshold sau khi số liệu ổn định:
  - [ ] `backend/jest.config.ts`: `branches` 75 → ~80
  - [ ] `frontend/vitest.config.ts`: lines/statements 72 → ~79 (hoặc 80 nếu đủ headroom)

---

## P2 — Logic backend / API

- [ ] **Countdown validation**
  - [ ] Quyết định contract: bắt buộc `title` + `targetDate` hay giữ default (`"Untitled"`, `new Date()`)
  - [ ] Files: `backend/src/validators/countdown.validator.ts`, `backend/src/services/countdownService.ts`
  - [ ] Cập nhật integration test cho khớp contract
- [ ] **List members**
  - [ ] Validate `members` là user ID hợp lệ / tồn tại
  - [ ] Trả 400 khi member không hợp lệ (hiện chấp nhận `invalid-user-id`)
  - [ ] File: `backend/src/services/listService.ts`
- [ ] Rà branch coverage còn thấp (nếu muốn đẩy thêm):
  - [ ] `taskController.ts`, `habitController.ts`
  - [ ] `backend/src/lib/jwt.ts`, `backend/src/services/llmService.ts`

---

## P3 — E2E ổn định selector

- [ ] Thêm `data-testid` / `aria-label` ổn định (tùy chọn nhưng khuyến nghị):
  - [ ] Habits: add, complete cell, delete
  - [ ] Countdown: add, edit, delete, color
  - [ ] Pomodoro: start / pause / stop, chọn task
  - [ ] Settings: language, theme, notification
- [ ] Chạy và sửa theo UI thật:
  - [ ] `frontend/e2e/countdown.spec.ts`
  - [ ] `frontend/e2e/pomodoro.spec.ts`
  - [ ] `frontend/e2e/profile.spec.ts`
  - [ ] `frontend/e2e/achievements.spec.ts`
- [ ] `frontend/e2e/mobile-navigation.spec.ts` — project `mobile` (Pixel 5) trong `playwright.config.ts`
- [ ] `frontend/e2e/ai.spec.ts`:
  - [ ] `AI_FEATURES_ENABLED = false` → assert unavailable / coming soon
  - [ ] Khi bật AI: happy path với mock/stub (chưa làm)

---

## P4 — UI/UX & accessibility (a11y)

- [ ] Mobile: tiêu đề trang `hidden md:block` trên nhiều view — cân nhắc title mobile trong shell hoặc H1 luôn hiển thị
  - [ ] `HabitsView`, `SettingsView`, `PomodoroView`, `ProfileView`, `CountdownView`, `AchievementsView`, …
- [ ] Habits: lưới 30 ngày dùng `div onClick` → `button` (đồng bộ lưới 7 ngày)
  - [ ] File: `frontend/src/features/habits/views/HabitsView.tsx`
- [ ] Settings: hierarchy heading ("Settings" vs "Pomodoro Settings") — tránh ambiguous cho user và E2E
- [ ] Dialog confirm (delete habit/task): focus trap + keyboard
- [ ] (Tùy chọn) Accessibility scan habits / settings / pomodoro

---

## P5 — Coverage & tài liệu

- [ ] Không commit artifact coverage (`backend/coverage/`, `frontend/coverage/`) — đã có trong `.gitignore`
- [ ] Ghi baseline cuối vào README hoặc doc test:
  - [ ] Backend: statements / branches / functions / lines
  - [ ] Frontend Vitest (phạm vi include trong `vitest.config.ts`) + %
  - [ ] E2E: số case pass / tổng
- [ ] Cập nhật `.cursor/plans/coverage_expansion_18413a4d.plan.md` — phase đã xong / còn lại
- [ ] Quyết định có mở rộng Vitest sang `src/lib/hooks/**` và features UI hay không

---

## P6 — AI & tính năng có điều kiện

- [ ] Xác nhận `AI_FEATURES_ENABLED = false` trong `frontend/src/lib/feature-flags.ts` là chủ đích MVP
- [ ] Nếu bật AI: env key, rate limit, E2E mock/stub
- [ ] Document cách bật AI local + CI (tránh flake vì thiếu API key)

---

## Thứ tự đề xuất

```
P0 (E2E pass CI)
  → P1 (lint + threshold)
    → P2 (validation backend)
      → P3 (selector / test ổn định)
        → P4 (UX / a11y)
          → P5–P6 (docs & AI)
```

---

## Liên quan

- Audit issues cũ (đã xử lý nhiều mục P0–P2): [ISSUES.md](./ISSUES.md)
- Kế hoạch coverage gốc: [.cursor/plans/coverage_expansion_18413a4d.plan.md](../.cursor/plans/coverage_expansion_18413a4d.plan.md)
