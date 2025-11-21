using Microsoft.EntityFrameworkCore;
using Taskflow.Application.Common.Interfaces;
using Taskflow.Domain.Entities;
using Taskflow.Infrastructure.Persistence;

namespace Taskflow.Infrastructure.Repositories;

public sealed class EfTodoColumnRepository : ITodoColumnRepository
{
    private readonly AppDbContext _db;

    public EfTodoColumnRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<TodoColumn>> GetByListIdAsync(Guid listId, CancellationToken cancellationToken = default)
    {
        return await _db.Columns
            .AsNoTracking()
            .Where(c => c.ListId == listId)
            .OrderBy(c => c.Order)
            .ToListAsync(cancellationToken);
    }

    public async Task<TodoColumn?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _db.Columns.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task AddAsync(TodoColumn column, CancellationToken cancellationToken = default)
    {
        await _db.Columns.AddAsync(column, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(TodoColumn column, CancellationToken cancellationToken = default)
    {
        _db.Columns.Update(column);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var existing = await _db.Columns.FindAsync(new object[] { id }, cancellationToken);
        if (existing is null)
        {
            return;
        }

        _db.Columns.Remove(existing);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
