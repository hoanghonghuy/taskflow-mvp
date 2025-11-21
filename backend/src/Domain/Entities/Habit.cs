namespace Taskflow.Domain.Entities;

public class Habit
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = null!;
    public DateTime CreatedAt { get; private set; }
    public List<string> Completions { get; private set; } = new(); // yyyy-MM-dd
    public Guid UserId { get; private set; }

    private Habit() { }

    public static Habit Create(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name must not be empty", nameof(name));

        return new Habit
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            CreatedAt = DateTime.UtcNow,
        };
    }

    public void Rename(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name must not be empty", nameof(name));

        Name = name.Trim();
    }

    public void MarkCompletedOn(DateOnly date)
    {
        var key = date.ToString("yyyy-MM-dd");
        if (!Completions.Contains(key))
        {
            Completions.Add(key);
        }
    }

    public void UnmarkCompletedOn(DateOnly date)
    {
        var key = date.ToString("yyyy-MM-dd");
        Completions.Remove(key);
    }

    public void AssignToUser(Guid userId)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("UserId must not be empty", nameof(userId));

        UserId = userId;
    }
}
