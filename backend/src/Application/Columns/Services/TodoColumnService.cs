using Taskflow.Application.Columns.Models;
using Taskflow.Application.Common.Interfaces;
using Taskflow.Domain.Entities;

namespace Taskflow.Application.Columns.Services;

public sealed class TodoColumnService : ITodoColumnService
{
    private readonly ITodoColumnRepository _repository;

    public TodoColumnService(ITodoColumnRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<TodoColumnDto>> GetByListIdAsync(Guid listId, CancellationToken cancellationToken = default)
    {
        var columns = await _repository.GetByListIdAsync(listId, cancellationToken);
        return columns.Select(MapToDto).ToList();
    }

    public async Task<TodoColumnDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var column = await _repository.GetByIdAsync(id, cancellationToken);
        return column is null ? null : MapToDto(column);
    }

    public async Task<TodoColumnDto> CreateAsync(TodoColumnCreateRequest request, CancellationToken cancellationToken = default)
    {
        var column = TodoColumn.Create(request.ListId, request.Name, request.Order);
        await _repository.AddAsync(column, cancellationToken);
        return MapToDto(column);
    }

    public async Task<TodoColumnDto?> UpdateAsync(Guid id, TodoColumnUpdateRequest request, CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByIdAsync(id, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            existing.Rename(request.Name);
        }

        if (request.Order.HasValue)
        {
            existing.SetOrder(request.Order.Value);
        }

        await _repository.UpdateAsync(existing, cancellationToken);
        return MapToDto(existing);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByIdAsync(id, cancellationToken);
        if (existing is null)
        {
            return false;
        }

        await _repository.DeleteAsync(id, cancellationToken);
        return true;
    }

    private static TodoColumnDto MapToDto(TodoColumn column)
    {
        return new TodoColumnDto(
            column.Id,
            column.ListId,
            column.Name,
            column.Order
        );
    }
}
