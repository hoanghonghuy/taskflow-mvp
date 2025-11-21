namespace Taskflow.Application.Ai.Models;

public sealed class AnalyzeTaskRequest
{
    public string Text { get; set; } = string.Empty;
    public string? Language { get; set; }
}
