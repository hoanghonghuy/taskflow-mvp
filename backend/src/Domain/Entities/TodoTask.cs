namespace Taskflow.Domain.Entities;

public class TodoTask
{
    public Guid Id { get; private set; }
    public string Title { get; private set; } = string.Empty!;
    public string? Description { get; private set; }
    public bool Completed { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? DueDate { get; private set; }
    public string Priority { get; private set; } = "none"; // none | low | medium | high | urgent
    public string ListId { get; private set; } = "inbox";
    public List<string> Tags { get; private set; } = new();
    public List<TaskSubtask> Subtasks { get; private set; } = new();
    public List<TaskComment> Comments { get; private set; } = new();
    public TaskRecurrence? Recurrence { get; private set; }
    public int? ReminderMinutes { get; private set; }
    public string? AssigneeId { get; private set; }
    public Guid? ColumnId { get; private set; }
    public Guid UserId { get; private set; }

    // Simple factory to enforce non-empty title
    public static TodoTask Create(string title)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Title must not be empty", nameof(title));

        return new TodoTask
        {
            Id = Guid.NewGuid(),
            Title = title.Trim(),
            CreatedAt = DateTime.UtcNow,
        };
    }

    public void UpdateBasicInfo(string? title, string? description)
    {
        if (!string.IsNullOrWhiteSpace(title))
        {
            Title = title.Trim();
        }
        Description = description;
    }

    public void SetCompleted(bool completed)
    {
        Completed = completed;
    }

    public void SetDueDate(DateTime? dueDate)
    {
        DueDate = dueDate;
    }

    public void SetPriority(string? priority)
    {
        if (string.IsNullOrWhiteSpace(priority))
        {
            return;
        }

        var normalized = priority.Trim().ToLowerInvariant();
        if (normalized is "none" or "low" or "medium" or "high" or "urgent")
        {
            Priority = normalized;
        }
    }

    public void SetList(string? listId)
    {
        if (!string.IsNullOrWhiteSpace(listId))
        {
            ListId = listId.Trim();
        }
    }

    public void SetTags(IEnumerable<string>? tags)
    {
        if (tags is null)
        {
            Tags = new List<string>();
            return;
        }

        Tags = tags
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Select(t => t.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public void SetRecurrence(TaskRecurrence? recurrence)
    {
        Recurrence = recurrence;
    }

    public void SetReminderMinutes(int? minutes)
    {
        ReminderMinutes = minutes;
    }

    public void SetAssignee(string? assigneeId)
    {
        AssigneeId = string.IsNullOrWhiteSpace(assigneeId) ? null : assigneeId.Trim();
    }

    public void SetSubtasks(IEnumerable<TaskSubtask>? subtasks)
    {
        Subtasks = subtasks?.ToList() ?? new List<TaskSubtask>();
    }

    public void SetComments(IEnumerable<TaskComment>? comments)
    {
        Comments = comments?.ToList() ?? new List<TaskComment>();
    }

    public void SetColumn(Guid? columnId)
    {
        ColumnId = columnId;
    }

    public void AssignToUser(Guid userId)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("UserId must not be empty", nameof(userId));

        UserId = userId;
    }
}
