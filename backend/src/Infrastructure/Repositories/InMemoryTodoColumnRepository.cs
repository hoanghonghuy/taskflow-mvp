using Taskflow.Application.Common.Interfaces;
using Taskflow.Domain.Entities;

namespace Taskflow.Infrastructure.Repositories;

public sealed class InMemoryTodoColumnRepository : ITodoColumnRepository
{
    private readonly List<TodoColumn> _columns = new();

    public Task<IReadOnlyList<TodoColumn>> GetByListIdAsync(Guid listId, CancellationToken cancellationToken = default)
    {
        var result = _columns.Where(c => c.ListId == listId).ToList();
        return Task.FromResult<IReadOnlyList<TodoColumn>>(result);
    }

    public Task<TodoColumn?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var column = _columns.FirstOrDefault(c => c.Id == id);
        return Task.FromResult(column);
    }

    public Task AddAsync(TodoColumn column, CancellationToken cancellationToken = default)
    {
        _columns.Add(column);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(TodoColumn column, CancellationToken cancellationToken = default)
    {
        var index = _columns.FindIndex(c => c.Id == column.Id);
        if (index >= 0)
        {
            _columns[index] = column;
        }

        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var existing = _columns.FirstOrDefault(c => c.Id == id);
        if (existing is not null)
        {
            _columns.Remove(existing);
        }

        return Task.CompletedTask;
    }
}
