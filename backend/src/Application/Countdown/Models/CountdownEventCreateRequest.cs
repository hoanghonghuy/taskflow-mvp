namespace Taskflow.Application.Countdown.Models;

public sealed class CountdownEventCreateRequest
{
    public string Title { get; set; } = string.Empty;
    public DateTime TargetDate { get; set; }
    public string? Color { get; set; }
}
