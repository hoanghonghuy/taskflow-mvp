using Taskflow.Domain.Entities;

namespace Taskflow.Application.Tasks.Models;

public sealed record TodoTaskDto(
    Guid Id,
    string Title,
    string? Description,
    bool Completed,
    DateTime CreatedAt,
    DateTime? DueDate,
    string Priority,
    string ListId,
    IReadOnlyList<string> Tags,
    Guid? ColumnId,
    IReadOnlyList<TaskSubtask> Subtasks,
    IReadOnlyList<TaskComment> Comments,
    TaskRecurrence? Recurrence,
    int? ReminderMinutes,
    string? AssigneeId
);
