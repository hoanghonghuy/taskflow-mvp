using System.Text.Json;
using Taskflow.Application.Common.Interfaces;
using Taskflow.Application.UserSettings.Models;
using Taskflow.Application.Pomodoro.Models;
using UserSettingsEntity = Taskflow.Domain.Entities.UserSettings;

namespace Taskflow.Application.UserSettings.Services;

public sealed class UserSettingsService : IUserSettingsService
{
    private readonly IUserSettingsRepository _repository;

    public UserSettingsService(IUserSettingsRepository repository)
    {
        _repository = repository;
    }

    public async Task<UserSettingsDto> GetOrCreateAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var existingOrNull = await _repository.GetByUserIdAsync(userId, cancellationToken);
        UserSettingsEntity existing;

        if (existingOrNull is null)
        {
            existing = UserSettingsEntity.CreateDefault(userId);
            await _repository.AddAsync(existing, cancellationToken);
        }
        else
        {
            existing = existingOrNull;
        }

        return MapToDto(existing);
    }

    public async Task<UserSettingsDto> UpdateAsync(Guid userId, UserSettingsUpdateRequest request, CancellationToken cancellationToken = default)
    {
        var existingOrNull = await _repository.GetByUserIdAsync(userId, cancellationToken);
        UserSettingsEntity existing;

        if (existingOrNull is null)
        {
            existing = UserSettingsEntity.CreateDefault(userId);
            await _repository.AddAsync(existing, cancellationToken);
        }
        else
        {
            existing = existingOrNull;
        }

        existing.Update(
            request.Language,
            request.Theme,
            request.Notifications,
            request.SoundEnabled,
            request.AutoStartPomodoro,
            request.DefaultPriority,
            request.DefaultListId,
            request.BottomNavActions,
            request.GeminiApiKey);

        await _repository.UpdateAsync(existing, cancellationToken);

        return MapToDto(existing);
    }

    public async Task<PomodoroStateDto?> GetPomodoroStateAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByUserIdAsync(userId, cancellationToken);
        if (existing is null || string.IsNullOrWhiteSpace(existing.PomodoroStateJson))
        {
            return null;
        }

        try
        {
            var state = JsonSerializer.Deserialize<PomodoroStateDto>(existing.PomodoroStateJson!);
            if (state is null)
            {
                return null;
            }

            // If the timer was running when we last saved, adjust remaining time by elapsed
            // wall-clock seconds so the state resumes naturally after reload.
            if (existing.PomodoroStateUpdatedAt.HasValue && state.IsActive && !state.IsPaused)
            {
                var elapsedSeconds = (int)Math.Floor((DateTime.UtcNow - existing.PomodoroStateUpdatedAt.Value).TotalSeconds);
                if (elapsedSeconds > 0)
                {
                    var remaining = state.RemainingSeconds - elapsedSeconds;
                    if (remaining <= 0)
                    {
                        state.RemainingSeconds = 0;
                        state.IsActive = false;
                        state.IsPaused = false;
                    }
                    else
                    {
                        state.RemainingSeconds = remaining;
                    }
                }
            }

            return state;
        }
        catch
        {
            // If stored JSON is invalid, ignore and treat as no state.
            return null;
        }
    }

    public async Task<PomodoroStateDto> UpdatePomodoroStateAsync(Guid userId, PomodoroStateUpdateRequest request, CancellationToken cancellationToken = default)
    {
        var existingOrNull = await _repository.GetByUserIdAsync(userId, cancellationToken);
        UserSettingsEntity existing;

        if (existingOrNull is null)
        {
            existing = UserSettingsEntity.CreateDefault(userId);
            await _repository.AddAsync(existing, cancellationToken);
        }
        else
        {
            existing = existingOrNull;
        }

        var normalized = new PomodoroStateDto
        {
            IsActive = request.IsActive,
            IsPaused = request.IsPaused,
            RemainingSeconds = request.RemainingSeconds < 0 ? 0 : request.RemainingSeconds,
            CurrentSession = string.IsNullOrWhiteSpace(request.CurrentSession)
                ? "focus"
                : request.CurrentSession.Trim(),
            FocusedTaskId = string.IsNullOrWhiteSpace(request.FocusedTaskId) ? null : request.FocusedTaskId!.Trim(),
            FocusedHabitId = string.IsNullOrWhiteSpace(request.FocusedHabitId) ? null : request.FocusedHabitId!.Trim(),
            SessionsCompleted = request.SessionsCompleted < 0 ? 0 : request.SessionsCompleted,
        };

        var json = JsonSerializer.Serialize(normalized);
        existing.UpdatePomodoroState(json, DateTime.UtcNow);
        await _repository.UpdateAsync(existing, cancellationToken);

        return normalized;
    }

    private static UserSettingsDto MapToDto(UserSettingsEntity settings)
    {
        return new UserSettingsDto
        {
            Language = settings.Language,
            Theme = settings.Theme,
            Notifications = settings.Notifications,
            SoundEnabled = settings.SoundEnabled,
            AutoStartPomodoro = settings.AutoStartPomodoro,
            DefaultPriority = settings.DefaultPriority,
            DefaultListId = settings.DefaultListId,
            BottomNavActions = settings.BottomNavActions,
            GeminiApiKey = settings.GeminiApiKey,
        };
    }
}
