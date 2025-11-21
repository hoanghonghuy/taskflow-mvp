using Taskflow.Application.Common.Interfaces;
using Taskflow.Application.Countdown.Models;
using Taskflow.Domain.Entities;
using CountdownEventEntity = Taskflow.Domain.Entities.CountdownEvent;

namespace Taskflow.Application.Countdown.Services;

public sealed class CountdownEventService : ICountdownEventService
{
    private readonly ICountdownEventRepository _repository;

    public CountdownEventService(ICountdownEventRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<CountdownEventDto>> GetAllAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var events = await _repository.GetAllAsync(cancellationToken);
        return events
            .Where(e => e.UserId == userId)
            .Select(MapToDto)
            .ToList();
    }

    public async Task<CountdownEventDto?> GetByIdAsync(Guid userId, Guid id, CancellationToken cancellationToken = default)
    {
        var evt = await _repository.GetByIdAsync(id, cancellationToken);
        if (evt is null || evt.UserId != userId)
        {
            return null;
        }

        return MapToDto(evt);
    }

    public async Task<CountdownEventDto> CreateAsync(Guid userId, CountdownEventCreateRequest request, CancellationToken cancellationToken = default)
    {
        var evt = CountdownEventEntity.Create(request.Title, request.TargetDate, request.Color);
        evt.AssignToUser(userId);
        await _repository.AddAsync(evt, cancellationToken);
        return MapToDto(evt);
    }

    public async Task<CountdownEventDto?> UpdateAsync(Guid userId, Guid id, CountdownEventUpdateRequest request, CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByIdAsync(id, cancellationToken);
        if (existing is null || existing.UserId != userId)
        {
            return null;
        }

        existing.Update(request.Title, request.TargetDate, request.Color);
        await _repository.UpdateAsync(existing, cancellationToken);
        return MapToDto(existing);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid id, CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByIdAsync(id, cancellationToken);
        if (existing is null || existing.UserId != userId)
        {
            return false;
        }

        await _repository.DeleteAsync(id, cancellationToken);
        return true;
    }

    private static CountdownEventDto MapToDto(CountdownEventEntity evt)
    {
        return new CountdownEventDto(
            evt.Id,
            evt.Title,
            evt.TargetDate,
            evt.Color,
            evt.CreatedAt
        );
    }
}
