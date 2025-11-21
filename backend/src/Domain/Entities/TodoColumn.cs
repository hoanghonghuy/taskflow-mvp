namespace Taskflow.Domain.Entities;

public class TodoColumn
{
    public Guid Id { get; private set; }
    public Guid ListId { get; private set; }
    public string Name { get; private set; } = null!;
    public int Order { get; private set; }

    private TodoColumn() { }

    public static TodoColumn Create(Guid listId, string name, int order = 0)
    {
        if (listId == Guid.Empty)
            throw new ArgumentException("ListId must not be empty", nameof(listId));
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name must not be empty", nameof(name));

        return new TodoColumn
        {
            Id = Guid.NewGuid(),
            ListId = listId,
            Name = name.Trim(),
            Order = order,
        };
    }

    public void Rename(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name must not be empty", nameof(name));

        Name = name.Trim();
    }

    public void SetOrder(int order)
    {
        Order = order;
    }
}
