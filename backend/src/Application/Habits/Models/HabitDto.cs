namespace Taskflow.Application.Habits.Models;

public sealed record HabitDto(
    Guid Id,
    string Name,
    DateTime CreatedAt,
    IReadOnlyList<string> Completions
);
