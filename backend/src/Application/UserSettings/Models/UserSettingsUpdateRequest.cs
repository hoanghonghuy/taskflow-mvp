using System.Text.Json.Serialization;

namespace Taskflow.Application.UserSettings.Models;

public sealed class UserSettingsUpdateRequest
{
    [JsonPropertyName("language")]
    public string Language { get; set; } = "en";

    [JsonPropertyName("theme")]
    public string Theme { get; set; } = "light";

    [JsonPropertyName("notifications")]
    public bool Notifications { get; set; } = true;

    [JsonPropertyName("soundEnabled")]
    public bool SoundEnabled { get; set; }

    [JsonPropertyName("autoStartPomodoro")]
    public bool AutoStartPomodoro { get; set; }

    [JsonPropertyName("defaultPriority")]
    public string DefaultPriority { get; set; } = "medium";

    [JsonPropertyName("defaultListId")]
    public string DefaultListId { get; set; } = "inbox";

    [JsonPropertyName("bottomNavActions")]
    public List<string>? BottomNavActions { get; set; }

    [JsonPropertyName("geminiApiKey")]
    public string? GeminiApiKey { get; set; }
}
