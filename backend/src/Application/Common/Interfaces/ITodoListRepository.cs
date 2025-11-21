using Taskflow.Domain.Entities;

namespace Taskflow.Application.Common.Interfaces;

public interface ITodoListRepository
{
    Task<IReadOnlyList<TodoList>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<TodoList?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(TodoList list, CancellationToken cancellationToken = default);
    Task UpdateAsync(TodoList list, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
