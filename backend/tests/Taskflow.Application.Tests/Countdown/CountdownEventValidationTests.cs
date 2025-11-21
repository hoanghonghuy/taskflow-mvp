using Taskflow.Domain.Entities;
using CountdownEventEntity = Taskflow.Domain.Entities.CountdownEvent;

namespace Taskflow.Application.Tests.Countdown;

public class CountdownEventValidationTests
{
    [Fact]
    public void Create_WithPastTargetDate_Throws()
    {
        var pastDate = DateTime.UtcNow.Date.AddDays(-1);

        Assert.Throws<ArgumentOutOfRangeException>(() =>
            CountdownEventEntity.Create("Past", pastDate));
    }

    [Fact]
    public void Create_WithValidFutureDate_Succeeds()
    {
        var futureDate = DateTime.UtcNow.Date.AddDays(5);

        var evt = CountdownEventEntity.Create("Future", futureDate);

        Assert.Equal("Future", evt.Title);
        Assert.Equal(futureDate, evt.TargetDate);
    }
}
