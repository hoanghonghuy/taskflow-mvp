using Microsoft.EntityFrameworkCore;
using Taskflow.Application.Common.Interfaces;
using Taskflow.Domain.Entities;
using Taskflow.Infrastructure.Persistence;

namespace Taskflow.Infrastructure.Repositories;

public sealed class EfTodoListRepository : ITodoListRepository
{
    private readonly AppDbContext _db;

    public EfTodoListRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<TodoList>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _db.Lists.AsNoTracking().ToListAsync(cancellationToken);
    }

    public async Task<TodoList?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _db.Lists.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task AddAsync(TodoList list, CancellationToken cancellationToken = default)
    {
        await _db.Lists.AddAsync(list, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(TodoList list, CancellationToken cancellationToken = default)
    {
        _db.Lists.Update(list);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var existing = await _db.Lists.FindAsync(new object[] { id }, cancellationToken);
        if (existing is null)
        {
            return;
        }

        _db.Lists.Remove(existing);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
