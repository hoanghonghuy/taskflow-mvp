using Taskflow.Domain.Entities;

namespace Taskflow.Application.Common.Interfaces;

public interface IPomodoroSessionRepository
{
    Task<IReadOnlyList<PomodoroSession>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<PomodoroSession?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(PomodoroSession session, CancellationToken cancellationToken = default);
}
