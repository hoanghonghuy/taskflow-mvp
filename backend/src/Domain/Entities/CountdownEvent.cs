namespace Taskflow.Domain.Entities;

public class CountdownEvent
{
    public Guid Id { get; private set; }
    public string Title { get; private set; } = null!;
    public DateTime TargetDate { get; private set; }
    public string Color { get; private set; } = "#3b82f6";
    public DateTime CreatedAt { get; private set; }
    public Guid UserId { get; private set; }

    private CountdownEvent() { }

    public static CountdownEvent Create(string title, DateTime targetDate, string? color = null)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Title must not be empty", nameof(title));
        if (targetDate <= DateTime.UtcNow.Date)
            throw new ArgumentOutOfRangeException(nameof(targetDate), "Target date must be in the future.");

        return new CountdownEvent
        {
            Id = Guid.NewGuid(),
            Title = title.Trim(),
            TargetDate = targetDate,
            Color = string.IsNullOrWhiteSpace(color) ? "#3b82f6" : color.Trim(),
            CreatedAt = DateTime.UtcNow,
        };
    }

    public void Update(string? title, DateTime? targetDate, string? color)
    {
        if (!string.IsNullOrWhiteSpace(title))
        {
            Title = title.Trim();
        }

        if (targetDate.HasValue && targetDate.Value > DateTime.UtcNow.Date)
        {
            TargetDate = targetDate.Value;
        }

        if (!string.IsNullOrWhiteSpace(color))
        {
            Color = color.Trim();
        }
    }

    public void AssignToUser(Guid userId)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("UserId must not be empty", nameof(userId));

        UserId = userId;
    }
}
