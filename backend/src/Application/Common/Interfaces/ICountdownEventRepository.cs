using Taskflow.Domain.Entities;
using CountdownEventEntity = Taskflow.Domain.Entities.CountdownEvent;

namespace Taskflow.Application.Common.Interfaces;

public interface ICountdownEventRepository
{
    Task<IReadOnlyList<CountdownEventEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<CountdownEventEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(CountdownEventEntity evt, CancellationToken cancellationToken = default);
    Task UpdateAsync(CountdownEventEntity evt, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
