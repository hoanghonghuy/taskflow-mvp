using Taskflow.Domain.Entities;

namespace Taskflow.Application.Common.Interfaces;

public interface IHabitRepository
{
    Task<IReadOnlyList<Habit>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Habit?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(Habit habit, CancellationToken cancellationToken = default);
    Task UpdateAsync(Habit habit, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
