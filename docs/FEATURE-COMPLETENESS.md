# Taskflow MVP — Độ hoàn thiện tính năng so với nghiệp vụ

> Cập nhật: **2026-06-13** (sau production hardening Phase 1–4).  
> Đối chiếu README, luồng UI, API backend, E2E Playwright.  
> Mức % là **ước lượng** theo tiêu chí: *user story cốt lõi hoàn thành được end-to-end với backend thật*.

Liên quan: [ISSUES.md](./ISSUES.md) (backlog kỹ thuật), [README.md](../README.md) (phạm vi MVP).

---

## Tổng quan

| Nhóm | Mức hoàn thiện | Đánh giá ngắn |
|------|----------------|---------------|
| **Tasks (cốt lõi)** | ~90% | CRUD + 4 view + persist DB; debounce edit, undo ổn hơn; focus time có trên task |
| **Habits / Countdown / Pomodoro** | ~85% | MVP cá nhân đủ; habits grid + timezone VN |
| **Auth / Admin** | ~82% | Login/register/logout/middleware; forgot password vẫn placeholder |
| **Profile / Achievements** | ~80% | Sửa tên + toast; achievements i18n en/vi |
| **Settings / i18n / Mobile** | ~88% | Theme, ngôn ngữ, bottom nav, mobile actions; AI key UI chưa có |
| **Lists / Collaboration** | ~58% | Share list UI OK; member **không** thấy data owner |
| **AI** | ~15% UI / ~55% BE | Backend sẵn; UI tắt cờ `AI_FEATURES_ENABLED` |

**Kết luận:** MVP **đủ dùng ổn cho 1 người** sau hardening 2026-06-13. Chưa đủ nếu kỳ vọng **cộng tác thật (multi-tenant)**, **AI trên UI**, hoặc **forgot password / email**.

---

## 1. Tasks — ~90%

README hứa: *list, board, matrix, calendar; kéo-thả persist DB*.

| User story | Kỳ vọng nghiệp vụ | Thực tế | Gap |
|------------|-------------------|---------|-----|
| Tạo/sửa/xóa task | Title, mô tả, hạn, ưu tiên, list | ✅ End-to-end qua API | Form tạo **không có** tags, subtasks, reminder, assignee — mở TaskDetail sau |
| Today / Upcoming / Inbox | Lọc task theo ngày & inbox | ✅ Filter + `toYYYYMMDD` local (VN) | Upcoming summary đã khớp filter mọi ngày tương lai |
| List view + reorder | Sắp xếp thứ tự task | ✅ Drag → `POST /api/tasks/reorder` | Reorder global; FAB desktop only (mobile dùng nút trong list) |
| Board Kanban | Cột + kéo task giữa cột | ✅ Persist `boardColumnsJson` + E2E reload | Inbox **không** có trên board; xóa cột không orphan task |
| Calendar | Xem task theo ngày | ✅ Kéo đổi `dueDate`; click panel ngày → TaskDetail | Expand recurring preview; không tạo task từ calendar |
| Matrix (Eisenhower) | Phân loại urgent/important | ⚠️ Chỉ map theo **priority**, read-only | Label "Priority Matrix" — không kéo đổi ô |
| Subtasks | Checklist trong task | ✅ TaskDetail + sync API | AI generate subtask tắt (AI off) |
| Tags | Gắn/lọc tag | ✅ TaskDetail + sidebar filter | Form tạo không có tag |
| Comments | Thảo luận trên task | ✅ | Form comment luôn hiển thị (BC-1 đã fix) |
| Assignee | Giao việc | ⚠️ TaskDetail dropdown | Chỉ collaborators; 1 user thì gần vô dụng |
| Recurrence | Task lặp lại | ✅ | UI full + advance `dueDate` + calendar expand |
| Reminder | Nhắc trước hạn | ⚠️ | `reminderMinutes` + `Notification` trình duyệt (tab mở) |
| Search | Tìm task nhanh | ⚠️ | Client-side; không server search |
| Undo/Redo | Hoàn tác thao tác | ⚠️ | Revert UI local; **không** gọi `syncFromBackend` ngay sau undo (tránh ghi đè) |
| Focus time trên task | Thời gian pomodoro gắn task | ✅ | `totalFocusTime` từ `PomodoroSession` (BE + FE mapper) |
| TaskDetail edit | Sửa inline không spam API | ✅ | Debounce 500ms + `silent: true` |

File tham chiếu: `TaskForm.tsx`, `TaskDetail.tsx`, `task-manager-provider.tsx`, `ListView.tsx`, `board.spec.ts`.

---

## 2. Habits — ~88%

| User story | Thực tế | Gap |
|------------|---------|-----|
| Tạo/xóa habit | ✅ | — |
| Đánh dấu hoàn thành theo ngày | ✅ Timezone VN (`toYYYYMMDD`) | — |
| Lưới 30 ngày | ✅ `.grid-cols-30` + E2E | — |
| Streak / nhắc nhở | ⚠️ | Streak qua achievement; không push notification |

---

## 3. Countdown — ~82%

| User story | Thực tế | Gap |
|------------|---------|-----|
| CRUD sự kiện đếm ngược | ✅ Persist DB | — |
| Sửa title/ngày/màu | ✅ Token màu thay hex raw | E2E chưa assert persist sau reload |
| Thông báo khi đến hạn | ⚠️ | Request `Notification` permission; phụ thuộc tab mở |

---

## 4. Pomodoro — ~82%

| User story | Thực tế | Gap |
|------------|---------|-----|
| Start/pause/stop timer | ✅ | — |
| Gắn task focus | ✅ | General focus cũng lưu session |
| Lưu session | ✅ `PomodoroSession` | — |
| Cộng focus vào task | ✅ `totalFocusTime` trên task API | — |
| State sau reload tab | ✅ Server tính `remainingSeconds` | `MOCK_MODE` không persist |
| Cấu hình duration | ✅ Settings | `autoStartPomodoro` có schema, **không UI** |
| Statistics UI | ✅ | Menu gọn; tabs có nội dung |

---

## 5. Auth — ~82%

| User story | Thực tế | Gap |
|------------|---------|-----|
| Đăng ký / đăng nhập | ✅ JWT + refresh | — |
| Session ổn định | ✅ `/api/auth/me` rebuild user | — |
| Route guard | ✅ `middleware.ts` cookie presence | Không validate JWT trên edge |
| Session hết hạn | ✅ 401 → `emitSessionExpired` đồng bộ providers | — |
| Đăng xuất | ✅ Revoke + redirect `/login` | E2E logout ✅ (`auth.spec.ts`) |
| Đổi tên | ✅ API + UI profile + toast | — |
| Quên mật khẩu | ❌ | Trang tĩnh "chưa hỗ trợ" — không gửi email |
| OAuth / verify email | ❌ | Ngoài scope MVP |

---

## 6. Profile & Achievements — ~80%

| User story | Thực tế | Gap |
|------------|---------|-----|
| Xem thống kê | ✅ API + dashboard | Timezone VN |
| Achievements badge | ✅ | Backend + client `week-streak`; client condition dùng `toYYYYMMDD` |
| Achievements i18n | ✅ | `achievements.items.*` en/vi |
| Sửa profile | ✅ | `updateProfile` boolean + toast success/fail |

Backend achievements: `first-task`, `complete-10`, `complete-50`, `habit-7-day-streak`, `focus-1h`, `week-streak`.

---

## 7. Settings — ~85%

| User story | Thực tế | Gap |
|------------|---------|-----|
| Theme | ✅ | — |
| Ngôn ngữ en/vi | ✅ Cookie + DB | Một số chuỗi admin còn EN |
| Notification test | ✅ Browser API | — |
| Bottom nav mobile | ✅ Persist 4 shortcut; subtitle đúng UI Switch | — |
| Pomodoro settings | ✅ | `autoStartPomodoro` thiếu UI |
| Gemini API key | ❌ UI | DB có field; frontend strip key |

---

## 8. Admin — ~74%

| User story | Thực tế | Gap |
|------------|---------|-----|
| Dashboard thống kê | ✅ E2E | — |
| Danh sách / chi tiết user | ✅ | List mặc định chỉ `USER` |
| Sửa/xóa user thường | ✅ Backend | E2E **chưa cover** edit/delete |
| Promote admin từ UI | ❌ | Chỉ seed qua env |

---

## 9. Lists & Collaboration — ~58%

| User story | Thực tế | Gap |
|------------|---------|-----|
| Tạo/xóa list (trừ Inbox) | ✅ Sidebar; share/delete visible mobile | Không rename/đổi màu từ UI |
| Share list / members | ✅ Mời email; xóa member; Inbox không share | — |
| Assignee task | ⚠️ | Cần share list trước |
| Member thấy list của owner | ❌ | **PR-2** — chưa multi-tenant list view |

---

## 10. AI — ~15% UI / ~55% BE *(cố ý chưa ship)*

**Quyết định:** Tạm **không mở** AI trên UI. User thấy "đang phát triển".

| Layer | Thực tế |
|-------|---------|
| Backend | Briefing, analyze task, subtasks, chat — Gemini/OpenAI |
| UI | `AI_FEATURES_ENABLED = false` |
| Settings | Không nhập key; env server |
| Roadmap | Xem [ISSUES.md](./ISSUES.md) mục "AI — tạm không mở" |

---

## 11. i18n & Mobile — ~88%

| User story | Thực tế | Gap |
|------------|---------|-----|
| en / vi | ✅ Hầu hết màn hình + achievements + not-found | E2E i18n chủ yếu login/register |
| Bottom nav + sidebar mobile | ✅ E2E + actions visible | — |
| Hydrate loading | ✅ `isHydrating` — không flash state trống | — |
| Error boundaries | ✅ `error.tsx`, `loading.tsx`, `not-found.tsx` | — |

---

## Bug nghiệp vụ — đã sửa

| ID | Mô tả | Trạng thái |
|----|-------|------------|
| **BC-1** | Comment đầu tiên không thêm được | ✅ |
| **BC-2** | Achievement `week-streak` lệch client/server | ✅ Backend + client `toYYYYMMDD` |
| **BC-3** | `completedAt` chỉ local | ✅ Cột DB |
| **BC-4** | Matrix gợi Eisenhower | ✅ Label "Priority Matrix" |
| **PH1-2** | Undo bị `syncFromBackend` ghi đè | ✅ Bỏ sync ngay sau undo |
| **PH1-5** | `totalFocusTime` luôn undefined | ✅ Mapper từ PomodoroSession |
| **PH1-7** | Today/Upcoming lệch timezone UTC | ✅ `toYYYYMMDD` local |
| **PH4-1** | Flash UI trống khi hydrate | ✅ `isHydrating` + layout gate |

---

## Giới hạn MVP có chủ đích

Đã ghi trong [ISSUES.md](./ISSUES.md):

- Landing `/` → `/login`
- AI UI tắt — toast "đang phát triển"
- Forgot password — trang placeholder, không email
- Share list UI ✅ — nhưng member không thấy data owner
- Undo không phải server-side undo stack
- Middleware cookie-only guard

---

## Backlog nâng hoàn thiện nghiệp vụ

| Ưu tiên | Hạng mục | Lý do |
|---------|----------|-------|
| ~~P0–PH4~~ | Production hardening + BC-1..4 | ✅ Done (2026-06-13) |
| **P1** | Multi-tenant collaboration (PR-2) | Member mời vào list nhưng không thấy task |
| **P2** | Forgot password thật hoặc gỡ route | Tránh dead-end UX |
| **P3** | JWT validation trên middleware (PR-1) | Cookie có thể stale |
| **P4** | Server search, rename list, admin E2E edit/delete | Nice-to-have |
| ~~AI UI~~ | Bật khi sẵn sàng | **Hoãn** — xem ISSUES.md |

---

## Coverage test vs nghiệp vụ

| Tính năng | Unit | E2E | Ghi chú |
|-----------|------|-----|---------|
| Backend API | 173 pass | — | ~94% coverage |
| Frontend logic | 235 pass (2 skipped contract) | — | +`session-events`, `achievements-i18n` |
| Tasks, Board, Habits, Countdown, Settings | — | ✅ 6–8 spec | Happy path |
| Auth | — | 4 test | +logout redirect |
| Admin | — | 3 test | Thiếu edit/delete user |
| Lists | — | **0 spec** | Gián tiếp qua sidebar/board |
| Profile/Achievements | — | 9 test | — |
| AI | — | 2–3 test | Path "disabled" |

Test pass 100% **không đồng nghĩa** nghiệp vụ đủ — gap multi-tenant và forgot-password nằm ngoài E2E.

---

**Cập nhật file này** sau mỗi đợt rà soát nghiệp vụ hoặc ship tính năng lớn.
