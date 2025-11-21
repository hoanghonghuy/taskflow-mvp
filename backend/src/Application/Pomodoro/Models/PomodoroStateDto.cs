using System.Text.Json.Serialization;

namespace Taskflow.Application.Pomodoro.Models;

public sealed class PomodoroStateDto
{
    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; }

    [JsonPropertyName("isPaused")]
    public bool IsPaused { get; set; }

    [JsonPropertyName("remainingSeconds")]
    public int RemainingSeconds { get; set; }

    [JsonPropertyName("currentSession")]
    public string CurrentSession { get; set; } = "focus";

    [JsonPropertyName("focusedTaskId")]
    public string? FocusedTaskId { get; set; }

    [JsonPropertyName("focusedHabitId")]
    public string? FocusedHabitId { get; set; }

    [JsonPropertyName("sessionsCompleted")]
    public int SessionsCompleted { get; set; }
}
