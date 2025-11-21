using Taskflow.Application.Columns.Models;

namespace Taskflow.Application.Columns.Services;

public interface ITodoColumnService
{
    Task<IReadOnlyList<TodoColumnDto>> GetByListIdAsync(Guid listId, CancellationToken cancellationToken = default);
    Task<TodoColumnDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TodoColumnDto> CreateAsync(TodoColumnCreateRequest request, CancellationToken cancellationToken = default);
    Task<TodoColumnDto?> UpdateAsync(Guid id, TodoColumnUpdateRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
