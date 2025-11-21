namespace Taskflow.Application.Countdown.Models;

public sealed record CountdownEventDto(
    Guid Id,
    string Title,
    DateTime TargetDate,
    string Color,
    DateTime CreatedAt
);
