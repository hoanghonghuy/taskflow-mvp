# Taskflow — Production Core (cốt lõi)

> Cập nhật: **2026-06-16**  
> Phạm vi: **production cho 1 user** — collaboration write và AI **tạm khoá**.  
> Email reset (SMTP) **hoãn** — làm sau khi có mailer.

**Quy tắc:** Làm **tuần tự**. Mỗi mục phải có test + verify (`npm test`, typecheck) trước khi chuyển mục tiếp theo.

---

## Tiến độ

| ID | Mục | Trạng thái |
|----|-----|------------|
| **PC-1** | Server-side task search | [x] |
| **PC-2** | Reminder in-app + UX (không SMTP) | [x] |
| **PC-3** | E2E regression core (recurrence, search, mobile paths) | [x] |

**Khoá / hoãn:** FP-2 email reset, PR-2b collaboration write, AI UI (Phase 4).

---

## PC-1 — Server-side search

**Mục tiêu:** `GET /api/tasks/search?q=&limit=` — tìm title, description, tags, subtasks, comments JSON; respect list access (own + shared read).

**Verify:**
```bash
cd backend && npm test
cd frontend && npm test && npm run typecheck
```

---

## PC-2 — Reminder in-app + UX

**Mục tiêu:** Toast/banner khi reminder đến hạn (tab mở); copy rõ giới hạn; không SMTP.

**Verify:** unit/integration + manual checklist.

---

## PC-3 — E2E regression core

**Mục tiêu:** Playwright cover search API path, recurrence smoke, critical mobile navigation.

**Verify:** `cd frontend && npm run test:e2e`

---

## Verify sau mỗi mục

```bash
cd backend && npm test
cd frontend && npm test && npm run typecheck
```

Đánh `[x]` trong bảng tiến độ khi xong.
