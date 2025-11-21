# Taskflow Backend (Clean-ish)

Backend .NET cho Taskflow, áp dụng Clean-ish Architecture + EF Core (Sqlite) cho một số phần chính.

## Cấu trúc solution

- `src/Domain`
  - `Entities/TodoTask.cs`, `TodoList.cs`, `TodoColumn.cs`, `Habit.cs`, ...
- `src/Application`
  - `Common/Interfaces`: `ITodoTaskRepository`, `ITodoListRepository`, `ITodoColumnRepository`, `IHabitRepository`, ...
  - `Tasks/*`, `Lists/*`, `Columns/*`, `Habits/*`: DTO, request models, services.
- `src/Infrastructure`
  - `Persistence/AppDbContext.cs`: EF Core DbContext dùng Sqlite cho Tasks/Lists/Columns.
  - `Repositories/*`: 
    - EF repos: `EfTodoTaskRepository`, `EfTodoListRepository`, `EfTodoColumnRepository`.
    - In-memory repos: `InMemoryHabitRepository` (và một số repo demo khác).
- `src/WebApi`
  - `Program.cs`: đăng ký DI (DbContext + repositories + services), map minimal APIs cho `/api/*`.

## Yêu cầu

- .NET SDK 9 (TargetFramework `net9.0`).

## Cách chạy backend

```bash
cd backend
dotnet run --project src/WebApi/Taskflow.WebApi.csproj
```

Mặc định dùng connection string:

```json
"ConnectionStrings": {
  "Default": "Data Source=taskflow.db"
}
```

Khi chạy lần đầu, backend sẽ tự `EnsureCreated()` database và seed:

- 3 lists: `Inbox`, `Work`, `Personal`.
- 3 columns cho Inbox: `To Do`, `In Progress`, `Done`.

## API hiện có (tóm tắt)

### Tasks

- `GET /api/tasks`
- `GET /api/tasks/{id}`
- `POST /api/tasks`
- `PUT /api/tasks/{id}`
- `DELETE /api/tasks/{id}`

### Lists & Columns (Board)

- `GET /api/lists`
- `GET /api/lists/{id}`
- `POST /api/lists`
- `PUT /api/lists/{id}`
- `DELETE /api/lists/{id}`
- `GET /api/lists/{listId}/columns`
- `POST /api/lists/{listId}/columns`
- `GET /api/columns/{id}`
- `PUT /api/columns/{id}`
- `DELETE /api/columns/{id}`

### Habits

- `GET /api/habits`
- `GET /api/habits/{id}`
- `POST /api/habits`
- `PUT /api/habits/{id}`
- `DELETE /api/habits/{id}`
- `POST /api/habits/{id}/complete` (body: `{ "date": "yyyy-MM-dd" }` hoặc null = today)
- `DELETE /api/habits/{id}/complete?date=yyyy-MM-dd`

> Lưu ý: hiện Habits vẫn lưu bằng in-memory repository (mất dữ liệu khi restart).

## Kết nối với frontend

Frontend Next.js đã có các API route proxy:

- `taskflow-frontend/src/pages/api/tasks.ts` → proxy sang backend `/api/tasks`.
- `taskflow-frontend/src/pages/api/lists.ts` → proxy sang backend `/api/lists`.
- `taskflow-frontend/src/pages/api/habits.ts` → proxy sang backend `/api/habits`.

Biến môi trường dùng cho proxy:

- `BACKEND_URL` (ví dụ: `http://localhost:5000`), fallback mặc định nếu không set.

### Cách chạy cả frontend + backend

1. Chạy backend:

```bash
cd backend
dotnet run --project src/WebApi/Taskflow.WebApi.csproj
```

2. Chạy frontend (ví dụ dùng npm):

```bash
cd taskflow-frontend
set BACKEND_URL=http://localhost:5000  # Windows PowerShell/CMD, điều chỉnh port đúng
npm run dev
```

3. Frontend sẽ gọi các API route Next.js (`/api/tasks`, `/api/lists`, `/api/habits`), các route này sẽ forward sang backend .NET.

## Hướng mở rộng tiếp theo

- Thêm persistence thật (EF) cho Habits, Pomodoro, Countdown Events.
- Thêm Auth (NextAuth + backend) và Settings per user.
- Thêm tests cho các service khác (Tasks, Lists, Columns).
- Thêm logging, validation, error-handling chuẩn hóa.
