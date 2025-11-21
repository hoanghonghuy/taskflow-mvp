using Taskflow.Application.Tasks.Models;

namespace Taskflow.Application.Tasks.Services;

public interface ITodoTaskService
{
    Task<IReadOnlyList<TodoTaskDto>> GetAllAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<TodoTaskDto?> GetByIdAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);
    Task<TodoTaskDto> CreateAsync(Guid userId, TodoTaskCreateRequest request, CancellationToken cancellationToken = default);
    Task<TodoTaskDto?> UpdateAsync(Guid userId, Guid id, TodoTaskUpdateRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);
}
