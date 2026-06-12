# Taskflow MVP — Độ hoàn thiện tính năng so với nghiệp vụ

> Cập nhật: **2026-06-12**  
> Đối chiếu README, luồng UI, API backend, E2E Playwright.  
> Mức % là **ước lượng** theo tiêu chí: *user story cốt lõi hoàn thành được end-to-end với backend thật*.

Liên quan: [ISSUES.md](./ISSUES.md) (backlog kỹ thuật), [README.md](../README.md) (phạm vi MVP).

---

## Tổng quan

| Nhóm | Mức hoàn thiện | Đánh giá ngắn |
|------|----------------|---------------|
| **Tasks (cốt lõi)** | ~78% | CRUD + 4 view + persist DB ổn; thiếu vài field nghiệp vụ và 1 bug UX |
| **Habits / Countdown / Pomodoro** | ~80% | Gần đủ MVP cá nhân |
| **Auth / Admin** | ~73% | Đăng nhập/đăng ký/admin ổn; forgot password chưa có |
| **Profile / Achievements** | ~65% | Xem stats OK; sửa profile thiếu; achievement lệch client/server |
| **Settings / i18n / Mobile** | ~76% | Theme, ngôn ngữ, bottom nav ổn; AI key UI chưa có |
| **Lists / Collaboration** | ~55% | CRUD cơ bản OK; share list bị chặn UI |
| **AI** | ~15% UI / ~55% BE | Backend sẵn; UI tắt cờ `AI_FEATURES_ENABLED` |

**Kết luận:** MVP **đủ dùng cho 1 người** quản lý task/habit/pomodoro hàng ngày. Chưa đủ nếu kỳ vọng **cộng tác (share list)**, **AI trên UI**, hoặc **task nâng cao** (lặp lại, ma trận Eisenhower thật).

---

## 1. Tasks

README hứa: *list, board, matrix, calendar; kéo-thả persist DB*.

| User story | Kỳ vọng nghiệp vụ | Thực tế | Gap |
|------------|-------------------|---------|-----|
| Tạo/sửa/xóa task | Title, mô tả, hạn, ưu tiên, list | ✅ End-to-end qua API | Form tạo **không có** tags, subtasks, reminder, assignee — phải mở TaskDetail sau |
| Today / Upcoming / Inbox | Lọc task theo ngày & inbox | ✅ Filter client, Inbox map UUID thật | Không phải entity DB riêng (chấp nhận được MVP) |
| List view + reorder | Sắp xếp thứ tự task | ✅ Drag → `POST /api/tasks/reorder` | Reorder **toàn bộ** task; kéo trong list lọc vẫn đổi thứ tự global |
| Board Kanban | Cột + kéo task giữa cột | ✅ Persist `boardColumnsJson` + E2E reload | Inbox **không** có trên board |
| Calendar | Xem task theo ngày | ✅ Kéo đổi `dueDate` | ✅ Expand recurring instances (preview lần lặp tương lai); không tạo task từ calendar |
| Matrix (Eisenhower) | Phân loại urgent/important | ⚠️ Chỉ map theo **priority**, read-only | Không phải ma trận Eisenhower; không kéo đổi ô |
| Subtasks | Checklist trong task | ✅ TaskDetail + sync API | AI generate subtask tắt (AI off) |
| Tags | Gắn/lọc tag | ✅ TaskDetail + sidebar filter | Form tạo không có tag; "Add tag" sidebar chỉ local registry |
| Comments | Thảo luận trên task | ❌ **Bug** | Form comment chỉ hiện khi `comments.length > 0` → **không thêm được comment đầu tiên** |
| Assignee | Giao việc | ⚠️ TaskDetail có dropdown | Chỉ có user trong `collaborators` (members list); dùng 1 mình thì gần như vô dụng |
| Recurrence | Task lặp lại | ✅ | UI TaskDetail: daily/weekly/monthly, interval tùy chỉnh, chọn ngày trong tuần; complete → advance `dueDate`; calendar expand preview |
| Reminder | Nhắc trước hạn | ⚠️ | Lưu `reminderMinutes` + `Notification` trình duyệt (tab mở); không push/email |
| Search | Tìm task nhanh | ⚠️ | Client-side title/description/tags; không server search |
| Undo/Redo | Hoàn tác thao tác | ⚠️ | Revert UI rồi sync server — không phải undo server-side |
| Focus time trên task | Thời gian pomodoro gắn task | ❌ | `totalFocusTime` mapper luôn `undefined`; heatmap phụ thuộc `completedAt` local (mất sau reload) |

**Mức hoàn thiện: ~87%**

File tham chiếu: `TaskForm.tsx`, `TaskDetail.tsx`, `task-manager-provider.tsx`, `task-helpers.ts`, `board.spec.ts`.

---

## 2. Habits — ~85%

| User story | Thực tế | Gap |
|------------|---------|-----|
| Tạo/xóa habit | ✅ | — |
| Đánh dấu hoàn thành theo ngày | ✅ Timezone VN | — |
| Lưới 30 ngày | ✅ E2E cover | — |
| Streak / nhắc nhở | ⚠️ | Streak chỉ qua achievement; không notification |

---

## 3. Countdown — ~80%

| User story | Thực tế | Gap |
|------------|---------|-----|
| CRUD sự kiện đếm ngược | ✅ Persist DB | — |
| Sửa title/ngày/màu | ✅ | E2E chưa assert persist sau reload |
| Thông báo khi đến hạn | ❌ | Chỉ hiển thị countdown |

---

## 4. Pomodoro — ~75%

| User story | Thực tế | Gap |
|------------|---------|-----|
| Start/pause/stop timer | ✅ | — |
| Gắn task focus | ✅ Navigate + local state | Không cộng dồn focus vào task API |
| Lưu session | ✅ `PomodoroSession` | — |
| State sau reload tab | ✅ Server tính lại `remainingSeconds` | `MOCK_MODE` thì không persist |
| Cấu hình duration | ✅ Settings | `autoStartPomodoro` có schema, **không UI** |

---

## 5. Auth — ~72%

| User story | Thực tế | Gap |
|------------|---------|-----|
| Đăng ký / đăng nhập | ✅ JWT + refresh | — |
| Session ổn định | ✅ `/api/auth/me` rebuild user | — |
| Đăng xuất | ✅ Revoke refresh tokens | E2E **chưa test** logout |
| Đổi tên | ✅ API `PATCH /me` | **Không UI** (profile read-only) |
| Quên mật khẩu | ❌ | Trang có, toast "chưa hỗ trợ" |
| OAuth / verify email | ❌ | Ngoài scope MVP |

---

## 6. Profile & Achievements — ~68%

| User story | Thực tế | Gap |
|------------|---------|-----|
| Xem thống kê | ✅ API + dashboard | Timezone VN đã fix (`profileService`) |
| Achievements badge | ⚠️ | Backend unlock 5 id; frontend có thêm **`week-streak`** — **backend không tính** → badge lệch |
| Sửa profile | ❌ UI | API có, trang profile chỉ xem |

Backend achievements: `first-task`, `complete-10`, `complete-50`, `habit-7-day-streak`, `focus-1h` (`profileService.ts`).  
Frontend thêm: `week-streak` (`constants.tsx`).

---

## 7. Settings — ~78%

| User story | Thực tế | Gap |
|------------|---------|-----|
| Theme | ✅ | — |
| Ngôn ngữ en/vi | ✅ Cookie + DB | Một số chuỗi profile còn hardcode EN |
| Notification test | ✅ Browser API | — |
| Bottom nav mobile | ✅ Persist 4 shortcut | — |
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

## 9. Lists & Collaboration — ~72%

| User story | Thực tế | Gap |
|------------|---------|-----|
| Tạo/xóa list (trừ Inbox) | ✅ Sidebar | Không rename/đổi màu từ UI |
| Share list / members | ✅ | Mời theo email (`lookup-user`); xóa member; Inbox không share |
| Assignee task | ⚠️ | Cần share list trước — assignee dropdown dùng `collaborators` |
| Member thấy list của owner | ❌ | Members chỉ lưu metadata; chưa multi-tenant list view |

---

## 10. AI — ~15% UI / ~55% BE *(cố ý chưa ship)*

**Quyết định (2026-06-12):** Tạm **không mở** AI trên UI. User thấy trạng thái "đang phát triển" — đúng kỳ vọng MVP hiện tại, không phải bug.

| Layer | Thực tế |
|-------|---------|
| Backend | Briefing, analyze task, subtasks, chat — Gemini/OpenAI (giữ cho dev/test) |
| UI | `AI_FEATURES_ENABLED = false` → toast "đang phát triển" / coming soon |
| Settings | Không nhập key; dùng env server |
| Roadmap | **Chưa lên lịch** bật UI — xem [ISSUES.md](./ISSUES.md) mục "AI — tạm không mở" |

---

## 11. i18n & Mobile — ~73%

| User story | Thực tế | Gap |
|------------|---------|-----|
| en / vi | ✅ Hầu hết màn hình | E2E i18n chỉ login/register |
| Bottom nav + sidebar mobile | ✅ 5 E2E test | — |

---

## Bug nghiệp vụ — đã sửa (2026-06-12)

| ID | Mô tả | Trạng thái |
|----|-------|------------|
| **BC-1** | Comment đầu tiên không thêm được | ✅ Form comment luôn hiển thị |
| **BC-2** | Achievement `week-streak` lệch client/server | ✅ Backend `getTaskCompletionStreak` |
| **BC-3** | `completedAt` chỉ local | ✅ Cột DB + set khi toggle complete |
| **BC-4** | Matrix gợi Eisenhower | ✅ Đổi label "Priority Matrix" (i18n) |

**Profile edit tên:** ✅ UI trên `/profile` (API đã có từ trước).

---

## Giới hạn MVP có chủ đích

Đã ghi trong [ISSUES.md](./ISSUES.md) mục P3:

- Landing `/` → `/login`
- AI UI tắt — cố ý, toast "đang phát triển" (không ưu tiên mở)
- Forgot password chưa hỗ trợ
- ~~Share list UI unavailable~~ → ✅ đã mở (mời theo email)
- Undo không phải server-side undo thật

---

## Backlog nâng hoàn thiện nghiệp vụ

| Ưu tiên | Hạng mục | Lý do |
|---------|----------|-------|
| ~~P0~~ | ~~BC-1: Comment đầu tiên~~ | ✅ Done |
| ~~P1~~ | ~~Profile edit tên~~ | ✅ Done |
| ~~P1~~ | ~~BC-2: week-streak~~ | ✅ Done |
| ~~P2~~ | ~~BC-3: completedAt persist~~ | ✅ Done |
| ~~P3~~ | ~~BC-4: Matrix label~~ | ✅ Done |
| ~~P2~~ | ~~Mở Share list UI~~ | ✅ Done |
| ~~**P3**~~ | ~~Recurrence UI+logic~~ | ✅ Done: UI + interval + weekdays + advance + calendar expand |
| **P4** | Forgot password hoặc gỡ link | Tránh dead-end UX |
| ~~AI UI~~ | ~~Bật khi key sẵn sàng~~ | **Hoãn** — giữ "đang phát triển" (xem ISSUES.md) |

---

## Coverage test vs nghiệp vụ

| Tính năng | E2E | Ghi chú |
|-----------|-----|---------|
| Tasks, Board, Habits, Countdown, Settings | ✅ 6–8 test/spec | Khá đủ happy path |
| Auth | 3 test | Thiếu logout, forgot |
| Admin | 3 test | Thiếu edit/delete user |
| Lists | **0 spec** | Chỉ gián tiếp qua sidebar/board |
| Profile/Achievements | 9 test | Assert yếu; không cover lệch achievement |
| AI | 2–3 test | Chủ yếu path "disabled" |

Test pass 100% **không đồng nghĩa** nghiệp vụ đủ — một số gap nằm ngoài E2E.

---

**Cập nhật file này** sau mỗi đợt rà soát nghiệp vụ hoặc ship tính năng lớn.
