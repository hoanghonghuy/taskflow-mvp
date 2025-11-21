using Taskflow.Application.Common.Interfaces;
using Taskflow.Application.Tasks.Models;
using Taskflow.Domain.Entities;

namespace Taskflow.Application.Tasks.Services;

public sealed class TodoTaskService : ITodoTaskService
{
    private readonly ITodoTaskRepository _repository;

    public TodoTaskService(ITodoTaskRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<TodoTaskDto>> GetAllAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var tasks = await _repository.GetAllAsync(cancellationToken);
        return tasks
            .Where(t => t.UserId == userId)
            .Select(MapToDto)
            .ToList();
    }

    public async Task<TodoTaskDto?> GetByIdAsync(Guid userId, Guid id, CancellationToken cancellationToken = default)
    {
        var task = await _repository.GetByIdAsync(id, cancellationToken);
        if (task is null || task.UserId != userId)
        {
            return null;
        }

        return MapToDto(task);
    }

    public async Task<TodoTaskDto> CreateAsync(Guid userId, TodoTaskCreateRequest request, CancellationToken cancellationToken = default)
    {
        var task = TodoTask.Create(request.Title);
        task.UpdateBasicInfo(request.Title, request.Description);
        // TODO: map DueDate/Priority/ListId/Tags when domain exposes proper methods
        task.SetDueDate(request.DueDate);
        task.SetPriority(request.Priority);
        task.SetList(request.ListId);
        task.SetTags(request.Tags);
        task.SetColumn(request.ColumnId);
        task.SetSubtasks(request.Subtasks);
        task.SetComments(request.Comments);
        task.SetRecurrence(request.Recurrence);
        task.SetReminderMinutes(request.ReminderMinutes);
        task.SetAssignee(request.AssigneeId);

        task.AssignToUser(userId);

        await _repository.AddAsync(task, cancellationToken);
        return MapToDto(task);
    }

    public async Task<TodoTaskDto?> UpdateAsync(Guid userId, Guid id, TodoTaskUpdateRequest request, CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByIdAsync(id, cancellationToken);
        if (existing is null || existing.UserId != userId)
        {
            return null;
        }

        existing.UpdateBasicInfo(request.Title ?? existing.Title, request.Description ?? existing.Description);
        if (request.Completed.HasValue)
        {
            existing.SetCompleted(request.Completed.Value);
        }
        // TODO: update DueDate/Priority/ListId/Tags when domain exposes proper methods
        if (request.DueDate.HasValue)
        {
            existing.SetDueDate(request.DueDate);
        }

        if (request.Priority is not null)
        {
            existing.SetPriority(request.Priority);
        }

        if (request.ListId is not null)
        {
            existing.SetList(request.ListId);
        }

        if (request.Tags is not null)
        {
            existing.SetTags(request.Tags);
        }

        if (request.ColumnId.HasValue)
        {
            existing.SetColumn(request.ColumnId);
        }

        if (request.Subtasks is not null)
        {
            existing.SetSubtasks(request.Subtasks);
        }

        if (request.Comments is not null)
        {
            existing.SetComments(request.Comments);
        }

        if (request.Recurrence is not null)
        {
            existing.SetRecurrence(request.Recurrence);
        }

        if (request.ReminderMinutes.HasValue)
        {
            existing.SetReminderMinutes(request.ReminderMinutes);
        }

        if (request.AssigneeId is not null)
        {
            existing.SetAssignee(request.AssigneeId);
        }

        await _repository.UpdateAsync(existing, cancellationToken);
        return MapToDto(existing);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid id, CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByIdAsync(id, cancellationToken);
        if (existing is null || existing.UserId != userId)
        {
            return false;
        }

        await _repository.DeleteAsync(id, cancellationToken);
        return true;
    }

    private static TodoTaskDto MapToDto(TodoTask task)
    {
        return new TodoTaskDto(
            task.Id,
            task.Title,
            task.Description,
            task.Completed,
            task.CreatedAt,
            task.DueDate,
            task.Priority,
            task.ListId,
            task.Tags,
            task.ColumnId,
            task.Subtasks,
            task.Comments,
            task.Recurrence,
            task.ReminderMinutes,
            task.AssigneeId
        );
    }
}
