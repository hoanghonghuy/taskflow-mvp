namespace Taskflow.Application.Lists.Models;

public sealed class TodoListCreateRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
    public List<string> Members { get; set; } = new();
}
