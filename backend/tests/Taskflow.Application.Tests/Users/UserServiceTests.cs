using Taskflow.Application.Common.Interfaces;
using Taskflow.Application.Users.Models;
using Taskflow.Application.Users.Services;
using Taskflow.Domain.Entities;

namespace Taskflow.Application.Tests.Users;

public class UserServiceTests
{
    private sealed class InMemoryUserRepository : IUserRepository
    {
        private readonly List<User> _users = new();

        public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.FromResult(_users.FirstOrDefault(u => u.Id == id));

        public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
            => Task.FromResult(_users.FirstOrDefault(u => u.Email == email));

        public Task AddAsync(User user, CancellationToken cancellationToken = default)
        {
            _users.Add(user);
            return Task.CompletedTask;
        }

        public IReadOnlyList<User> Users => _users;
    }

    [Fact]
    public async Task RegisterAsync_WithValidRequest_CreatesUser()
    {
        var repo = new InMemoryUserRepository();
        var service = new UserService(repo);

        var request = new UserRegisterRequest
        {
            Name = "Alice",
            Email = "alice@example.com",
            Password = "password123"
        };

        var result = await service.RegisterAsync(request, CancellationToken.None);

        Assert.Equal("Alice", result.Name);
        Assert.Equal("alice@example.com", result.Email);
        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Single(repo.Users);
        Assert.NotEqual("password123", repo.Users[0].PasswordHash);
    }

    [Fact]
    public async Task RegisterAsync_WithDuplicateEmail_Throws()
    {
        var repo = new InMemoryUserRepository();
        var existing = User.Create("Bob", "bob@example.com", "hash");
        await repo.AddAsync(existing, CancellationToken.None);

        var service = new UserService(repo);

        var request = new UserRegisterRequest
        {
            Name = "Other Bob",
            Email = "BOB@example.com",
            Password = "secret"
        };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.RegisterAsync(request, CancellationToken.None));
    }

    [Fact]
    public async Task LoginAsync_WithCorrectCredentials_ReturnsUser()
    {
        var repo = new InMemoryUserRepository();
        var service = new UserService(repo);

        var registerRequest = new UserRegisterRequest
        {
            Name = "Carol",
            Email = "carol@example.com",
            Password = "P@ssw0rd!"
        };

        var registered = await service.RegisterAsync(registerRequest, CancellationToken.None);

        var login = await service.LoginAsync(new UserLoginRequest
        {
            Email = "carol@example.com",
            Password = "P@ssw0rd!"
        }, CancellationToken.None);

        Assert.NotNull(login);
        Assert.Equal(registered.Id, login!.Id);
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_ReturnsNull()
    {
        var repo = new InMemoryUserRepository();
        var service = new UserService(repo);

        var registerRequest = new UserRegisterRequest
        {
            Name = "Dave",
            Email = "dave@example.com",
            Password = "correct"
        };

        await service.RegisterAsync(registerRequest, CancellationToken.None);

        var login = await service.LoginAsync(new UserLoginRequest
        {
            Email = "dave@example.com",
            Password = "wrong"
        }, CancellationToken.None);

        Assert.Null(login);
    }

    [Fact]
    public async Task LoginAsync_WithUnknownEmail_ReturnsNull()
    {
        var repo = new InMemoryUserRepository();
        var service = new UserService(repo);

        var login = await service.LoginAsync(new UserLoginRequest
        {
            Email = "unknown@example.com",
            Password = "anything"
        }, CancellationToken.None);

        Assert.Null(login);
    }
}
