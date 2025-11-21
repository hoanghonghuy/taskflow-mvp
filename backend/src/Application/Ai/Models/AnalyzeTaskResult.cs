namespace Taskflow.Application.Ai.Models;

public sealed class AnalyzeTaskResult
{
    public string Title { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public string Priority { get; set; } = "none"; // none | low | medium | high | urgent
    public List<string> Tags { get; set; } = new();
}
