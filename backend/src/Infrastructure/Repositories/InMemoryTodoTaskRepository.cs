using Taskflow.Application.Common.Interfaces;
using Taskflow.Domain.Entities;

namespace Taskflow.Infrastructure.Repositories;

public sealed class InMemoryTodoTaskRepository : ITodoTaskRepository
{
    private readonly List<TodoTask> _tasks = new();

    public Task<IReadOnlyList<TodoTask>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IReadOnlyList<TodoTask>>(_tasks);
    }

    public Task<TodoTask?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var task = _tasks.FirstOrDefault(t => t.Id == id);
        return Task.FromResult(task);
    }

    public Task AddAsync(TodoTask task, CancellationToken cancellationToken = default)
    {
        _tasks.Add(task);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(TodoTask task, CancellationToken cancellationToken = default)
    {
        var index = _tasks.FindIndex(t => t.Id == task.Id);
        if (index >= 0)
        {
            _tasks[index] = task;
        }
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var existing = _tasks.FirstOrDefault(t => t.Id == id);
        if (existing is not null)
        {
            _tasks.Remove(existing);
        }
        return Task.CompletedTask;
    }
}
