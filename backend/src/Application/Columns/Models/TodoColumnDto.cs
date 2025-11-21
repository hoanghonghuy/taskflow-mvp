namespace Taskflow.Application.Columns.Models;

public sealed record TodoColumnDto(
    Guid Id,
    Guid ListId,
    string Name,
    int Order
);
