# Taskflow MVP — Security & Reliability Audit

> Cập nhật: **2026-06-14** (sau khi review code toàn diện backend + frontend).
> Phạm vi: mã nguồn tại `develop` @ `ae11256` (commit gần nhất thêm demo user seeding).
> Đánh dấu `[x]` khi đã xử lý xong.

**Validation tự động (chạy cùng session này):**

| Bước | Kết quả |
|---|---|
| `tsc --noEmit` (backend + frontend) | PASS |
| `tsc` build (backend) | PASS |
| `next build` (frontend) | PASS — 22 static pages |
| `jest tests/unit` (backend) | 96/96 PASS |
| `vitest run` (frontend) | 235 PASS, 2 SKIP, 0 FAIL |
| `eslint` (frontend) | 0 lỗi |

Mọi bug liệt kê dưới đây là **lỗi logic / security / race** — không phải lỗi compile hay test thường.

---

## Tóm tắt theo severity

| Severity | Số lượng | Ảnh hưởng chính |
|----------|----------|-----------------|
| CRITICAL | 4 | Phá quyền user khi seed restart, boot race |
| HIGH | 4 | Race trên DB write, key lưu plaintext, brute-force login |
| MEDIUM | 5 | Validation bypass, info leak, perf, timezone |
| LOW | 4 | UX a11y, log silent, error swallowing |

---

## CRITICAL — Seed user có thể phá hỏng quyền

### [ ] **SA-C1** `seedDemoUser` ép role USER, xóa quyền admin nếu trùng email

**File:** `backend/src/seedDemoUser.ts:20-24`

```typescript
if (user) {
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, name, role: 'USER' },  // ghi đè role mỗi restart
  })
}
```

Nếu `DEMO_EMAIL` trùng `ADMIN_EMAIL` trong env, mỗi lần restart sẽ hạ admin xuống `USER` + đổi `passwordHash`. Silent privilege downgrade.

**Fix:** nếu `user.role === 'ADMIN'` thì return + cảnh báo, không update.

---

### [ ] **SA-C2** `seedAdminUser` re-hash password mỗi restart

**File:** `backend/src/seedAdmin.ts:18-27` (cùng logic `seedDemoUser.ts:17`)

```typescript
const passwordHash = await hashPassword(password)  // bcrypt 12 rounds ~250ms
if (existing) {
  await prisma.user.update({ where: { id: existing.id }, data: { ...data } })
}
```

Admin đổi mật khẩu qua UI → restart sau → hash cũ bị ghi đè bằng `ADMIN_PASSWORD` env. Mật khẩu admin thật bị reset về giá trị env.

**Fix:** chỉ update `passwordHash` khi `existing.role !== 'ADMIN'` (user mới promote), hoặc skip nếu `bcrypt.compare(password, existing.passwordHash)` đã match.

---

### [ ] **SA-C3** `seedAdminUser` tự demote admin khác mỗi restart

**File:** `backend/src/seedAdmin.ts:48-51`

```typescript
const demoted = await adminRepository.demoteExtraAdmins(email)
if (demoted > 0) {
  console.log(`[seed] Demoted ${demoted} extra ADMIN account(s) to USER`)
}
```

Chạy không điều kiện. Nếu DB có nhiều admin (operator thêm thủ công, test fixture) → tất cả bị hạ role `USER` ở mỗi lần deploy.

**Fix:** chỉ gọi `demoteExtraAdmins` ở nhánh `else` (admin vừa tạo mới), hoặc bỏ auto-demote hoàn toàn.

---

### [ ] **SA-C4** `start()` race condition với DB chậm / import-time error

**File:** `backend/src/server.ts:8-19`

```typescript
async function start(): Promise<void> {
  try {
    await seedAdminUser()
    await seedDemoUser()
  } catch (error) {
    console.error('[seed] Failed to seed bootstrap users', error)
  }
  app.listen(...)
}
```

Try/catch nuốt lỗi seed, nhưng:
- DB chậm / pool chết → block boot ~vài chục giây
- Lỗi import-time (thiếu module, syntax error) → crash trước khi vào catch → container restart loop vĩnh viễn

**Fix:** thêm `Promise.race([seedBootstrap(), timeout(15_000)])`; đảm bảo `app.listen` vẫn chạy dù seed fail để có thể debug.

---

## HIGH — Logic nghiệp vụ & bảo mật

### [ ] **SA-H1** `taskService.createTask` race condition trên `sortOrder`

**File:** `backend/src/services/taskService.ts:47-62`

`findMaxSortOrder` rồi `createTask({ sortOrder: max + 1 })` không nằm trong transaction. Hai request POST `/api/tasks` song song của cùng user lấy cùng `max` → trùng `sortOrder` → sort không ổn định trên board/list.

**Fix:** bọc trong `prisma.$transaction` (read max + create) hoặc thêm unique compound index `(userId, sortOrder)`.

---

### [ ] **SA-H2** `pomodoroService.getPomodoroState` không atomic

**File:** `backend/src/services/pomodoroService.ts:35-66`

Read `pomodoroStateJson` → tính elapsed → ghi lại. Mobile + web tick đồng thời → 1 trong 2 request bị mất write, hoặc cả hai ghi đè nhau.

**Fix:** thêm `pomodoroStateVersion` (int) trong schema, dùng `prisma.$transaction` với optimistic concurrency (`update where version = X`).

---

### [ ] **SA-H3** `geminiApiKey` lưu plaintext trong DB

**File:** `backend/src/services/settingsService.ts:32-35`, `backend/src/validators/settings.validator.ts:19`

User API key Gemini lưu thẳng vào `UserSettings.geminiApiKey` (Postgres). DB dump hoặc bất kỳ ai có quyền SELECT đều đọc được. Vi phạm nguyên tắc "secrets at rest".

**Fix:** mã hóa AES-GCM với key từ env `USER_SECRET_ENC_KEY` (32 bytes). Chỉ decrypt khi cần gọi AI. Helper `lib/crypto.ts`:
- `encryptSecret(plain): string` → `iv:tag:ciphertext` (base64)
- `decryptSecret(stored): string` → verify tag, throw nếu tamper

---

### [ ] **SA-H4** `authController.login` không rate-limit

**File:** `backend/src/controllers/authController.ts:27-35`

Chỉ AI endpoint có rate-limit. Login/refresh không có `express-rate-limit` → brute-force password + email enumeration dễ dàng. `bcrypt.compare` cũng không có delay.

**Fix:** thêm middleware `rateLimit({ windowMs: 15*60*1000, max: 10, keyGenerator: req => `${req.ip}:${req.body.email}` })` cho `/api/auth/login` và `/api/auth/refresh`.

---

## MEDIUM — Validation, logging, performance

### [ ] **SA-M1** `listService.createList` skip validation ở service layer

**File:** `backend/src/services/listService.ts:36,42-46`

Zod validator ở controller có regex `^#[0-9A-Fa-f]{6}$` cho `color`, nhưng service nhận `Record<string, unknown>` rồi lưu thẳng. Bypass validator (gọi service trực tiếp từ test/script) → lưu `'red'`, `'rgb(...)'`, XSS payload.

**Fix:** tái sử dụng `list.validator.ts` trong service, hoặc thay `body: Record<string, unknown>` bằng type đã parse.

---

### [ ] **SA-M2** `errorHandler` mất `ZodError.issues.path`

**File:** `backend/src/middleware/errorHandler.ts:43-47`

Chỉ join `.message` bằng `'; '`. Frontend không biết field nào sai. Validation phức tạp (nested object) mất dấu vết.

**Fix:** trả về `{ error: 'validation_error', message, issues: error.errors }` (mảng `{ path, message }`) thay vì join string.

---

### [ ] **SA-M3** `pomodoroController.updateState` luôn `getOrCreate` mỗi tick

**File:** `backend/src/services/pomodoroService.ts:100-104`

Endpoint Pomodoro tick mỗi giây → 2 query (find + có thể create) mỗi lần. Lãng phí ~7200 query/giờ/user.

**Fix:** thay `getOrCreate` + `update` bằng `prisma.userSettings.upsert({ where: { userId }, create: {...}, update: {...} })`.

---

### [ ] **SA-M4** `seed.ts` thiếu transaction khi tạo default lists

**File:** `backend/src/seed.ts:10-22`

`findListsByUserId` rồi tạo 3 list lần lượt. 2 concurrent register cùng user → 2 bộ 3 list (race giữa find và create).

**Fix:** bọc trong `prisma.$transaction`, hoặc dùng `createMany` với skip-duplicates.

---

### [ ] **SA-M5** Timezone mismatch client/server (habit "today" lệch 0-1 ngày)

**File:** `frontend/src/app/(app)/dashboard/page.tsx:59` dùng `toISOString().split('T')[0]` (UTC) trong khi backend `getProfileSummary` dùng `Asia/Ho_Chi_Minh` qua `todayDateString()`.

User ở Việt Nam tick habit lúc 1h sáng → backend đã sang ngày mới nhưng client vẫn tính ngày hôm qua. `habitsToday` hiển thị sai.

**Fix:** viết lại `toYYYYMMDD` client dùng local date (giống `dateOnlyFromDate` backend), hoặc gọi API lấy `serverToday` rồi dùng.

---

## LOW — UX, a11y, log

### [ ] **SA-L1** `parseJsonArray` / `parseJsonObject` im lặng khi JSON hỏng

**File:** `backend/src/lib/json.ts:1-22`

`try { JSON.parse } catch { return fallback }`. Dữ liệu DB hỏng (legacy) → user mất data mà không có dấu vết.

**Fix:** trong dev/test, `console.warn` khi parse fail; trong prod giữ fallback. Dùng env `LOG_PARSE_ERRORS=true`.

---

### [ ] **SA-L2** A11y: overlay sidebar thiếu keyboard handler

**File:** `frontend/src/components/layout/sidebar.tsx:148-151`

Overlay div chỉ có `onClick`, không `aria-hidden`, không `role="button"`, không `onKeyDown`. User keyboard-only không đóng sidebar được.

**Fix:** thêm `role="button"`, `aria-label="Close menu"`, `tabIndex={0}`, `onKeyDown={e => e.key === 'Enter' && close()}`.

---

### [ ] **SA-L3** `fetchTasks().catch(() => null)` nuốt lỗi

**File:** `frontend/src/lib/api/tasks.ts:25`

500/404 từ backend → trả `[]` yên lặng. User thấy task list rỗng, không biết là backend lỗi.

**Fix:** log error qua `console.error` hoặc `useToast`, hoặc re-throw cho caller xử lý.

---

### [ ] **SA-L4** `aiService.buildBriefingContext` load hết tasks

**File:** `backend/src/services/aiService.ts:30-34`

3 query lớn song song, không pagination. User có 10k tasks → OOM, latency cao.

**Fix:** aggregate trong DB (`groupBy`, `count`), chỉ lấy top 20 tasks due today + top 5 habits.

---

## Đã xác minh — KHÔNG phải bug

| Nghi vấn | Thực tế |
|---|---|
| `auth.ts:4` gọi `/api/auth/[...nextauth]` không tồn tại | Có `frontend/src/pages/api/auth/[...nextauth].ts` (Pages Router) proxy sang backend. Hoạt động đúng. |
| `frontend/src/app/(app)/...` thiếu `'use client'` | Tất cả page dùng hooks đều có `'use client'`. |
| `demoUserContent.ts` bị mojibake | File UTF-8 chuẩn với tiếng Việt đúng. PowerShell console render sai (đã verify bằng `[Encoding]::UTF8.GetString`). |
| ESLint, TS, test fail | Tất cả PASS trong session audit này. |
| CORS wildcard | `cors({ origin: config.corsOrigin })` từ env, không wildcard. |
| Password hashing rounds | bcrypt 12, đủ mạnh. |
| JWT verify | Có try/catch + check `userId` + validate issuer/audience/algorithm. |
| Prisma cascade | Mọi relation từ `User` đều `onDelete: Cascade`. |

---

## Đề xuất thứ tự sửa

1. **CRITICAL (SA-C1..C4)** — ảnh hưởng trực tiếp đến mỗi lần deploy/restart. Sửa trước.
2. **SA-H3 (geminiApiKey)** — mã hóa secret at rest. Tách khỏi feature AI hiện không bật.
3. **SA-H1, SA-H2 (transactions)** — chỉnh sửa nhỏ, ngăn data corruption.
4. **SA-H4 (rate-limit)** — middleware đơn giản, chặn brute-force.
5. **SA-M1..M5** — validation + perf + timezone.
6. **SA-L1..L4** — cleanup.

---

## Lệnh reproduce

```bash
# Backend typecheck + test + build
cd backend && npx tsc --noEmit && npm run test:unit && npm run build

# Frontend typecheck + test + build
cd frontend && npx tsc --noEmit && npx vitest run && npx next build
```

Cập nhật file này sau mỗi đợt sửa lớn.
