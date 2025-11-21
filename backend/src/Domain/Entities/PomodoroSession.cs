namespace Taskflow.Domain.Entities;

public class PomodoroSession
{
    public Guid Id { get; private set; }
    public DateTime StartTime { get; private set; }
    public int DurationSeconds { get; private set; }
    public string Type { get; private set; } = null!; // focus | shortBreak | longBreak
    public Guid? TaskId { get; private set; }
    public Guid? HabitId { get; private set; }
    public Guid UserId { get; private set; }

    private PomodoroSession() { }

    public static PomodoroSession Create(DateTime startTime, int durationSeconds, string type, Guid? taskId, Guid? habitId)
    {
        if (durationSeconds <= 0)
            throw new ArgumentOutOfRangeException(nameof(durationSeconds));
        if (string.IsNullOrWhiteSpace(type))
            throw new ArgumentException("Type is required", nameof(type));

        return new PomodoroSession
        {
            Id = Guid.NewGuid(),
            StartTime = startTime,
            DurationSeconds = durationSeconds,
            Type = type.Trim(),
            TaskId = taskId,
            HabitId = habitId,
        };
    }

    public void AssignToUser(Guid userId)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("UserId must not be empty", nameof(userId));

        UserId = userId;
    }
}
