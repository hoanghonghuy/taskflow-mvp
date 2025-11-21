using Taskflow.Domain.Entities;

namespace Taskflow.Application.Common.Interfaces;

public interface ITodoColumnRepository
{
    Task<IReadOnlyList<TodoColumn>> GetByListIdAsync(Guid listId, CancellationToken cancellationToken = default);
    Task<TodoColumn?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(TodoColumn column, CancellationToken cancellationToken = default);
    Task UpdateAsync(TodoColumn column, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
