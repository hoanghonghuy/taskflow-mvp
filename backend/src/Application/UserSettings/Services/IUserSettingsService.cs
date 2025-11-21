using Taskflow.Application.UserSettings.Models;
using Taskflow.Application.Pomodoro.Models;

namespace Taskflow.Application.UserSettings.Services;

public interface IUserSettingsService
{
    Task<UserSettingsDto> GetOrCreateAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserSettingsDto> UpdateAsync(Guid userId, UserSettingsUpdateRequest request, CancellationToken cancellationToken = default);
    Task<PomodoroStateDto?> GetPomodoroStateAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<PomodoroStateDto> UpdatePomodoroStateAsync(Guid userId, PomodoroStateUpdateRequest request, CancellationToken cancellationToken = default);
}
