using Taskflow.Application.Common.Interfaces;
using Taskflow.Application.Pomodoro.Models;
using Taskflow.Application.Pomodoro.Services;
using Taskflow.Domain.Entities;
using Xunit;

namespace Taskflow.Application.Tests.Pomodoro;

public class PomodoroSessionServiceTests
{
    private sealed class InMemoryPomodoroSessionRepository : IPomodoroSessionRepository
    {
        private readonly List<PomodoroSession> _sessions = new();

        public Task<IReadOnlyList<PomodoroSession>> GetAllAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<PomodoroSession>>(_sessions);

        public Task<PomodoroSession?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.FromResult(_sessions.FirstOrDefault(s => s.Id == id));

        public Task AddAsync(PomodoroSession session, CancellationToken cancellationToken = default)
        {
            _sessions.Add(session);
            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task CreateAsync_AddsSession()
    {
        var repo = new InMemoryPomodoroSessionRepository();
        var service = new PomodoroSessionService(repo);

        var userId = Guid.NewGuid();

        var request = new PomodoroSessionCreateRequest
        {
            DurationSeconds = 25 * 60,
            Type = "focus",
        };

        var created = await service.CreateAsync(userId, request, CancellationToken.None);

        Assert.NotEqual(Guid.Empty, created.Id);

        var all = await service.GetAllAsync(userId, CancellationToken.None);
        Assert.Single(all);
        Assert.Equal("focus", all[0].Type);
    }
}
