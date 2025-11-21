using Taskflow.Domain.Entities;

namespace Taskflow.Application.Common.Interfaces;

public interface ITodoTaskRepository
{
    Task<IReadOnlyList<TodoTask>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<TodoTask?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(TodoTask task, CancellationToken cancellationToken = default);
    Task UpdateAsync(TodoTask task, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
