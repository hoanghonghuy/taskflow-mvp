using Taskflow.Application.Users.Models;

namespace Taskflow.Application.Users.Services;

public interface IUserService
{
    Task<UserDto> RegisterAsync(UserRegisterRequest request, CancellationToken cancellationToken = default);
    Task<UserDto?> LoginAsync(UserLoginRequest request, CancellationToken cancellationToken = default);
}
