using Taskflow.Domain.Entities;

namespace Taskflow.Application.Tasks.Models;

public sealed class TodoTaskUpdateRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public bool? Completed { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Priority { get; set; }
    public string? ListId { get; set; }
    public List<string>? Tags { get; set; }
    public Guid? ColumnId { get; set; }
    public List<TaskSubtask>? Subtasks { get; set; }
    public List<TaskComment>? Comments { get; set; }
    public TaskRecurrence? Recurrence { get; set; }
    public int? ReminderMinutes { get; set; }
    public string? AssigneeId { get; set; }
}
