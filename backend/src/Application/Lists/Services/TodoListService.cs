using Taskflow.Application.Common.Interfaces;
using Taskflow.Application.Lists.Models;
using Taskflow.Domain.Entities;

namespace Taskflow.Application.Lists.Services;

public sealed class TodoListService : ITodoListService
{
    private readonly ITodoListRepository _repository;

    public TodoListService(ITodoListRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<TodoListDto>> GetAllAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var lists = await _repository.GetAllAsync(cancellationToken);
        return lists
            .Where(l => l.UserId == userId)
            .Select(MapToDto)
            .ToList();
    }

    public async Task<TodoListDto?> GetByIdAsync(Guid userId, Guid id, CancellationToken cancellationToken = default)
    {
        var list = await _repository.GetByIdAsync(id, cancellationToken);
        if (list is null || list.UserId != userId)
        {
            return null;
        }

        return MapToDto(list);
    }

    public async Task<TodoListDto> CreateAsync(Guid userId, TodoListCreateRequest request, CancellationToken cancellationToken = default)
    {
        var list = TodoList.Create(request.Name, request.Color);
        list.SetMembers(request.Members);

        list.AssignToUser(userId);

        await _repository.AddAsync(list, cancellationToken);
        return MapToDto(list);
    }

    public async Task<TodoListDto?> UpdateAsync(Guid userId, Guid id, TodoListUpdateRequest request, CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByIdAsync(id, cancellationToken);
        if (existing is null || existing.UserId != userId)
        {
            return null;
        }

        existing.UpdateBasicInfo(request.Name, request.Color);
        if (request.Members is not null)
        {
            existing.SetMembers(request.Members);
        }

        await _repository.UpdateAsync(existing, cancellationToken);
        return MapToDto(existing);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid id, CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByIdAsync(id, cancellationToken);
        if (existing is null || existing.UserId != userId)
        {
            return false;
        }

        await _repository.DeleteAsync(id, cancellationToken);
        return true;
    }

    private static TodoListDto MapToDto(TodoList list)
    {
        return new TodoListDto(
            list.Id,
            list.Name,
            list.Color,
            list.Members
        );
    }
}
