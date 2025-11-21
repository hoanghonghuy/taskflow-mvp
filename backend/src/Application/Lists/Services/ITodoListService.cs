using Taskflow.Application.Lists.Models;

namespace Taskflow.Application.Lists.Services;

public interface ITodoListService
{
    Task<IReadOnlyList<TodoListDto>> GetAllAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<TodoListDto?> GetByIdAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);
    Task<TodoListDto> CreateAsync(Guid userId, TodoListCreateRequest request, CancellationToken cancellationToken = default);
    Task<TodoListDto?> UpdateAsync(Guid userId, Guid id, TodoListUpdateRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);
}
