namespace Taskflow.Application.Ai.Models;

public sealed class ChatMessageDto
{
    public string Role { get; set; } = string.Empty; // "user" or "model"
    public string Text { get; set; } = string.Empty;
}
