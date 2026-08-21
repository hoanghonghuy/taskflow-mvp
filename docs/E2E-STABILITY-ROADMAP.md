# TaskFlow E2E Stability & Product Hardening Roadmap

Status: preparation / architecture decisions  
Base: `main` @ `b57ff5147c6b1b9c3fe2332883795689f571aefb`  
Integration branch: `e2e-stability-foundation`

## Objective

Make TaskFlow reliable across the full user flow: UI action -> API -> backend validation -> database -> reload/session recovery. The hardening phase prioritizes correctness, persistence, data integrity, accessibility, and regression coverage before adding more surface area.

## Core engineering principles

1. **Backend/DB is the source of truth for server data.** Client state must not pretend a mutation succeeded when persistence failed.
2. **Server state and UI state are different concerns.** Migrate server collections incrementally to TanStack Query; keep filters, modal state, selection and drag state local.
3. **No fake features.** Hide controls that look functional but do not have a complete domain/backend implementation.
4. **Relations belong in the data model.** Prefer real ownership/relation constraints over arbitrary string IDs and JSON-serialized entities.
5. **Calendar dates are not UTC timestamps.** Persist instants in UTC and compute date-only business values in the user's IANA timezone.
6. **Atomic multi-record writes.** Delete/move/reorder operations that must succeed together use database transactions or relational nested writes.
7. **Accessible interaction first.** Drag/drop must have keyboard/touch equivalents; motion must respect reduced-motion preferences.
8. **Regression tests follow real user flows.** Browser E2E uses an isolated real PostgreSQL database and production-like frontend/backend servers.

## Product decisions

### Keep and harden

- Tasks and Lists
- Board/Kanban, including custom columns
- Calendar
- Habits
- Countdown
- Pomodoro
- Tags
- Subtasks
- Comments
- Profile / productivity summaries / heatmap where backed by persisted data
- Eisenhower Matrix after correcting its two-dimensional model

### Hide/remove for now

- Global UI-only Undo/Redo. It can return only after inverse operations also mutate the backend safely.
- Collaboration/share/assignee controls until membership, invitation and permission models exist.
- Product/README claims for features that are disabled or incomplete.
- AI expansion during this hardening cycle; stabilize the core product first.

## Architecture decisions

### Frontend server state

Adopt `@tanstack/react-query` incrementally. Queries own remote collections and mutation lifecycle. Existing providers are reduced toward UI/runtime state instead of being a second database.

Mutation rules:

- API functions throw on non-2xx.
- Mutation functions return server DTOs or throw; they do not swallow errors.
- Forms close only after success.
- Optimistic updates are used only when rollback/refetch behavior is explicit.
- Success/error toast ownership is centralized per mutation flow.

### REST/BFF

Keep Express REST APIs and the Next.js same-origin BFF/proxy. Do not introduce GraphQL/tRPC during stabilization. Consolidate proxy boilerplate, normalize response/error semantics, validate ownership, and scope reorder/move endpoints to the relevant resource.

### Database

Design the Board/data-integrity and task-normalization schema together before generating migrations.

Target concepts:

- `TodoTask` has real list ownership and `completedAt`/`updatedAt`.
- `BoardColumn` persists custom columns and ordering.
- Task -> column is validated against the same list/user.
- `Tag` and task-tag association are server-backed.
- `Subtask` and `Comment` get stable IDs and task relations.
- Recurrence/settings snapshots that remain document-shaped use Prisma `Json`, not JSON serialized into `String`.
- Pomodoro completion has a client idempotency key.
- User settings store an IANA timezone.

### Date/time

- Instant: ISO-8601 UTC / PostgreSQL timestamp.
- Date-only domain value: `YYYY-MM-DD` interpreted in the user's configured IANA timezone.
- Do not use `toISOString().slice(0, 10)` as a local-day helper.
- Use date-fns v4 timezone support (`@date-fns/tz`) for explicit zone calculations.

### Drag/drop and motion

Use dnd-kit for Board/Matrix sortable interactions so mouse, touch and keyboard paths share one interaction model. Prefer existing CSS/Tailwind animation utilities for subtle transitions. Add a dedicated motion library only if a concrete interaction cannot be implemented cleanly without it.

## Work items and dependencies

| Issue | Workstream | Dependency notes |
|---|---|---|
| #14 | Playwright E2E + CI | Start first as a safety-net skeleton; expand throughout all phases |
| #8 | Mutation UX + remove fake Undo/Redo | Early correctness win; informs query migration contract |
| #16 | REST/BFF contract cleanup | Before broad server-state migration |
| #6 | Backend source-of-truth / TanStack Query | Incremental; do not big-bang rewrite |
| #7 | Board persistence + list/column integrity | Design schema together with #12 |
| #12 | Task data normalization + completedAt | Design schema together with #7 |
| #11 | Auth identity + per-user settings | Needed before reliable timezone/settings behavior |
| #9 | Timezone/date contract | Uses persisted timezone from #11 |
| #10 | Global/idempotent Pomodoro | Uses state/query/date foundations |
| #13 | Product scope + real Matrix semantics | Do after core task schema is stable |
| #15 | Accessibility/responsive/motion polish | Final interaction polish after behavior is reliable |

Tracking issue: #17.

## Execution plan

### Phase 0 — Safety net and immediate correctness

1. Create the Playwright/CI skeleton from #14.
2. Add baseline smoke tests for auth and task CRUD.
3. Fix #8 false-success flows.
4. Remove/disable global Undo/Redo UI until a persistent implementation is designed.

Suggested implementation branch: `fix/mutation-contract-e2e-baseline`.

### Phase 1 — API and server-state foundation

1. Refactor repeated Next BFF proxy behavior (#16) without changing user-visible behavior.
2. Add QueryClient provider/query-key conventions (#6).
3. Migrate one domain at a time; tasks/lists first, then countdown/habits.
4. Add regression tests as each domain moves.

Suggested branches:

- `refactor/api-contract-bff`
- `refactor/server-state-query`

### Phase 2 — Data-model foundation

Before migration, finalize one combined schema design for #7 and #12. Avoid creating two migrations that repeatedly rewrite the same task/list relations.

Implementation order:

1. Relations/ownership and default-list policy.
2. BoardColumn model and migration/backfill.
3. `completedAt` and task audit fields.
4. Tags/subtasks/comments normalization and legacy migration.
5. Scoped reorder/move APIs and transactions.
6. Board UI migration to persisted columns.

Suggested branch: `refactor/task-board-data-model`.

### Phase 3 — Cross-cutting correctness

1. Server-backed session identity and logout revocation (#11).
2. User-scoped settings/cache and timezone persistence (#11).
3. Local-day contract across habits/profile/heatmap/dashboard (#9).
4. Global/idempotent Pomodoro runtime (#10).

Suggested branches:

- `fix/auth-settings-isolation`
- `fix/timezone-date-contract`
- `fix/pomodoro-global-persistence`

### Phase 4 — Product semantics and UI/UX

1. Hide incomplete collaboration affordances (#13).
2. Add true urgent/important Matrix fields and persistence (#13).
3. Migrate Board/Matrix interactions to accessible dnd-kit (#15).
4. Apply loading/empty/error/pending patterns consistently.
5. Add subtle responsive motion and reduced-motion handling.

Suggested branches:

- `fix/product-scope-matrix`
- `feat/accessible-dnd-ui-polish`

### Phase 5 — Regression closure

Expand #14 until every repaired critical flow has a browser regression spec. Run frontend and backend unit/integration suites plus Playwright E2E. Update README and feature documentation to describe only behavior that actually ships.

## Definition of done for the hardening cycle

- Reload never silently reverses a successful-looking user action.
- Network/API failure never produces a success toast or discards recoverable form input.
- Board columns/tasks persist correctly and have no duplicate IDs.
- Account data/settings do not leak across login switches.
- Habit/profile/heatmap/Pomodoro use the same user-local day boundary.
- Pomodoro completion persists even when the user navigates away from its page.
- Tags/subtasks/comments and completion history survive reload with stable backend identity.
- Matrix represents Urgent and Important independently.
- Critical drag/drop workflows work with keyboard and touch.
- Pull requests run automated browser E2E against isolated PostgreSQL and produce traces/reports on failure.

## Reference research

- TanStack Query optimistic update/rollback guidance: https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
- Next.js Playwright testing guide: https://nextjs.org/docs/app/guides/testing/playwright
- Playwright web server/CI documentation: https://playwright.dev/docs/test-webserver and https://playwright.dev/docs/ci
- Prisma transaction guidance: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
- date-fns v4 timezone documentation: https://github.com/date-fns/date-fns/blob/main/pkgs/core/docs/timeZones.md
- dnd-kit accessibility/keyboard documentation: https://docs.dndkit.com/guides/accessibility
