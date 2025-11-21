using System.Security.Cryptography;
using Taskflow.Application.Common.Interfaces;
using Taskflow.Application.Users.Models;
using Taskflow.Domain.Entities;

namespace Taskflow.Application.Users.Services;

public sealed class UserService : IUserService
{
    private readonly IUserRepository _repository;

    public UserService(IUserRepository repository)
    {
        _repository = repository;
    }

    public async Task<UserDto> RegisterAsync(UserRegisterRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required", nameof(request.Name));
        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Email is required", nameof(request.Email));
        if (string.IsNullOrWhiteSpace(request.Password))
            throw new ArgumentException("Password is required", nameof(request.Password));

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var existing = await _repository.GetByEmailAsync(normalizedEmail, cancellationToken);
        if (existing is not null)
        {
            throw new InvalidOperationException("Email is already registered.");
        }

        var hash = HashPassword(request.Password);
        var user = User.Create(request.Name, normalizedEmail, hash);

        await _repository.AddAsync(user, cancellationToken);

        return MapToDto(user);
    }

    public async Task<UserDto?> LoginAsync(UserLoginRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return null;
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var existing = await _repository.GetByEmailAsync(normalizedEmail, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        if (!VerifyPassword(existing.PasswordHash, request.Password))
        {
            return null;
        }

        return MapToDto(existing);
    }

    private static UserDto MapToDto(User user) => new(user.Id, user.Name, user.Email);

    private static string HashPassword(string password)
    {
        using var rng = RandomNumberGenerator.Create();
        var salt = new byte[16];
        rng.GetBytes(salt);

        const int iterations = 100_000;
        using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, iterations, HashAlgorithmName.SHA256);
        var hash = pbkdf2.GetBytes(32);

        var resultBytes = new byte[4 + salt.Length + hash.Length];
        BitConverter.GetBytes(iterations).CopyTo(resultBytes, 0);
        Buffer.BlockCopy(salt, 0, resultBytes, 4, salt.Length);
        Buffer.BlockCopy(hash, 0, resultBytes, 4 + salt.Length, hash.Length);

        return Convert.ToBase64String(resultBytes);
    }

    private static bool VerifyPassword(string storedHash, string password)
    {
        var bytes = Convert.FromBase64String(storedHash);
        var iterations = BitConverter.ToInt32(bytes, 0);

        const int saltLength = 16;
        var salt = new byte[saltLength];
        Buffer.BlockCopy(bytes, 4, salt, 0, saltLength);

        var hash = new byte[bytes.Length - 4 - saltLength];
        Buffer.BlockCopy(bytes, 4 + saltLength, hash, 0, hash.Length);

        using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, iterations, HashAlgorithmName.SHA256);
        var computed = pbkdf2.GetBytes(hash.Length);

        return CryptographicOperations.FixedTimeEquals(hash, computed);
    }
}
