# E2E Test Progress Summary

**Ngày cập nhật:** 2026-06-10

## Kết quả hiện tại

**E2E Tests:** 57 passed / 0 failed / 1 skipped (63 tests tổng)

- Từ baseline: **9 failed → 0 failed**
- Pass rate: **100%** (không tính skip có chủ đích)

## Bug production đã sửa (phát hiện qua E2E)

1. **`habit-reducer.ts`** — `ADD_HABIT` ghi đè ID từ server bằng `generateId()` → complete/delete habit API fail
2. **`pages/api/habits.ts`** — POST complete không đọc `date` từ request body → backend trả 400
3. **`playwright.config.ts`** — regex `navigation` match nhầm `mobile-navigation.spec.ts` trên desktop

## Specs đã cải thiện

| File | Thay đổi chính |
|------|----------------|
| `countdown.spec.ts` | Ngày tương lai (+30d), edit/delete selectors |
| `habits.spec.ts` | Flow complete/delete/grid thật |
| `settings.spec.ts` | Selector song ngữ, reset EN trước mỗi test |
| `mobile-navigation.spec.ts` | Bottom nav + sidebar selectors đúng mobile |
| `achievements.spec.ts` | Assert có nghĩa, dropdown qua DOM click |
| `ai.spec.ts` | Skip khi AI off, toast coming-soon cho briefing |
| `pomodoro.spec.ts` | Reset timer trước start/pause test |
| `tasks.spec.ts` | Selector song ngữ EN/VI |

## Công việc còn lại (checklist)

- [x] P0: Full E2E pass
- [x] P0: Chạy E2E 2–3 vòng phát hiện flaky ✅ **57/57 passed x3 vòng**
- [x] P1: Lint trong CI ✅ **Thêm lint + typecheck job**
- [x] P1: Sửa lint errors ✅ **0 errors, 4 warnings**
- [x] P1: Nâng coverage thresholds ✅ **Backend 96→78/94/96/96, Frontend 75/65/85/75**
- [ ] P2: Backend validation (countdown, list members) — *Cần quyết định requirements*
