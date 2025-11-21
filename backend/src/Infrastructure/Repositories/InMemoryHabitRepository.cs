using Taskflow.Application.Common.Interfaces;
using Taskflow.Domain.Entities;

namespace Taskflow.Infrastructure.Repositories;

public sealed class InMemoryHabitRepository : IHabitRepository
{
    private readonly List<Habit> _habits = new();

    public Task<IReadOnlyList<Habit>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IReadOnlyList<Habit>>(_habits);
    }

    public Task<Habit?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var habit = _habits.FirstOrDefault(h => h.Id == id);
        return Task.FromResult(habit);
    }

    public Task AddAsync(Habit habit, CancellationToken cancellationToken = default)
    {
        _habits.Add(habit);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(Habit habit, CancellationToken cancellationToken = default)
    {
        var index = _habits.FindIndex(h => h.Id == habit.Id);
        if (index >= 0)
        {
            _habits[index] = habit;
        }

        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var existing = _habits.FirstOrDefault(h => h.Id == id);
        if (existing is not null)
        {
            _habits.Remove(existing);
        }

        return Task.CompletedTask;
    }
}
