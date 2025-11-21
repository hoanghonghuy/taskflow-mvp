using Taskflow.Application.Common.Interfaces;
using Taskflow.Application.Pomodoro.Models;
using Taskflow.Domain.Entities;

namespace Taskflow.Application.Pomodoro.Services;

public sealed class PomodoroSessionService : IPomodoroSessionService
{
    private readonly IPomodoroSessionRepository _repository;

    public PomodoroSessionService(IPomodoroSessionRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<PomodoroSessionDto>> GetAllAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var sessions = await _repository.GetAllAsync(cancellationToken);
        return sessions
            .Where(s => s.UserId == userId)
            .Select(MapToDto)
            .ToList();
    }

    public async Task<PomodoroSessionDto?> GetByIdAsync(Guid userId, Guid id, CancellationToken cancellationToken = default)
    {
        var session = await _repository.GetByIdAsync(id, cancellationToken);
        if (session is null || session.UserId != userId)
        {
            return null;
        }

        return MapToDto(session);
    }

    public async Task<PomodoroSessionDto> CreateAsync(Guid userId, PomodoroSessionCreateRequest request, CancellationToken cancellationToken = default)
    {
        var session = PomodoroSession.Create(
            request.StartTime == default ? DateTime.UtcNow : request.StartTime,
            request.DurationSeconds,
            request.Type,
            request.TaskId,
            request.HabitId
        );

        session.AssignToUser(userId);

        await _repository.AddAsync(session, cancellationToken);
        return MapToDto(session);
    }

    private static PomodoroSessionDto MapToDto(PomodoroSession s)
    {
        return new PomodoroSessionDto(
            s.Id,
            s.StartTime,
            s.DurationSeconds,
            s.Type,
            s.TaskId,
            s.HabitId
        );
    }
}
