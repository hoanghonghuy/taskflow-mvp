using Microsoft.EntityFrameworkCore;
using Taskflow.Application.Common.Interfaces;
using Taskflow.Domain.Entities;
using Taskflow.Infrastructure.Persistence;

namespace Taskflow.Infrastructure.Repositories;

public sealed class EfHabitRepository : IHabitRepository
{
    private readonly AppDbContext _db;

    public EfHabitRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Habit>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _db.Habits
            .AsNoTracking()
            .OrderBy(h => h.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Habit?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _db.Habits.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task AddAsync(Habit habit, CancellationToken cancellationToken = default)
    {
        await _db.Habits.AddAsync(habit, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Habit habit, CancellationToken cancellationToken = default)
    {
        _db.Habits.Update(habit);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var existing = await _db.Habits.FindAsync(new object[] { id }, cancellationToken);
        if (existing is null)
        {
            return;
        }

        _db.Habits.Remove(existing);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
