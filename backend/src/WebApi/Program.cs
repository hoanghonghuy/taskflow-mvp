using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Taskflow.WebApi;
using Taskflow.Application.Common.Interfaces;
using Taskflow.Application.Tasks.Models;
using Taskflow.Application.Tasks.Services;
using Taskflow.Application.Lists.Models;
using Taskflow.Application.Lists.Services;
using Taskflow.Application.Columns.Models;
using Taskflow.Application.Columns.Services;
using Taskflow.Application.Habits.Models;
using Taskflow.Application.Habits.Services;
using Taskflow.Application.Countdown.Models;
using Taskflow.Application.Countdown.Services;
using Taskflow.Application.Pomodoro.Models;
using Taskflow.Application.Pomodoro.Services;
using Taskflow.Application.Users.Models;
using Taskflow.Application.Users.Services;
using Taskflow.Application.UserSettings.Models;
using Taskflow.Application.UserSettings.Services;
using Taskflow.Application.Ai.Models;
using Taskflow.Application.Ai.Services;
using Taskflow.Domain.Entities;
using Taskflow.Infrastructure.Persistence;
using Taskflow.Infrastructure.Repositories;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Globalization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var jwtKey = builder.Configuration["Jwt:Key"] ?? "change_this_dev_jwt_signing_key_32bytes_min";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "Taskflow";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "TaskflowClient";
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            // Để đơn giản cho dev/test: chỉ kiểm tra chữ ký và thời hạn token,
            // không bắt buộc Issuer/Audience phải khớp cấu hình.
            ValidateIssuer = false,
            ValidIssuer = jwtIssuer,
            ValidateAudience = false,
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateLifetime = true
        };
    });

builder.Services.AddAuthorization();

builder.Services
    .AddHealthChecks()
    .AddCheck<AppDbContextHealthCheck>("db");

// EF Core DbContext using Sqlite
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("Default")
                           ?? "Data Source=taskflow.db";
    options.UseSqlite(connectionString);
});

// Repositories - EF for tasks/lists/columns/habits
builder.Services.AddScoped<ITodoTaskRepository, EfTodoTaskRepository>();
builder.Services.AddScoped<ITodoTaskService, TodoTaskService>();

builder.Services.AddScoped<ITodoListRepository, EfTodoListRepository>();
builder.Services.AddScoped<ITodoListService, TodoListService>();

builder.Services.AddScoped<ITodoColumnRepository, EfTodoColumnRepository>();
builder.Services.AddScoped<ITodoColumnService, TodoColumnService>();

builder.Services.AddScoped<IHabitRepository, EfHabitRepository>();
builder.Services.AddScoped<IHabitService, HabitService>();

builder.Services.AddScoped<ICountdownEventRepository, EfCountdownEventRepository>();
builder.Services.AddScoped<ICountdownEventService, CountdownEventService>();

builder.Services.AddScoped<IPomodoroSessionRepository, EfPomodoroSessionRepository>();
builder.Services.AddScoped<IPomodoroSessionService, PomodoroSessionService>();
builder.Services.AddScoped<IUserRepository, EfUserRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IRefreshTokenRepository, EfRefreshTokenRepository>();
builder.Services.AddScoped<IUserSettingsRepository, EfUserSettingsRepository>();
builder.Services.AddScoped<IUserSettingsService, UserSettingsService>();

builder.Services.AddHttpClient<IAiService, GeminiAiService>();

var app = builder.Build();

// Ensure database is created and seed default data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    if (app.Environment.IsDevelopment())
    {
        try
        {
            // Touch UserSettings Pomodoro fields to detect potential schema mismatch when
            // the SQLite database file was created before these columns existed.
            _ = db.UserSettings.Select(s => s.PomodoroStateJson).FirstOrDefault();
        }
        catch (Exception ex)
        {
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
            logger.LogWarning(ex, "Detected possible SQLite schema mismatch for UserSettings. Consider deleting the database file in development if startup fails.");
        }
    }

    if (!db.Lists.Any())
    {
        var demoUserId = GetDemoUserId();

        var inbox = TodoList.Create("Inbox", "#3b82f6");
        inbox.AssignToUser(demoUserId);

        var work = TodoList.Create("Work", "#8b5cf6");
        work.AssignToUser(demoUserId);

        var personal = TodoList.Create("Personal", "#10b981");
        personal.AssignToUser(demoUserId);

        db.Lists.AddRange(inbox, work, personal);

        var todoCol = TodoColumn.Create(inbox.Id, "To Do", 0);
        var inProgressCol = TodoColumn.Create(inbox.Id, "In Progress", 1);
        var doneCol = TodoColumn.Create(inbox.Id, "Done", 2);
        db.Columns.AddRange(todoCol, inProgressCol, doneCol);

        db.SaveChanges();
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        var feature = context.Features.Get<IExceptionHandlerFeature>();
        var exception = feature?.Error;

        var error = "internal_server_error";
        string? message = app.Environment.IsDevelopment()
            ? exception?.Message
            : "An unexpected error occurred.";

        if (exception is ArgumentException)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            error = "invalid_request";
            message = exception.Message;
        }

        logger.LogError(exception, "Unhandled exception while processing request");

        context.Response.ContentType = "application/json";
        var problem = new { error, message };
        await context.Response.WriteAsJsonAsync(problem);
    });
});

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.MapHealthChecks("/health");

var tasksGroup = app.MapGroup("/api/tasks").RequireAuthorization();

tasksGroup.MapGet("/", async (ITodoTaskService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var tasks = await service.GetAllAsync(userId.Value, ct);
    return Results.Ok(tasks);
});

tasksGroup.MapGet("/{id:guid}", async (Guid id, ITodoTaskService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var task = await service.GetByIdAsync(userId.Value, id, ct);
    return task is null ? Results.NotFound() : Results.Ok(task);
});

tasksGroup.MapPost("/", async ([FromBody] TodoTaskCreateRequest request, ITodoTaskService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var created = await service.CreateAsync(userId.Value, request, ct);
    return Results.Created($"/api/tasks/{created.Id}", created);
});

tasksGroup.MapPut("/{id:guid}", async (Guid id, [FromBody] TodoTaskUpdateRequest request, ITodoTaskService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var updated = await service.UpdateAsync(userId.Value, id, request, ct);
    return updated is null ? Results.NotFound() : Results.Ok(updated);
});

tasksGroup.MapDelete("/{id:guid}", async (Guid id, ITodoTaskService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var deleted = await service.DeleteAsync(userId.Value, id, ct);
    return deleted ? Results.NoContent() : Results.NotFound();
});

app.MapGet("/api/profile/summary", async (
    ITodoTaskRepository tasks,
    IHabitRepository habits,
    IPomodoroSessionService pomodoroSessions,
    HttpContext http,
    CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var allTasks = await tasks.GetAllAsync(ct);
    var allHabits = await habits.GetAllAsync(ct);
    var sessions = await pomodoroSessions.GetAllAsync(userId.Value, ct);

    var userTasks = allTasks.Where(t => t.UserId == userId.Value).ToList();
    var userHabits = allHabits.Where(h => h.UserId == userId.Value).ToList();

    var totalTasks = userTasks.Count;
    var completedTasks = userTasks.Count(t => t.Completed);

    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    var todayString = today.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
    var completedHabitsToday = userHabits.Count(h => h.Completions.Contains(todayString));

    var pendingWithDueDate = userTasks
        .Where(t => !t.Completed && t.DueDate.HasValue)
        .ToList();

    var todayTasksPending = pendingWithDueDate.Count(t =>
    {
        var due = DateOnly.FromDateTime(t.DueDate!.Value);
        return due <= today;
    });

    var upcomingTasksPending = pendingWithDueDate.Count(t =>
    {
        var due = DateOnly.FromDateTime(t.DueDate!.Value);
        return due > today;
    });

    var focusSessions = sessions.Where(s => string.Equals(s.Type, "focus", StringComparison.OrdinalIgnoreCase));
    var totalFocusTime = focusSessions.Sum(s => s.DurationSeconds);
    var totalPomos = focusSessions.Count();

    var completionRate = totalTasks > 0
        ? (int)Math.Round(completedTasks * 100.0 / totalTasks)
        : 0;

    var unlockedIds = GetUnlockedAchievementIds(userTasks, userHabits, sessions);

    var result = new
    {
        totalTasks,
        completedTasks,
        completionRate,
        totalHabits = userHabits.Count,
        completedHabitsToday,
        totalFocusTime,
        totalPomos,
        unlockedAchievements = unlockedIds.Count,
        todayTasksPending,
        upcomingTasksPending,
    };

    return Results.Ok(result);
}).RequireAuthorization();

app.MapGet("/api/profile/achievements", async (
    ITodoTaskRepository tasks,
    IHabitRepository habits,
    IPomodoroSessionService pomodoroSessions,
    HttpContext http,
    CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var allTasks = await tasks.GetAllAsync(ct);
    var allHabits = await habits.GetAllAsync(ct);
    var sessions = await pomodoroSessions.GetAllAsync(userId.Value, ct);

    var userTasks = allTasks.Where(t => t.UserId == userId.Value).ToList();
    var userHabits = allHabits.Where(h => h.UserId == userId.Value).ToList();

    var unlockedIds = GetUnlockedAchievementIds(userTasks, userHabits, sessions);

    return Results.Ok(unlockedIds);
}).RequireAuthorization();

app.MapGet("/api/settings", async (
    IUserSettingsService service,
    HttpContext http,
    CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var settings = await service.GetOrCreateAsync(userId.Value, ct);
    return Results.Ok(settings);
}).RequireAuthorization();

app.MapPut("/api/settings", async (
    [FromBody] UserSettingsUpdateRequest request,
    IUserSettingsService service,
    HttpContext http,
    CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var settings = await service.UpdateAsync(userId.Value, request, ct);
    return Results.Ok(settings);
}).RequireAuthorization();

app.MapGet("/api/pomodoro/state", async (
    IUserSettingsService service,
    HttpContext http,
    CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var state = await service.GetPomodoroStateAsync(userId.Value, ct);
    return state is null ? Results.NoContent() : Results.Ok(state);
}).RequireAuthorization();

app.MapPut("/api/pomodoro/state", async (
    [FromBody] PomodoroStateUpdateRequest request,
    IUserSettingsService service,
    HttpContext http,
    CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var state = await service.UpdatePomodoroStateAsync(userId.Value, request, ct);
    return Results.Ok(state);
}).RequireAuthorization();

var listsGroup = app.MapGroup("/api/lists").RequireAuthorization();

listsGroup.MapGet("/", async (ITodoListService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var lists = await service.GetAllAsync(userId.Value, ct);
    return Results.Ok(lists);
});

listsGroup.MapGet("/{id:guid}", async (Guid id, ITodoListService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var list = await service.GetByIdAsync(userId.Value, id, ct);
    return list is null ? Results.NotFound() : Results.Ok(list);
});

listsGroup.MapPost("/", async ([FromBody] TodoListCreateRequest request, ITodoListService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var created = await service.CreateAsync(userId.Value, request, ct);
    return Results.Created($"/api/lists/{created.Id}", created);
});

listsGroup.MapPut("/{id:guid}", async (Guid id, [FromBody] TodoListUpdateRequest request, ITodoListService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var updated = await service.UpdateAsync(userId.Value, id, request, ct);
    return updated is null ? Results.NotFound() : Results.Ok(updated);
});

listsGroup.MapDelete("/{id:guid}", async (Guid id, ITodoListService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var deleted = await service.DeleteAsync(userId.Value, id, ct);
    return deleted ? Results.NoContent() : Results.NotFound();
});

listsGroup.MapGet("/{listId:guid}/columns", async (Guid listId, ITodoColumnService service, CancellationToken ct) =>
{
    var columns = await service.GetByListIdAsync(listId, ct);
    return Results.Ok(columns);
});

listsGroup.MapPost("/{listId:guid}/columns", async (Guid listId, [FromBody] TodoColumnCreateRequest request, ITodoColumnService service, CancellationToken ct) =>
{
    request.ListId = listId;
    var created = await service.CreateAsync(request, ct);
    return Results.Created($"/api/columns/{created.Id}", created);
});

var columnsGroup = app.MapGroup("/api/columns");

columnsGroup.MapGet("/{id:guid}", async (Guid id, ITodoColumnService service, CancellationToken ct) =>
{
    var column = await service.GetByIdAsync(id, ct);
    return column is null ? Results.NotFound() : Results.Ok(column);
});

columnsGroup.MapPut("/{id:guid}", async (Guid id, [FromBody] TodoColumnUpdateRequest request, ITodoColumnService service, CancellationToken ct) =>
{
    var updated = await service.UpdateAsync(id, request, ct);
    return updated is null ? Results.NotFound() : Results.Ok(updated);
});

columnsGroup.MapDelete("/{id:guid}", async (Guid id, ITodoColumnService service, CancellationToken ct) =>
{
    var deleted = await service.DeleteAsync(id, ct);
    return deleted ? Results.NoContent() : Results.NotFound();
});

var habitsGroup = app.MapGroup("/api/habits").RequireAuthorization();

habitsGroup.MapGet("/", async (IHabitService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var habits = await service.GetAllAsync(userId.Value, ct);
    return Results.Ok(habits);
});

habitsGroup.MapGet("/{id:guid}", async (Guid id, IHabitService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var habit = await service.GetByIdAsync(userId.Value, id, ct);
    return habit is null ? Results.NotFound() : Results.Ok(habit);
});

habitsGroup.MapPost("/", async ([FromBody] HabitCreateRequest request, IHabitService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var created = await service.CreateAsync(userId.Value, request, ct);
    return Results.Created($"/api/habits/{created.Id}", created);
});

habitsGroup.MapPut("/{id:guid}", async (Guid id, [FromBody] HabitUpdateRequest request, IHabitService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var updated = await service.UpdateAsync(userId.Value, id, request, ct);
    return updated is null ? Results.NotFound() : Results.Ok(updated);
});

habitsGroup.MapDelete("/{id:guid}", async (Guid id, IHabitService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var deleted = await service.DeleteAsync(userId.Value, id, ct);
    return deleted ? Results.NoContent() : Results.NotFound();
});

habitsGroup.MapPost("/{id:guid}/complete", async (Guid id, [FromBody] HabitCompleteRequest request, IHabitService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var date = ParseOrToday(request.Date);
    var ok = await service.CompleteForDateAsync(userId.Value, id, date, ct);
    return ok ? Results.NoContent() : Results.NotFound();
});

habitsGroup.MapDelete("/{id:guid}/complete", async (Guid id, [FromQuery] string? date, IHabitService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var parsedDate = ParseOrToday(date);
    var ok = await service.UncompleteForDateAsync(userId.Value, id, parsedDate, ct);
    return ok ? Results.NoContent() : Results.NotFound();
});

var countdownGroup = app.MapGroup("/api/countdown").RequireAuthorization();

countdownGroup.MapGet("/", async (ICountdownEventService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var events = await service.GetAllAsync(userId.Value, ct);
    return Results.Ok(events);
});

countdownGroup.MapGet("/{id:guid}", async (Guid id, ICountdownEventService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var evt = await service.GetByIdAsync(userId.Value, id, ct);
    return evt is null ? Results.NotFound() : Results.Ok(evt);
});

countdownGroup.MapPost("/", async ([FromBody] CountdownEventCreateRequest request, ICountdownEventService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var created = await service.CreateAsync(userId.Value, request, ct);
    return Results.Created($"/api/countdown/{created.Id}", created);
});

countdownGroup.MapPut("/{id:guid}", async (Guid id, [FromBody] CountdownEventUpdateRequest request, ICountdownEventService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var updated = await service.UpdateAsync(userId.Value, id, request, ct);
    return updated is null ? Results.NotFound() : Results.Ok(updated);
});

countdownGroup.MapDelete("/{id:guid}", async (Guid id, ICountdownEventService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var deleted = await service.DeleteAsync(userId.Value, id, ct);
    return deleted ? Results.NoContent() : Results.NotFound();
});

static DateOnly ParseOrToday(string? date)
{
    if (!string.IsNullOrWhiteSpace(date) && DateOnly.TryParse(date, out var result))
    {
        return result;
    }

    return DateOnly.FromDateTime(DateTime.UtcNow);
}

static Guid GetDemoUserId()
{
    // TODO: Thay bằng logic lấy userId thực tế từ JWT/claims khi tích hợp auth
    return Guid.Parse("00000000-0000-0000-0000-000000000001");
}

static int GetLongestHabitCompletionStreak(IReadOnlyList<Habit> habits)
{
    var dates = new HashSet<DateOnly>();

    foreach (var habit in habits)
    {
        foreach (var completion in habit.Completions)
        {
            if (DateOnly.TryParseExact(completion, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
            {
                dates.Add(date);
            }
        }
    }

    if (dates.Count == 0)
    {
        return 0;
    }

    var ordered = dates.OrderBy(d => d).ToArray();
    var best = 1;
    var current = 1;

    for (var i = 1; i < ordered.Length; i++)
    {
        var prev = ordered[i - 1];
        var curr = ordered[i];

        if (curr == prev.AddDays(1))
        {
            current++;
            if (current > best)
            {
                best = current;
            }
        }
        else if (curr > prev.AddDays(1))
        {
            current = 1;
        }
    }

    return best;
}

static IReadOnlyList<string> GetUnlockedAchievementIds(
    IReadOnlyList<TodoTask> tasks,
    IReadOnlyList<Habit> habits,
    IReadOnlyList<PomodoroSessionDto> sessions)
{
    var result = new List<string>();

    var totalTasks = tasks.Count;
    var completedTasks = tasks.Count(t => t.Completed);

    if (totalTasks >= 1)
    {
        result.Add("first-task");
    }

    if (completedTasks >= 10)
    {
        result.Add("complete-10");
    }

    if (completedTasks >= 50)
    {
        result.Add("complete-50");
    }

    var longestHabitStreak = GetLongestHabitCompletionStreak(habits);
    if (longestHabitStreak >= 7)
    {
        result.Add("habit-7-day-streak");
    }

    var focusSessions = sessions.Where(s => string.Equals(s.Type, "focus", StringComparison.OrdinalIgnoreCase));
    var totalFocusSeconds = focusSessions.Sum(s => s.DurationSeconds);

    if (totalFocusSeconds >= 60 * 60)
    {
        result.Add("focus-1h");
    }

    return result;
}

var authGroup = app.MapGroup("/api/auth");

authGroup.MapPost("/register", async ([FromBody] UserRegisterRequest request, IUserService service, CancellationToken ct) =>
{
    try
    {
        var user = await service.RegisterAsync(request, ct);
        return Results.Ok(user);
    }
    catch (InvalidOperationException ex)
    {
        return Results.Conflict(new { error = ex.Message });
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

authGroup.MapPost("/login", async ([FromBody] UserLoginRequest request, IUserService service, IRefreshTokenRepository refreshTokens, CancellationToken ct) =>
{
    var user = await service.LoginAsync(request, ct);
    if (user is null)
    {
        return Results.Unauthorized();
    }

    var handler = new JwtSecurityTokenHandler();
    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim(ClaimTypes.Name, user.Name)
    };

    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(claims),
        Expires = DateTime.UtcNow.AddHours(12),
        Issuer = jwtIssuer,
        Audience = jwtAudience,
        SigningCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256)
    };

    var token = handler.CreateToken(tokenDescriptor);
    var tokenString = handler.WriteToken(token);

    var refreshLifetime = TimeSpan.FromDays(7);
    var refreshToken = RefreshToken.Create(user.Id, refreshLifetime);
    await refreshTokens.AddAsync(refreshToken, ct);

    return Results.Ok(new
    {
        user,
        token = tokenString,
        refreshToken = refreshToken.Token,
        refreshExpiresAt = refreshToken.ExpiresAt
    });
});

authGroup.MapPost("/refresh", async ([FromBody] RefreshTokenRequest request, IRefreshTokenRepository refreshTokens, IUserRepository users, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(request.RefreshToken))
    {
        return Results.BadRequest(new { error = "Refresh token is required" });
    }

    var existing = await refreshTokens.GetByTokenAsync(request.RefreshToken, ct);
    if (existing is null || !existing.IsActive())
    {
        return Results.Unauthorized();
    }

    var userEntity = await users.GetByIdAsync(existing.UserId, ct);
    if (userEntity is null)
    {
        return Results.Unauthorized();
    }

    existing.Revoke();
    await refreshTokens.UpdateAsync(existing, ct);

    var newRefresh = RefreshToken.Create(existing.UserId, TimeSpan.FromDays(7));
    await refreshTokens.AddAsync(newRefresh, ct);

    var handler = new JwtSecurityTokenHandler();
    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, userEntity.Id.ToString()),
        new Claim(ClaimTypes.Email, userEntity.Email),
        new Claim(ClaimTypes.Name, userEntity.Name)
    };

    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(claims),
        Expires = DateTime.UtcNow.AddHours(12),
        Issuer = jwtIssuer,
        Audience = jwtAudience,
        SigningCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256)
    };

    var token = handler.CreateToken(tokenDescriptor);
    var tokenString = handler.WriteToken(token);

    var userDto = new UserDto(userEntity.Id, userEntity.Name, userEntity.Email);

    return Results.Ok(new
    {
        user = userDto,
        token = tokenString,
        refreshToken = newRefresh.Token,
        refreshExpiresAt = newRefresh.ExpiresAt
    });
});

var pomodoroGroup = app.MapGroup("/api/pomodoro/sessions").RequireAuthorization();

pomodoroGroup.MapGet("/", async (IPomodoroSessionService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var sessions = await service.GetAllAsync(userId.Value, ct);
    return Results.Ok(sessions);
});

pomodoroGroup.MapGet("/{id:guid}", async (Guid id, IPomodoroSessionService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var session = await service.GetByIdAsync(userId.Value, id, ct);
    return session is null ? Results.NotFound() : Results.Ok(session);
});

pomodoroGroup.MapPost("/", async ([FromBody] PomodoroSessionCreateRequest request, IPomodoroSessionService service, HttpContext http, CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var created = await service.CreateAsync(userId.Value, request, ct);
    return Results.Created($"/api/pomodoro/sessions/{created.Id}", created);
});

var aiGroup = app.MapGroup("/api/ai").RequireAuthorization();

aiGroup.MapPost("/briefing", async (
    [FromBody] BriefingRequest? request,
    ITodoTaskRepository tasks,
    IHabitRepository habits,
    IPomodoroSessionService pomodoro,
    IAiService ai,
    HttpContext http,
    CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var userTasks = (await tasks.GetAllAsync(ct)).Where(t => t.UserId == userId.Value).ToList();
    var userHabits = (await habits.GetAllAsync(ct)).Where(h => h.UserId == userId.Value).ToList();
    var sessions = await pomodoro.GetAllAsync(userId.Value, ct);

    var contextBuilder = new System.Text.StringBuilder();
    contextBuilder.AppendLine($"Total tasks: {userTasks.Count}");
    contextBuilder.AppendLine($"Completed tasks: {userTasks.Count(t => t.Completed)}");
    contextBuilder.AppendLine($"Habits: {userHabits.Count}");
    contextBuilder.AppendLine($"Focus sessions: {sessions.Count}");
    contextBuilder.AppendLine();

    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    var todayTasks = userTasks
        .Where(t => t.DueDate.HasValue && DateOnly.FromDateTime(t.DueDate.Value) == today)
        .Take(20)
        .ToList();

    if (todayTasks.Count > 0)
    {
        contextBuilder.AppendLine("Tasks due today:");
        foreach (var t in todayTasks)
        {
            contextBuilder.AppendLine("- " + t.Title);
        }
    }

    var language = string.IsNullOrWhiteSpace(request?.Language) ? "en" : request!.Language!;
    var briefing = await ai.GenerateBriefingAsync(language, contextBuilder.ToString(), ct);
    return Results.Ok(new { content = briefing });
});

aiGroup.MapPost("/tasks/analyze", async (
    [FromBody] AnalyzeTaskRequest request,
    IAiService ai,
    HttpContext http,
    CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(request.Text))
    {
        return Results.BadRequest(new { error = "Text is required" });
    }

    var language = string.IsNullOrWhiteSpace(request.Language) ? "en" : request.Language!;
    var result = await ai.AnalyzeTaskAsync(language, request.Text, ct);
    return Results.Ok(result);
});

aiGroup.MapPost("/chat", async (
    [FromBody] ChatRequest request,
    IAiService ai,
    HttpContext http,
    CancellationToken ct) =>
{
    var userId = GetUserIdFromClaims(http.User);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var language = string.IsNullOrWhiteSpace(request.Language) ? "en" : request.Language!;
    var messages = request.Messages ?? [];
    var answer = await ai.ChatAsync(language, messages, request.ThinkingMode, request.SearchGrounding, ct);
    return Results.Ok(new { content = answer });
});

static Guid? GetUserIdFromClaims(ClaimsPrincipal user)
{
    var idValue = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? user.FindFirst("sub")?.Value;

    if (idValue is null)
    {
        return null;
    }

    if (!Guid.TryParse(idValue, out var id))
    {
        return null;
    }

    return id;
}

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

public partial class Program
{
}
