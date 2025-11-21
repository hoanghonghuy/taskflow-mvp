using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Taskflow.Domain.Entities;
using CountdownEventEntity = Taskflow.Domain.Entities.CountdownEvent;

namespace Taskflow.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<TodoTask> Tasks => Set<TodoTask>();
    public DbSet<TodoList> Lists => Set<TodoList>();
    public DbSet<TodoColumn> Columns => Set<TodoColumn>();
    public DbSet<PomodoroSession> PomodoroSessions => Set<PomodoroSession>();
    public DbSet<Habit> Habits => Set<Habit>();
    public DbSet<CountdownEventEntity> CountdownEvents => Set<CountdownEventEntity>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<UserSettings> UserSettings => Set<UserSettings>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<TodoTask>(b =>
        {
            b.HasKey(t => t.Id);
            b.Property(t => t.Title).IsRequired().HasMaxLength(256);

            b.Property(t => t.Tags)
                .HasConversion(
                    v => string.Join(',', v),
                    v => string.IsNullOrEmpty(v)
                        ? new List<string>()
                        : v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList());

            b.Property(t => t.Subtasks)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => string.IsNullOrEmpty(v)
                        ? new List<TaskSubtask>()
                        : JsonSerializer.Deserialize<List<TaskSubtask>>(v, (JsonSerializerOptions?)null) ?? new List<TaskSubtask>());

            b.Property(t => t.Comments)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => string.IsNullOrEmpty(v)
                        ? new List<TaskComment>()
                        : JsonSerializer.Deserialize<List<TaskComment>>(v, (JsonSerializerOptions?)null) ?? new List<TaskComment>());

            b.Property(t => t.Recurrence)
                .HasConversion(
                    v => v == null ? null : JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => string.IsNullOrEmpty(v)
                        ? null
                        : JsonSerializer.Deserialize<TaskRecurrence>(v, (JsonSerializerOptions?)null));

            b.Property(t => t.ReminderMinutes);
            b.Property(t => t.AssigneeId).HasMaxLength(128);
        });

        modelBuilder.Entity<TodoList>(b =>
        {
            b.HasKey(l => l.Id);
            b.Property(l => l.Name).IsRequired().HasMaxLength(128);
            b.Property(l => l.Members)
                .HasConversion(
                    v => string.Join(',', v),
                    v => string.IsNullOrEmpty(v)
                        ? new List<string>()
                        : v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList());
        });

        modelBuilder.Entity<TodoColumn>(b =>
        {
            b.HasKey(c => c.Id);
            b.Property(c => c.Name).IsRequired().HasMaxLength(128);
        });

        modelBuilder.Entity<PomodoroSession>(b =>
        {
            b.HasKey(p => p.Id);
            b.Property(p => p.Type).IsRequired().HasMaxLength(32);
            b.Property(p => p.DurationSeconds).IsRequired();
            b.Property(p => p.StartTime).IsRequired();
        });

        modelBuilder.Entity<Habit>(b =>
        {
            b.HasKey(h => h.Id);
            b.Property(h => h.Name).IsRequired().HasMaxLength(128);
            b.Property(h => h.CreatedAt).IsRequired();
            b.Property(h => h.UserId).IsRequired();
            b.Property(h => h.Completions)
                .HasConversion(
                    v => string.Join(',', v),
                    v => string.IsNullOrEmpty(v)
                        ? new List<string>()
                        : v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList());
        });

        modelBuilder.Entity<CountdownEventEntity>(b =>
        {
            b.HasKey(c => c.Id);
            b.Property(c => c.Title).IsRequired().HasMaxLength(256);
            b.Property(c => c.TargetDate).IsRequired();
            b.Property(c => c.Color).IsRequired().HasMaxLength(32);
        });

        modelBuilder.Entity<User>(b =>
        {
            b.HasKey(u => u.Id);
            b.Property(u => u.Name).IsRequired().HasMaxLength(128);
            b.Property(u => u.Email).IsRequired().HasMaxLength(256);
            b.Property(u => u.PasswordHash).IsRequired();
            b.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<RefreshToken>(b =>
        {
            b.HasKey(r => r.Id);
            b.Property(r => r.Token).IsRequired().HasMaxLength(256);
            b.Property(r => r.CreatedAt).IsRequired();
            b.Property(r => r.ExpiresAt).IsRequired();
            b.HasIndex(r => r.Token).IsUnique();

            b.HasOne<User>()
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserSettings>(b =>
        {
            b.HasKey(s => s.Id);
            b.Property(s => s.Language).IsRequired().HasMaxLength(8);
            b.Property(s => s.Theme).IsRequired().HasMaxLength(64);
            b.Property(s => s.DefaultPriority).IsRequired().HasMaxLength(16);
            b.Property(s => s.DefaultListId).IsRequired().HasMaxLength(64);
            b.Property(s => s.GeminiApiKey).HasMaxLength(256);

            b.Property(s => s.BottomNavActions)
                .HasConversion(
                    v => string.Join(',', v),
                    v => string.IsNullOrEmpty(v)
                        ? new List<string>()
                        : v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList());

            b.HasIndex(s => s.UserId).IsUnique();
        });
    }
}
