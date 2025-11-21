namespace Taskflow.Application.Lists.Models;

public sealed record TodoListDto(
    Guid Id,
    string Name,
    string Color,
    IReadOnlyList<string> Members
);
