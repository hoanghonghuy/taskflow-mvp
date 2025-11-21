using Taskflow.Application.Common.Interfaces;
using Taskflow.Application.Lists.Models;
using Taskflow.Application.Lists.Services;
using Taskflow.Domain.Entities;

namespace Taskflow.Application.Tests.Lists;

public class TodoListServiceTests
{
    private sealed class InMemoryTodoListRepository : ITodoListRepository
    {
        private readonly List<TodoList> _lists = new();

        public Task<IReadOnlyList<TodoList>> GetAllAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<TodoList>>(_lists);

        public Task<TodoList?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.FromResult(_lists.FirstOrDefault(l => l.Id == id));

        public Task AddAsync(TodoList list, CancellationToken cancellationToken = default)
        {
            _lists.Add(list);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(TodoList list, CancellationToken cancellationToken = default)
        {
            var index = _lists.FindIndex(l => l.Id == list.Id);
            if (index >= 0)
            {
                _lists[index] = list;
            }
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var existing = _lists.FirstOrDefault(l => l.Id == id);
            if (existing is not null)
            {
                _lists.Remove(existing);
            }
            return Task.CompletedTask;
        }

        public IReadOnlyList<TodoList> Lists => _lists;
    }

    [Fact]
    public async Task CreateAsync_AssignsUserId()
    {
        var repo = new InMemoryTodoListRepository();
        var service = new TodoListService(repo);
        var userId = Guid.NewGuid();

        var dto = await service.CreateAsync(userId, new TodoListCreateRequest
        {
            Name = "Inbox",
            Color = "#fff"
        }, CancellationToken.None);

        Assert.Equal("Inbox", dto.Name);
        Assert.Single(repo.Lists);
        Assert.Equal(userId, repo.Lists[0].UserId);
    }

    [Fact]
    public async Task GetAllAsync_FiltersByUserId()
    {
        var repo = new InMemoryTodoListRepository();
        var service = new TodoListService(repo);

        var user1 = Guid.NewGuid();
        var user2 = Guid.NewGuid();

        var l1 = TodoList.Create("u1");
        l1.AssignToUser(user1);
        var l2 = TodoList.Create("u2");
        l2.AssignToUser(user2);

        await repo.AddAsync(l1, CancellationToken.None);
        await repo.AddAsync(l2, CancellationToken.None);

        var list1 = await service.GetAllAsync(user1, CancellationToken.None);
        var list2 = await service.GetAllAsync(user2, CancellationToken.None);

        Assert.Single(list1);
        Assert.Equal("u1", list1[0].Name);
        Assert.Single(list2);
        Assert.Equal("u2", list2[0].Name);
    }
}
