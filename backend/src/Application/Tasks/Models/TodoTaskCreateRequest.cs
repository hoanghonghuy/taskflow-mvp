using Taskflow.Domain.Entities;

namespace Taskflow.Application.Tasks.Models;

public sealed class TodoTaskCreateRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
    public string Priority { get; set; } = "none";
    public string ListId { get; set; } = "inbox";
    public List<string> Tags { get; set; } = new();
    public Guid? ColumnId { get; set; }
    public List<TaskSubtask> Subtasks { get; set; } = new();
    public List<TaskComment> Comments { get; set; } = new();
    public TaskRecurrence? Recurrence { get; set; }
    public int? ReminderMinutes { get; set; }
    public string? AssigneeId { get; set; }
}
