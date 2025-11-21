using Taskflow.Domain.Entities;
using UserSettingsEntity = Taskflow.Domain.Entities.UserSettings;

namespace Taskflow.Application.Common.Interfaces;

public interface IUserSettingsRepository
{
    Task<UserSettingsEntity?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AddAsync(UserSettingsEntity settings, CancellationToken cancellationToken = default);
    Task UpdateAsync(UserSettingsEntity settings, CancellationToken cancellationToken = default);
}
