namespace Taskflow.Application.Columns.Models;

public sealed class TodoColumnUpdateRequest
{
    public string? Name { get; set; }
    public int? Order { get; set; }
}
