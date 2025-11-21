using Microsoft.EntityFrameworkCore;
using Taskflow.Application.Common.Interfaces;
using Taskflow.Domain.Entities;
using Taskflow.Infrastructure.Persistence;

namespace Taskflow.Infrastructure.Repositories;

public sealed class EfTodoTaskRepository : ITodoTaskRepository
{
    private readonly AppDbContext _db;

    public EfTodoTaskRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<TodoTask>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _db.Tasks.AsNoTracking().ToListAsync(cancellationToken);
    }

    public async Task<TodoTask?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _db.Tasks.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task AddAsync(TodoTask task, CancellationToken cancellationToken = default)
    {
        await _db.Tasks.AddAsync(task, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(TodoTask task, CancellationToken cancellationToken = default)
    {
        _db.Tasks.Update(task);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var existing = await _db.Tasks.FindAsync(new object[] { id }, cancellationToken);
        if (existing is null)
        {
            return;
        }

        _db.Tasks.Remove(existing);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
