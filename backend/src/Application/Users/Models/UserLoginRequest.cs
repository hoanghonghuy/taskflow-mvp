namespace Taskflow.Application.Users.Models;

public sealed class UserLoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
