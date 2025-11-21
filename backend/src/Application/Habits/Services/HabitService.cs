using Taskflow.Application.Common.Interfaces;
using Taskflow.Application.Habits.Models;
using Taskflow.Domain.Entities;

namespace Taskflow.Application.Habits.Services;

public sealed class HabitService : IHabitService
{
    private readonly IHabitRepository _repository;

    public HabitService(IHabitRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<HabitDto>> GetAllAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var habits = await _repository.GetAllAsync(cancellationToken);
        return habits
            .Where(h => h.UserId == userId)
            .Select(MapToDto)
            .ToList();
    }

    public async Task<HabitDto?> GetByIdAsync(Guid userId, Guid id, CancellationToken cancellationToken = default)
    {
        var habit = await _repository.GetByIdAsync(id, cancellationToken);
        if (habit is null || habit.UserId != userId)
        {
            return null;
        }

        return MapToDto(habit);
    }

    public async Task<HabitDto> CreateAsync(Guid userId, HabitCreateRequest request, CancellationToken cancellationToken = default)
    {
        var habit = Habit.Create(request.Name);
        habit.AssignToUser(userId);
        await _repository.AddAsync(habit, cancellationToken);
        return MapToDto(habit);
    }

    public async Task<HabitDto?> UpdateAsync(Guid userId, Guid id, HabitUpdateRequest request, CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByIdAsync(id, cancellationToken);
        if (existing is null || existing.UserId != userId)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            existing.Rename(request.Name);
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

    public async Task<bool> CompleteForDateAsync(Guid userId, Guid id, DateOnly date, CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByIdAsync(id, cancellationToken);
        if (existing is null || existing.UserId != userId)
        {
            return false;
        }

        existing.MarkCompletedOn(date);
        await _repository.UpdateAsync(existing, cancellationToken);
        return true;
    }

    public async Task<bool> UncompleteForDateAsync(Guid userId, Guid id, DateOnly date, CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByIdAsync(id, cancellationToken);
        if (existing is null || existing.UserId != userId)
        {
            return false;
        }

        existing.UnmarkCompletedOn(date);
        await _repository.UpdateAsync(existing, cancellationToken);
        return true;
    }

    private static HabitDto MapToDto(Habit habit)
    {
        return new HabitDto(
            habit.Id,
            habit.Name,
            habit.CreatedAt,
            habit.Completions
        );
    }
}
