using System.Text.Json.Serialization;

namespace Taskflow.Application.UserSettings.Models;

public sealed class UserSettingsDto
{
    [JsonPropertyName("language")]
    public string Language { get; init; } = "en";

    [JsonPropertyName("theme")]
    public string Theme { get; init; } = "light";

    [JsonPropertyName("notifications")]
    public bool Notifications { get; init; } = true;

    [JsonPropertyName("soundEnabled")]
    public bool SoundEnabled { get; init; }

    [JsonPropertyName("autoStartPomodoro")]
    public bool AutoStartPomodoro { get; init; }

    [JsonPropertyName("defaultPriority")]
    public string DefaultPriority { get; init; } = "medium";

    [JsonPropertyName("defaultListId")]
    public string DefaultListId { get; init; } = "inbox";

    [JsonPropertyName("bottomNavActions")]
    public IReadOnlyList<string>? BottomNavActions { get; init; }

    [JsonPropertyName("geminiApiKey")]
    public string? GeminiApiKey { get; init; }
}
