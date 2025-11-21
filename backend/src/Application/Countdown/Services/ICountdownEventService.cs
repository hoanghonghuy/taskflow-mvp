using Taskflow.Application.Countdown.Models;

namespace Taskflow.Application.Countdown.Services;

public interface ICountdownEventService
{
    Task<IReadOnlyList<CountdownEventDto>> GetAllAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<CountdownEventDto?> GetByIdAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);
    Task<CountdownEventDto> CreateAsync(Guid userId, CountdownEventCreateRequest request, CancellationToken cancellationToken = default);
    Task<CountdownEventDto?> UpdateAsync(Guid userId, Guid id, CountdownEventUpdateRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);
}
