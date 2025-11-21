using Taskflow.Application.Habits.Models;
using Taskflow.Application.Habits.Services;
using Taskflow.Infrastructure.Repositories;
using Xunit;

namespace Taskflow.Application.Tests.Habits;

public class HabitServiceTests
{
    [Fact]
    public async Task CompleteForDate_AddsDateToCompletions()
    {
        var repo = new InMemoryHabitRepository();
        var service = new HabitService(repo);

        var userId = Guid.NewGuid();

        var created = await service.CreateAsync(userId, new HabitCreateRequest { Name = "Test" }, CancellationToken.None);

        var date = new DateOnly(2024, 1, 1);
        var ok = await service.CompleteForDateAsync(userId, created.Id, date, CancellationToken.None);

        Assert.True(ok);

        var reloaded = await service.GetByIdAsync(userId, created.Id, CancellationToken.None);
        Assert.NotNull(reloaded);
        Assert.Contains("2024-01-01", reloaded!.Completions);
    }
}
