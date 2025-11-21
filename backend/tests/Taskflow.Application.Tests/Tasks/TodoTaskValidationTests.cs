using Taskflow.Domain.Entities;

namespace Taskflow.Application.Tests.Tasks;

public class TodoTaskValidationTests
{
    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("   ")]
    public void Create_WithEmptyTitle_Throws(string title)
    {
        Assert.Throws<ArgumentException>(() => TodoTask.Create(title));
    }

    [Fact]
    public void Create_WithValidTitle_Succeeds()
    {
        var task = TodoTask.Create("Valid");

        Assert.Equal("Valid", task.Title);
        Assert.NotEqual(Guid.Empty, task.Id);
    }
}
