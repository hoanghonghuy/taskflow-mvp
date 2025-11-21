using Taskflow.Application.Common.Interfaces;
using Taskflow.Domain.Entities;

namespace Taskflow.Infrastructure.Repositories;

public sealed class InMemoryTodoListRepository : ITodoListRepository
{
    private readonly List<TodoList> _lists = new();

    public InMemoryTodoListRepository()
    {
        // Seed some defaults similar to frontend DEFAULT_LISTS
        if (_lists.Count == 0)
        {
            _lists.Add(TodoList.Create("Inbox", "#3b82f6"));
            _lists.Add(TodoList.Create("Work", "#8b5cf6"));
            _lists.Add(TodoList.Create("Personal", "#10b981"));
        }
    }

    public Task<IReadOnlyList<TodoList>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IReadOnlyList<TodoList>>(_lists);
    }

    public Task<TodoList?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var list = _lists.FirstOrDefault(l => l.Id == id);
        return Task.FromResult(list);
    }

    public Task AddAsync(TodoList list, CancellationToken cancellationToken = default)
    {
        _lists.Add(list);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(TodoList list, CancellationToken cancellationToken = default)
    {
        var index = _lists.FindIndex(l => l.Id == list.Id);
        if (index >= 0)
        {
            _lists[index] = list;
        }

        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var existing = _lists.FirstOrDefault(l => l.Id == id);
        if (existing is not null)
        {
            _lists.Remove(existing);
        }

        return Task.CompletedTask;
    }
}
