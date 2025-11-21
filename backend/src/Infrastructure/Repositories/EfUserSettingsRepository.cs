using Microsoft.EntityFrameworkCore;
using Taskflow.Application.Common.Interfaces;
using Taskflow.Domain.Entities;
using Taskflow.Infrastructure.Persistence;
using UserSettingsEntity = Taskflow.Domain.Entities.UserSettings;

namespace Taskflow.Infrastructure.Repositories;

public sealed class EfUserSettingsRepository : IUserSettingsRepository
{
    private readonly AppDbContext _db;

    public EfUserSettingsRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<UserSettingsEntity?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _db.UserSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);
    }

    public async Task AddAsync(UserSettingsEntity settings, CancellationToken cancellationToken = default)
    {
        await _db.UserSettings.AddAsync(settings, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(UserSettingsEntity settings, CancellationToken cancellationToken = default)
    {
        _db.UserSettings.Update(settings);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
