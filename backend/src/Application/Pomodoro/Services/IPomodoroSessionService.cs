using Taskflow.Application.Pomodoro.Models;

namespace Taskflow.Application.Pomodoro.Services;

public interface IPomodoroSessionService
{
    Task<IReadOnlyList<PomodoroSessionDto>> GetAllAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<PomodoroSessionDto?> GetByIdAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);
    Task<PomodoroSessionDto> CreateAsync(Guid userId, PomodoroSessionCreateRequest request, CancellationToken cancellationToken = default);
}
