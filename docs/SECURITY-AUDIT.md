# Taskflow MVP â€” Security & Reliability Audit

> Cáº­p nháº­t: **2026-06-14** (sau khi review code toÃ n diá»‡n backend + frontend).
> Pháº¡m vi: mÃ£ nguá»“n táº¡i `develop` @ `ae11256` (commit gáº§n nháº¥t thÃªm demo user seeding).
> ÄÃ¡nh dáº¥u `[x]` khi Ä‘Ã£ xá»­ lÃ½ xong.

**Validation tá»± Ä‘á»™ng (cháº¡y cÃ¹ng session nÃ y):**

| BÆ°á»›c | Káº¿t quáº£ |
|---|---|
| `tsc --noEmit` (backend + frontend) | PASS |
| `tsc` build (backend) | PASS |
| `next build` (frontend) | PASS â€” 22 static pages |
| `jest tests/unit` (backend) | 96/96 PASS |
| `vitest run` (frontend) | 235 PASS, 2 SKIP, 0 FAIL |
| `eslint` (frontend) | 0 lá»—i |

Má»i bug liá»‡t kÃª dÆ°á»›i Ä‘Ã¢y lÃ  **lá»—i logic / security / race** â€” khÃ´ng pháº£i lá»—i compile hay test thÆ°á»ng.

---

## TÃ³m táº¯t theo severity

| Severity | Sá»‘ lÆ°á»£ng | áº¢nh hÆ°á»Ÿng chÃ­nh |
|----------|----------|-----------------|
| CRITICAL | 4 | PhÃ¡ quyá»n user khi seed restart, boot race |
| HIGH | 4 | Race trÃªn DB write, key lÆ°u plaintext, brute-force login |
| MEDIUM | 5 | Validation bypass, info leak, perf, timezone |
| LOW | 4 | UX a11y, log silent, error swallowing |

---

## CRITICAL â€” Seed user cÃ³ thá»ƒ phÃ¡ há»ng quyá»n

### [x] **SA-C1** `seedDemoUser` Ã©p role USER, xÃ³a quyá»n admin náº¿u trÃ¹ng email

**File:** `backend/src/seedDemoUser.ts:20-24`

```typescript
if (user) {
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, name, role: 'USER' },  // ghi Ä‘Ã¨ role má»—i restart
  })
}
```

Náº¿u `DEMO_EMAIL` trÃ¹ng `ADMIN_EMAIL` trong env, má»—i láº§n restart sáº½ háº¡ admin xuá»‘ng `USER` + Ä‘á»•i `passwordHash`. Silent privilege downgrade.

**Fix:** náº¿u `user.role === 'ADMIN'` thÃ¬ return + cáº£nh bÃ¡o, khÃ´ng update.

---

### [x] **SA-C2** `seedAdminUser` re-hash password má»—i restart

**File:** `backend/src/seedAdmin.ts:18-27` (cÃ¹ng logic `seedDemoUser.ts:17`)

```typescript
const passwordHash = await hashPassword(password)  // bcrypt 12 rounds ~250ms
if (existing) {
  await prisma.user.update({ where: { id: existing.id }, data: { ...data } })
}
```

Admin Ä‘á»•i máº­t kháº©u qua UI â†’ restart sau â†’ hash cÅ© bá»‹ ghi Ä‘Ã¨ báº±ng `ADMIN_PASSWORD` env. Máº­t kháº©u admin tháº­t bá»‹ reset vá» giÃ¡ trá»‹ env.

**Fix:** chá»‰ update `passwordHash` khi `existing.role !== 'ADMIN'` (user má»›i promote), hoáº·c skip náº¿u `bcrypt.compare(password, existing.passwordHash)` Ä‘Ã£ match.

---

### [x] **SA-C3** `seedAdminUser` tá»± demote admin khÃ¡c má»—i restart

**File:** `backend/src/seedAdmin.ts:48-51`

```typescript
const demoted = await adminRepository.demoteExtraAdmins(email)
if (demoted > 0) {
  console.log(`[seed] Demoted ${demoted} extra ADMIN account(s) to USER`)
}
```

Cháº¡y khÃ´ng Ä‘iá»u kiá»‡n. Náº¿u DB cÃ³ nhiá»u admin (operator thÃªm thá»§ cÃ´ng, test fixture) â†’ táº¥t cáº£ bá»‹ háº¡ role `USER` á»Ÿ má»—i láº§n deploy.

**Fix:** chá»‰ gá»i `demoteExtraAdmins` á»Ÿ nhÃ¡nh `else` (admin vá»«a táº¡o má»›i), hoáº·c bá» auto-demote hoÃ n toÃ n.

---

### [x] **SA-C4** `start()` race condition vá»›i DB cháº­m / import-time error

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

Try/catch nuá»‘t lá»—i seed, nhÆ°ng:
- DB cháº­m / pool cháº¿t â†’ block boot ~vÃ i chá»¥c giÃ¢y
- Lá»—i import-time (thiáº¿u module, syntax error) â†’ crash trÆ°á»›c khi vÃ o catch â†’ container restart loop vÄ©nh viá»…n

**Fix:** thÃªm `Promise.race([seedBootstrap(), timeout(15_000)])`; Ä‘áº£m báº£o `app.listen` váº«n cháº¡y dÃ¹ seed fail Ä‘á»ƒ cÃ³ thá»ƒ debug.

---

## HIGH â€” Logic nghiá»‡p vá»¥ & báº£o máº­t

### [x] **SA-H1** `taskService.createTask` race condition trÃªn `sortOrder`

**File:** `backend/src/services/taskService.ts:47-62`

`findMaxSortOrder` rá»“i `createTask({ sortOrder: max + 1 })` khÃ´ng náº±m trong transaction. Hai request POST `/api/tasks` song song cá»§a cÃ¹ng user láº¥y cÃ¹ng `max` â†’ trÃ¹ng `sortOrder` â†’ sort khÃ´ng á»•n Ä‘á»‹nh trÃªn board/list.

**Fix:** bá»c trong `prisma.$transaction` (read max + create) hoáº·c thÃªm unique compound index `(userId, sortOrder)`.

---

### [x] **SA-H2** `pomodoroService.getPomodoroState` khÃ´ng atomic

**File:** `backend/src/services/pomodoroService.ts:35-66`

Read `pomodoroStateJson` â†’ tÃ­nh elapsed â†’ ghi láº¡i. Mobile + web tick Ä‘á»“ng thá»i â†’ 1 trong 2 request bá»‹ máº¥t write, hoáº·c cáº£ hai ghi Ä‘Ã¨ nhau.

**Fix:** thÃªm `pomodoroStateVersion` (int) trong schema, dÃ¹ng `prisma.$transaction` vá»›i optimistic concurrency (`update where version = X`).

---

### [x] **SA-H3** `geminiApiKey` lÆ°u plaintext trong DB

**File:** `backend/src/services/settingsService.ts:32-35`, `backend/src/validators/settings.validator.ts:19`

User API key Gemini lÆ°u tháº³ng vÃ o `UserSettings.geminiApiKey` (Postgres). DB dump hoáº·c báº¥t ká»³ ai cÃ³ quyá»n SELECT Ä‘á»u Ä‘á»c Ä‘Æ°á»£c. Vi pháº¡m nguyÃªn táº¯c "secrets at rest".

**Fix:** mÃ£ hÃ³a AES-GCM vá»›i key tá»« env `USER_SECRET_ENC_KEY` (32 bytes). Chá»‰ decrypt khi cáº§n gá»i AI. Helper `lib/crypto.ts`:
- `encryptSecret(plain): string` â†’ `iv:tag:ciphertext` (base64)
- `decryptSecret(stored): string` â†’ verify tag, throw náº¿u tamper

---

### [x] **SA-H4** `authController.login` khÃ´ng rate-limit

**File:** `backend/src/controllers/authController.ts:27-35`

Chá»‰ AI endpoint cÃ³ rate-limit. Login/refresh khÃ´ng cÃ³ `express-rate-limit` â†’ brute-force password + email enumeration dá»… dÃ ng. `bcrypt.compare` cÅ©ng khÃ´ng cÃ³ delay.

**Fix:** thÃªm middleware `rateLimit({ windowMs: 15*60*1000, max: 10, keyGenerator: req => `${req.ip}:${req.body.email}` })` cho `/api/auth/login` vÃ  `/api/auth/refresh`.

---

## MEDIUM â€” Validation, logging, performance

### [x] **SA-M1** `listService.createList` skip validation á»Ÿ service layer

**File:** `backend/src/services/listService.ts:36,42-46`

Zod validator á»Ÿ controller cÃ³ regex `^#[0-9A-Fa-f]{6}$` cho `color`, nhÆ°ng service nháº­n `Record<string, unknown>` rá»“i lÆ°u tháº³ng. Bypass validator (gá»i service trá»±c tiáº¿p tá»« test/script) â†’ lÆ°u `'red'`, `'rgb(...)'`, XSS payload.

**Fix:** tÃ¡i sá»­ dá»¥ng `list.validator.ts` trong service, hoáº·c thay `body: Record<string, unknown>` báº±ng type Ä‘Ã£ parse.

---

### [x] **SA-M2** `errorHandler` máº¥t `ZodError.issues.path`

**File:** `backend/src/middleware/errorHandler.ts:43-47`

Chá»‰ join `.message` báº±ng `'; '`. Frontend khÃ´ng biáº¿t field nÃ o sai. Validation phá»©c táº¡p (nested object) máº¥t dáº¥u váº¿t.

**Fix:** tráº£ vá» `{ error: 'validation_error', message, issues: error.errors }` (máº£ng `{ path, message }`) thay vÃ¬ join string.

---

### [x] **SA-M3** `pomodoroController.updateState` luÃ´n `getOrCreate` má»—i tick

**File:** `backend/src/services/pomodoroService.ts:100-104`

Endpoint Pomodoro tick má»—i giÃ¢y â†’ 2 query (find + cÃ³ thá»ƒ create) má»—i láº§n. LÃ£ng phÃ­ ~7200 query/giá»/user.

**Fix:** thay `getOrCreate` + `update` báº±ng `prisma.userSettings.upsert({ where: { userId }, create: {...}, update: {...} })`.

---

### [x] **SA-M4** `seed.ts` thiáº¿u transaction khi táº¡o default lists

**File:** `backend/src/seed.ts:10-22`

`findListsByUserId` rá»“i táº¡o 3 list láº§n lÆ°á»£t. 2 concurrent register cÃ¹ng user â†’ 2 bá»™ 3 list (race giá»¯a find vÃ  create).

**Fix:** bá»c trong `prisma.$transaction`, hoáº·c dÃ¹ng `createMany` vá»›i skip-duplicates.

---

### [x] **SA-M5** Timezone mismatch client/server (habit "today" lá»‡ch 0-1 ngÃ y)

**File:** `frontend/src/app/(app)/dashboard/page.tsx:59` dÃ¹ng `toISOString().split('T')[0]` (UTC) trong khi backend `getProfileSummary` dÃ¹ng `Asia/Ho_Chi_Minh` qua `todayDateString()`.

User á»Ÿ Viá»‡t Nam tick habit lÃºc 1h sÃ¡ng â†’ backend Ä‘Ã£ sang ngÃ y má»›i nhÆ°ng client váº«n tÃ­nh ngÃ y hÃ´m qua. `habitsToday` hiá»ƒn thá»‹ sai.

**Fix:** viáº¿t láº¡i `toYYYYMMDD` client dÃ¹ng local date (giá»‘ng `dateOnlyFromDate` backend), hoáº·c gá»i API láº¥y `serverToday` rá»“i dÃ¹ng.

---

## LOW â€” UX, a11y, log

### [x] **SA-L1** `parseJsonArray` / `parseJsonObject` im láº·ng khi JSON há»ng

**File:** `backend/src/lib/json.ts:1-22`

`try { JSON.parse } catch { return fallback }`. Dá»¯ liá»‡u DB há»ng (legacy) â†’ user máº¥t data mÃ  khÃ´ng cÃ³ dáº¥u váº¿t.

**Fix:** trong dev/test, `console.warn` khi parse fail; trong prod giá»¯ fallback. DÃ¹ng env `LOG_PARSE_ERRORS=true`.

---

### [x] **SA-L2** A11y: overlay sidebar thiáº¿u keyboard handler

**File:** `frontend/src/components/layout/sidebar.tsx:148-151`

Overlay div chá»‰ cÃ³ `onClick`, khÃ´ng `aria-hidden`, khÃ´ng `role="button"`, khÃ´ng `onKeyDown`. User keyboard-only khÃ´ng Ä‘Ã³ng sidebar Ä‘Æ°á»£c.

**Fix:** thÃªm `role="button"`, `aria-label="Close menu"`, `tabIndex={0}`, `onKeyDown={e => e.key === 'Enter' && close()}`.

---

### [x] **SA-L3** `fetchTasks().catch(() => null)` nuá»‘t lá»—i

**File:** `frontend/src/lib/api/tasks.ts:25`

500/404 tá»« backend â†’ tráº£ `[]` yÃªn láº·ng. User tháº¥y task list rá»—ng, khÃ´ng biáº¿t lÃ  backend lá»—i.

**Fix:** log error qua `console.error` hoáº·c `useToast`, hoáº·c re-throw cho caller xá»­ lÃ½.

---

### [x] **SA-L4** `aiService.buildBriefingContext` load háº¿t tasks

**File:** `backend/src/services/aiService.ts:30-34`

3 query lá»›n song song, khÃ´ng pagination. User cÃ³ 10k tasks â†’ OOM, latency cao.

**Fix:** aggregate trong DB (`groupBy`, `count`), chá»‰ láº¥y top 20 tasks due today + top 5 habits.

---

## ÄÃ£ xÃ¡c minh â€” KHÃ”NG pháº£i bug

| Nghi váº¥n | Thá»±c táº¿ |
|---|---|
| `auth.ts:4` gá»i `/api/auth/[...nextauth]` khÃ´ng tá»“n táº¡i | CÃ³ `frontend/src/pages/api/auth/[...nextauth].ts` (Pages Router) proxy sang backend. Hoáº¡t Ä‘á»™ng Ä‘Ãºng. |
| `frontend/src/app/(app)/...` thiáº¿u `'use client'` | Táº¥t cáº£ page dÃ¹ng hooks Ä‘á»u cÃ³ `'use client'`. |
| `demoUserContent.ts` bá»‹ mojibake | File UTF-8 chuáº©n vá»›i tiáº¿ng Viá»‡t Ä‘Ãºng. PowerShell console render sai (Ä‘Ã£ verify báº±ng `[Encoding]::UTF8.GetString`). |
| ESLint, TS, test fail | Táº¥t cáº£ PASS trong session audit nÃ y. |
| CORS wildcard | `cors({ origin: config.corsOrigin })` tá»« env, khÃ´ng wildcard. |
| Password hashing rounds | bcrypt 12, Ä‘á»§ máº¡nh. |
| JWT verify | CÃ³ try/catch + check `userId` + validate issuer/audience/algorithm. |
| Prisma cascade | Má»i relation tá»« `User` Ä‘á»u `onDelete: Cascade`. |

---

## Äá» xuáº¥t thá»© tá»± sá»­a

1. **CRITICAL (SA-C1..C4)** â€” áº£nh hÆ°á»Ÿng trá»±c tiáº¿p Ä‘áº¿n má»—i láº§n deploy/restart. Sá»­a trÆ°á»›c.
2. **SA-H3 (geminiApiKey)** â€” mÃ£ hÃ³a secret at rest. TÃ¡ch khá»i feature AI hiá»‡n khÃ´ng báº­t.
3. **SA-H1, SA-H2 (transactions)** â€” chá»‰nh sá»­a nhá», ngÄƒn data corruption.
4. **SA-H4 (rate-limit)** â€” middleware Ä‘Æ¡n giáº£n, cháº·n brute-force.
5. **SA-M1..M5** â€” validation + perf + timezone.
6. **SA-L1..L4** â€” cleanup.

---

## Lá»‡nh reproduce

```bash
# Backend typecheck + test + build
cd backend && npx tsc --noEmit && npm run test:unit && npm run build

# Frontend typecheck + test + build
cd frontend && npx tsc --noEmit && npx vitest run && npx next build
```

Cáº­p nháº­t file nÃ y sau má»—i Ä‘á»£t sá»­a lá»›n.

---

