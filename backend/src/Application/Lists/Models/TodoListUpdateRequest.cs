namespace Taskflow.Application.Lists.Models;

public sealed class TodoListUpdateRequest
{
    public string? Name { get; set; }
    public string? Color { get; set; }
    public List<string>? Members { get; set; }
}
