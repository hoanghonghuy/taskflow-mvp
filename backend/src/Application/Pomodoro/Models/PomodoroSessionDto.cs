namespace Taskflow.Application.Pomodoro.Models;

public sealed record PomodoroSessionDto(
    Guid Id,
    DateTime StartTime,
    int DurationSeconds,
    string Type,
    Guid? TaskId,
    Guid? HabitId
);
