using Taskflow.Application.Habits.Models;

namespace Taskflow.Application.Habits.Services;

public interface IHabitService
{
    Task<IReadOnlyList<HabitDto>> GetAllAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<HabitDto?> GetByIdAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);
    Task<HabitDto> CreateAsync(Guid userId, HabitCreateRequest request, CancellationToken cancellationToken = default);
    Task<HabitDto?> UpdateAsync(Guid userId, Guid id, HabitUpdateRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);
    Task<bool> CompleteForDateAsync(Guid userId, Guid id, DateOnly date, CancellationToken cancellationToken = default);
    Task<bool> UncompleteForDateAsync(Guid userId, Guid id, DateOnly date, CancellationToken cancellationToken = default);
}
