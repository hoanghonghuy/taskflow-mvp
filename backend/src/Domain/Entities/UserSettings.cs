namespace Taskflow.Domain.Entities;

public class UserSettings
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string Language { get; private set; } = "en";
    public string Theme { get; private set; } = "light";
    public bool Notifications { get; private set; } = true;
    public bool SoundEnabled { get; private set; }
    public bool AutoStartPomodoro { get; private set; }
    public string DefaultPriority { get; private set; } = "medium";
    public string DefaultListId { get; private set; } = "inbox";
    public List<string> BottomNavActions { get; private set; } = new();
    public string? GeminiApiKey { get; private set; }
    public string? PomodoroStateJson { get; private set; }
    public DateTime? PomodoroStateUpdatedAt { get; private set; }

    private UserSettings()
    {
    }

    public static UserSettings CreateDefault(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("UserId must not be empty", nameof(userId));
        }

        return new UserSettings
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Language = "en",
            Theme = "light",
            Notifications = true,
            SoundEnabled = false,
            AutoStartPomodoro = false,
            DefaultPriority = "medium",
            DefaultListId = "inbox",
            BottomNavActions = new List<string> { "dashboard", "list", "board", "calendar" },
            GeminiApiKey = null,
            PomodoroStateJson = null,
            PomodoroStateUpdatedAt = null,
        };
    }

    public void Update(
        string language,
        string theme,
        bool notifications,
        bool soundEnabled,
        bool autoStartPomodoro,
        string defaultPriority,
        string defaultListId,
        IEnumerable<string>? bottomNavActions,
        string? geminiApiKey)
    {
        Language = string.IsNullOrWhiteSpace(language) ? "en" : language;
        Theme = string.IsNullOrWhiteSpace(theme) ? "light" : theme;
        Notifications = notifications;
        SoundEnabled = soundEnabled;
        AutoStartPomodoro = autoStartPomodoro;
        DefaultPriority = string.IsNullOrWhiteSpace(defaultPriority) ? "medium" : defaultPriority;
        DefaultListId = string.IsNullOrWhiteSpace(defaultListId) ? "inbox" : defaultListId;
        BottomNavActions = bottomNavActions?.Where(a => !string.IsNullOrWhiteSpace(a)).Select(a => a.Trim()).ToList()
                           ?? new List<string> { "dashboard", "list", "board", "calendar" };
        GeminiApiKey = string.IsNullOrWhiteSpace(geminiApiKey) ? null : geminiApiKey;
    }

    public void UpdatePomodoroState(string? stateJson, DateTime? updatedAtUtc)
    {
        PomodoroStateJson = stateJson;
        PomodoroStateUpdatedAt = updatedAtUtc;
    }
}
