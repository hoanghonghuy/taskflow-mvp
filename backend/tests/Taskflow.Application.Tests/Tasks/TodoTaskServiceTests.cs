using Taskflow.Application.Common.Interfaces;
using Taskflow.Application.Tasks.Models;
using Taskflow.Application.Tasks.Services;
using Taskflow.Domain.Entities;

namespace Taskflow.Application.Tests.Tasks;

public class TodoTaskServiceTests
{
    private sealed class InMemoryTodoTaskRepository : ITodoTaskRepository
    {
        private readonly List<TodoTask> _tasks = new();

        public Task<IReadOnlyList<TodoTask>> GetAllAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<TodoTask>>(_tasks);

        public Task<TodoTask?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.FromResult(_tasks.FirstOrDefault(t => t.Id == id));

        public Task AddAsync(TodoTask task, CancellationToken cancellationToken = default)
        {
            _tasks.Add(task);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(TodoTask task, CancellationToken cancellationToken = default)
        {
            var index = _tasks.FindIndex(t => t.Id == task.Id);
            if (index >= 0)
            {
                _tasks[index] = task;
            }
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var existing = _tasks.FirstOrDefault(t => t.Id == id);
            if (existing is not null)
            {
                _tasks.Remove(existing);
            }
            return Task.CompletedTask;
        }

        public IReadOnlyList<TodoTask> Tasks => _tasks;
    }

    [Fact]
    public async Task CreateAsync_AssignsUserId()
    {
        var repo = new InMemoryTodoTaskRepository();
        var service = new TodoTaskService(repo);
        var userId = Guid.NewGuid();

        var dto = await service.CreateAsync(userId, new TodoTaskCreateRequest
        {
            Title = "Test task",
            Description = "desc",
        }, CancellationToken.None);

        Assert.Equal("Test task", dto.Title);
        Assert.Single(repo.Tasks);
        Assert.Equal(userId, repo.Tasks[0].UserId);
    }

    [Fact]
    public async Task GetAllAsync_FiltersByUserId()
    {
        var repo = new InMemoryTodoTaskRepository();
        var service = new TodoTaskService(repo);

        var user1 = Guid.NewGuid();
        var user2 = Guid.NewGuid();

        var t1 = TodoTask.Create("u1");
        t1.AssignToUser(user1);
        var t2 = TodoTask.Create("u2");
        t2.AssignToUser(user2);

        await repo.AddAsync(t1, CancellationToken.None);
        await repo.AddAsync(t2, CancellationToken.None);

        var list1 = await service.GetAllAsync(user1, CancellationToken.None);
        var list2 = await service.GetAllAsync(user2, CancellationToken.None);

        Assert.Single(list1);
        Assert.Equal("u1", list1[0].Title);
        Assert.Single(list2);
        Assert.Equal("u2", list2[0].Title);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsNull_WhenUserDoesNotOwnTask()
    {
        var repo = new InMemoryTodoTaskRepository();
        var service = new TodoTaskService(repo);

        var owner = Guid.NewGuid();
        var other = Guid.NewGuid();

        var t = TodoTask.Create("title");
        t.AssignToUser(owner);
        await repo.AddAsync(t, CancellationToken.None);

        var result = await service.UpdateAsync(other, t.Id, new TodoTaskUpdateRequest
        {
            Title = "new"
        }, CancellationToken.None);

        Assert.Null(result);
    }
}
