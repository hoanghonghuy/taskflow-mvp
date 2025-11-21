namespace Taskflow.Application.Ai.Models;

public sealed class ChatRequest
{
    public List<ChatMessageDto> Messages { get; set; } = new();
    public string? Language { get; set; }
    public bool ThinkingMode { get; set; }
    public bool SearchGrounding { get; set; }
}
