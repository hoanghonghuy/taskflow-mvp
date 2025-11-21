namespace Taskflow.Application.Pomodoro.Models;

public sealed class PomodoroSessionCreateRequest
{
    public DateTime StartTime { get; set; }
    public int DurationSeconds { get; set; }
    public string Type { get; set; } = "focus";
    public Guid? TaskId { get; set; }
    public Guid? HabitId { get; set; }
}
