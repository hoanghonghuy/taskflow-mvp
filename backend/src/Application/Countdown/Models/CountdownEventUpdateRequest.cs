namespace Taskflow.Application.Countdown.Models;

public sealed class CountdownEventUpdateRequest
{
    public string? Title { get; set; }
    public DateTime? TargetDate { get; set; }
    public string? Color { get; set; }
}
