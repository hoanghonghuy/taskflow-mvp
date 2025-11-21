using Microsoft.EntityFrameworkCore;
using Taskflow.Application.Common.Interfaces;
using Taskflow.Domain.Entities;
using Taskflow.Infrastructure.Persistence;
using CountdownEventEntity = Taskflow.Domain.Entities.CountdownEvent;

namespace Taskflow.Infrastructure.Repositories;

public sealed class EfCountdownEventRepository : ICountdownEventRepository
{
    private readonly AppDbContext _db;

    public EfCountdownEventRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<CountdownEventEntity>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _db.CountdownEvents
            .AsNoTracking()
            .OrderBy(e => e.TargetDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<CountdownEventEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _db.CountdownEvents.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task AddAsync(CountdownEventEntity evt, CancellationToken cancellationToken = default)
    {
        await _db.CountdownEvents.AddAsync(evt, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(CountdownEventEntity evt, CancellationToken cancellationToken = default)
    {
        _db.CountdownEvents.Update(evt);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var existing = await _db.CountdownEvents.FindAsync(new object[] { id }, cancellationToken);
        if (existing is null)
        {
            return;
        }

        _db.CountdownEvents.Remove(existing);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
