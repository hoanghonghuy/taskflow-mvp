namespace Taskflow.Application.Columns.Models;

public sealed class TodoColumnCreateRequest
{
    public Guid ListId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; }
}
