# TaskFlow MVP — Manual QA Checklist (Browser như user)

**Chạy ngày:** 2026-08-11  
**Môi trường:** `http://localhost:3000` · Backend `http://localhost:8081`  
**Tài khoản dùng:** `user@gmail.com` / `user1234` (đăng ký mới thành công trong phiên này)

**Ký hiệu:** `[x]` pass · `[!]` fail · `[-]` skip / chưa chạy sâu · `[~]` pass một phần

---

## A. Auth & Session

- [x] A1. Landing `/` / login CTA — login page + Sign Up / Back to home
- [-] A2. Register validation chi tiết — chưa chạy hết case
- [~] A3. Login sai — chưa test lại sau khi user đã tồn tại
- [x] A4. Register + vào `/dashboard` với `user@gmail.com`
- [x] A5. Session giữ khi navigate giữa các trang
- [x] A6. Điều hướng List/Board/Calendar/… vẫn logged in
- [-] A7. Logout — chưa chạy trong phiên này
- [x] A8. User thường `/admin/dashboard` → redirect về `/dashboard`
- [-] A9. Login admin — chưa chạy
- [!] A10. Forgot password hiện “Email reset not available yet” (đúng product note, chưa có reset)

## B. Dashboard

- [x] B1. Greeting “Good evening!” + subtitle
- [x] B2. Stat cards: Tasks for Today / Upcoming / Habits
- [-] B3. Click Today card navigation
- [-] B4. Click Habits card
- [x] B5. Productivity Heatmap
- [x] B6. Today plan — “You are all caught up for today.”

## C. Lists (Sidebar)

- [x] C1. Inbox + My lists (Work, Personal seed)
- [-] C2. Tạo list mới
- [-] C3. Edit name/color
- [-] C4. Delete list
- [x] C5. Inbox count cập nhật sau tạo task (Inbox 1)
- [x] C6. Work/Personal có Edit / Share / Delete; Inbox không có Share/Delete trên row chính

## D. Tasks (List view)

- [x] D1. FAB Add Task mở modal “New Task”
- [x] D2. Tạo task “QA Manual Task” — toast “Task Added”
- [-] D3. Task với due date / tags / priority đầy đủ
- [-] D4. Complete / incomplete
- [-] D5–D11. Detail edit / subtask / comment / delete — chưa chạy sâu

## E. Board

- [~] E1. `/board` load được
- [!] E2. Console error: **duplicate React key** `…-todo` (lặp 3 lần) — risk UI board sai
- [-] E3. Move column / drag

## F. Calendar

- [x] F1. Month grid August 2026
- [x] F2. Month / Agenda toggle
- [x] F3. Today (Aug 11) selected
- [x] F4. Panel “Tasks for selected day” + empty state

## G. Matrix

- [x] G1. Bốn quadrant: Urgent & High / Low / Medium / No Priority
- [x] G2. “QA Manual Task” nằm **No Priority** (đúng default)
- [x] G3. Combobox “Change task priority” có đủ option

## H. Habits

- [x] H1. Empty state + Add Habit
- [x] H2. Form habit name + Add Habit submit
- [-] H3. Toggle complete sau khi tạo

## I. Countdown

- [x] I1. Empty state + “Add Countdown”
- [-] I2–I4. CRUD countdown

## J. Pomodoro

- [x] J1. Timer **25:00**, Focus, Start / Stop
- [x] J2. Settings Focus 25 minutes hiển thị
- [-] J3–J4. Start cycle / đổi duration

## K. Collaboration

- [x] K1. Share trên list Work
- [x] K2. Modal Share “Work”: Owner (E2E User), Invite form, Done
- [-] K3–K4. Invite lỗi (nonexistent / self)
- [x] K5. Modal mở được với Owner + Invite

## L. Profile & Achievements

- [x] L1. Profile: “E2E User”, `user@gmail.com`, Edit Profile
- [x] L2. Achievements page load + badge “Create your first task”

## M. Settings

- [x] M1. Language section + combobox
- [x] M2. Appearance + Theme filters All / Light / Dark
- [x] M3. AI Assistant: “not available in the app yet” (server-managed)
- [-] M4–M5. Đổi theme + persist reload

## N. Admin

- [x] N1. Non-admin bị chặn (redirect dashboard)
- [-] N2–N3. Admin dashboard / users (cần login admin)

## O. Error / Edge

- [!] O1. Route 404 hiện **Next.js default** (“404 / This page could not be found.”) — **không** dùng `not-found.tsx` custom (“Page not found” + Go to dashboard)
- [x] O2. Admin route unauthorized → redirect
- [-] O3. Spam click
- [!] O4. Board: React duplicate key errors trong console

## P. Responsive

- [-] P1–P2. Chưa test viewport tablet/mobile trong phiên này

---

## Kết quả tổng (phiên 2026-08-11)

| Nhóm | Pass | Fail | Skip/Partial |
|------|------|------|--------------|
| A Auth | 5 | 0 | 4 |
| B Dashboard | 4 | 0 | 2 |
| C Lists | 3 | 0 | 3 |
| D Tasks | 2 | 0 | 3 |
| E Board | 0 | 1 | 2 |
| F Calendar | 4 | 0 | 0 |
| G Matrix | 3 | 0 | 0 |
| H Habits | 2 | 0 | 1 |
| I Countdown | 1 | 0 | 1 |
| J Pomodoro | 2 | 0 | 1 |
| K Share | 3 | 0 | 1 |
| L Profile | 2 | 0 | 0 |
| M Settings | 3 | 0 | 1 |
| N Admin | 1 | 0 | 1 |
| O Edge | 1 | 2 | 1 |
| P Responsive | 0 | 0 | 2 |
| **Ước lượng** | **~36** | **3** | **~24** |

---

## Bugs / findings

1. **BUG — Board duplicate React keys**  
   Console: `Encountered two children with the same key …-todo` (×3) trên `/board`.  
   Impact: board có thể render sai / duplicate column hoặc task.

2. **BUG — Custom 404 không hiện**  
   URL không tồn tại → Next.js default 404, không phải UI `Page not found` + link dashboard trong `app/(app)/not-found.tsx`.  
   Giải thích khả năng: `not-found.tsx` chỉ trong route group `(app)`, route lạ không match layout đó.

3. **NOTE — Forgot password**  
   UI ghi “Email reset not available yet” — đúng trạng thái sản phẩm hiện tại, không phải regression.

4. **NOTE — AI settings**  
   “AI features are managed by the server and are not available in the app yet.”
