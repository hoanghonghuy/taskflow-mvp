using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Taskflow.Application.Users.Models;

namespace Taskflow.WebApi.Tests;

[CollectionDefinition("WebApi Integration", DisableParallelization = true)]
public class WebApiIntegrationCollection : ICollectionFixture<WebApiFactory>
{
}

public class WebApiFactory : WebApplicationFactory<Program>
{
}

[Collection("WebApi Integration")]
public class AuthAndTasksIntegrationTests
{
    private readonly WebApiFactory _factory;

    public AuthAndTasksIntegrationTests(WebApiFactory factory)
    {
        _factory = factory;
    }

    private static string UniqueEmail(string prefix) => $"{prefix}-{Guid.NewGuid():N}@example.com";

    [Fact]
    public async Task JwtLogin_ReturnsToken()
    {
        var client = _factory.CreateClient();

        var email = UniqueEmail("login");

        var registerResponse = await client.PostAsJsonAsync("/api/auth/register", new UserRegisterRequest
        {
            Name = "Test User",
            Email = email,
            Password = "P@ssw0rd!"
        });
        registerResponse.EnsureSuccessStatusCode();

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new UserLoginRequest
        {
            Email = email,
            Password = "P@ssw0rd!"
        });
        loginResponse.EnsureSuccessStatusCode();

        var loginJson = await loginResponse.Content.ReadFromJsonAsync<LoginResult>();
        Assert.NotNull(loginJson);
        Assert.False(string.IsNullOrWhiteSpace(loginJson!.Token));
    }

    [Fact]
    public async Task Tasks_WithToken_ReturnsUserTasks()
    {
        var client = _factory.CreateClient();

        var email = UniqueEmail("tasks");

        var registerResponse = await client.PostAsJsonAsync("/api/auth/register", new UserRegisterRequest
        {
            Name = "Task User",
            Email = email,
            Password = "P@ssw0rd!"
        });
        registerResponse.EnsureSuccessStatusCode();

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new UserLoginRequest
        {
            Email = email,
            Password = "P@ssw0rd!"
        });
        loginResponse.EnsureSuccessStatusCode();
        var loginJson = await loginResponse.Content.ReadFromJsonAsync<LoginResult>();
        Assert.NotNull(loginJson);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginJson!.Token);

        var createTaskResponse = await client.PostAsJsonAsync("/api/tasks", new
        {
            title = "My Task",
            description = "Desc"
        });
        createTaskResponse.EnsureSuccessStatusCode();

        var listResponse = await client.GetAsync("/api/tasks");
        listResponse.EnsureSuccessStatusCode();

        var tasks = await listResponse.Content.ReadFromJsonAsync<List<TodoTaskDtoLite>>();
        Assert.NotNull(tasks);
        Assert.Contains(tasks!, t => t.Title == "My Task");
    }

    [Fact]
    public async Task Tasks_WithoutToken_Returns401()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/tasks");

        Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private sealed record LoginResult(UserDto User, string Token);

    private sealed record UserDto(Guid Id, string Name, string Email);

    private sealed record TodoTaskDtoLite(Guid Id, string Title, string? Description, bool Completed,
        DateTime CreatedAt, DateTime? DueDate, string Priority, string ListId, IReadOnlyList<string> Tags);
}
