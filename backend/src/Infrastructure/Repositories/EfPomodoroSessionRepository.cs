using Microsoft.EntityFrameworkCore;
using Taskflow.Application.Common.Interfaces;
using Taskflow.Domain.Entities;
using Taskflow.Infrastructure.Persistence;

namespace Taskflow.Infrastructure.Repositories;

public sealed class EfPomodoroSessionRepository : IPomodoroSessionRepository
{
    private readonly AppDbContext _db;

    public EfPomodoroSessionRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<PomodoroSession>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _db.PomodoroSessions
            .AsNoTracking()
            .OrderByDescending(s => s.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<PomodoroSession?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _db.PomodoroSessions.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task AddAsync(PomodoroSession session, CancellationToken cancellationToken = default)
    {
        await _db.PomodoroSessions.AddAsync(session, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
