using Taskflow.Application.Common.Interfaces;
using Taskflow.Application.Countdown.Models;
using Taskflow.Application.Countdown.Services;
using Taskflow.Domain.Entities;
using CountdownEventEntity = Taskflow.Domain.Entities.CountdownEvent;

namespace Taskflow.Application.Tests.Countdown;

public class CountdownEventServiceTests
{
    private sealed class InMemoryCountdownEventRepository : ICountdownEventRepository
    {
        private readonly List<CountdownEventEntity> _events = new();

        public Task<IReadOnlyList<CountdownEventEntity>> GetAllAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<CountdownEventEntity>>(_events);

        public Task<CountdownEventEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.FromResult(_events.FirstOrDefault(e => e.Id == id));

        public Task AddAsync(CountdownEventEntity evt, CancellationToken cancellationToken = default)
        {
            _events.Add(evt);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(CountdownEventEntity evt, CancellationToken cancellationToken = default)
        {
            var index = _events.FindIndex(e => e.Id == evt.Id);
            if (index >= 0)
            {
                _events[index] = evt;
            }
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var existing = _events.FirstOrDefault(e => e.Id == id);
            if (existing is not null)
            {
                _events.Remove(existing);
            }
            return Task.CompletedTask;
        }

        public IReadOnlyList<CountdownEventEntity> Events => _events;
    }

    [Fact]
    public async Task CreateAsync_AssignsUserId()
    {
        var repo = new InMemoryCountdownEventRepository();
        var service = new CountdownEventService(repo);
        var userId = Guid.NewGuid();

        var dto = await service.CreateAsync(userId, new CountdownEventCreateRequest
        {
            Title = "Release",
            TargetDate = DateTime.UtcNow.AddDays(10),
            Color = "#fff"
        }, CancellationToken.None);

        Assert.Equal("Release", dto.Title);
        Assert.Single(repo.Events);
        Assert.Equal(userId, repo.Events[0].UserId);
    }

    [Fact]
    public async Task GetAllAsync_FiltersByUserId()
    {
        var repo = new InMemoryCountdownEventRepository();
        var service = new CountdownEventService(repo);

        var user1 = Guid.NewGuid();
        var user2 = Guid.NewGuid();

        var e1 = CountdownEventEntity.Create("u1", DateTime.UtcNow.AddDays(5));
        e1.AssignToUser(user1);
        var e2 = CountdownEventEntity.Create("u2", DateTime.UtcNow.AddDays(6));
        e2.AssignToUser(user2);

        await repo.AddAsync(e1, CancellationToken.None);
        await repo.AddAsync(e2, CancellationToken.None);

        var list1 = await service.GetAllAsync(user1, CancellationToken.None);
        var list2 = await service.GetAllAsync(user2, CancellationToken.None);

        Assert.Single(list1);
        Assert.Equal("u1", list1[0].Title);
        Assert.Single(list2);
        Assert.Equal("u2", list2[0].Title);
    }
}
