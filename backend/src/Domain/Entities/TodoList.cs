namespace Taskflow.Domain.Entities;

public class TodoList
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = null!;
    public string Color { get; private set; } = "#3b82f6";
    public List<string> Members { get; private set; } = new();
    public Guid UserId { get; private set; }

    private TodoList() { }

    public static TodoList Create(string name, string? color = null)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Name must not be empty", nameof(name));
        }

        return new TodoList
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            Color = string.IsNullOrWhiteSpace(color) ? "#3b82f6" : color
        };
    }

    public void UpdateBasicInfo(string? name, string? color)
    {
        if (!string.IsNullOrWhiteSpace(name))
        {
            Name = name.Trim();
        }

        if (!string.IsNullOrWhiteSpace(color))
        {
            Color = color;
        }
    }

    public void AssignToUser(Guid userId)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("UserId must not be empty", nameof(userId));

        UserId = userId;
    }

    public void SetMembers(IEnumerable<string>? members)
    {
        Members = members?.Where(m => !string.IsNullOrWhiteSpace(m)).Select(m => m.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList() ?? new List<string>();
    }

    public void AddMember(string memberId)
    {
        if (string.IsNullOrWhiteSpace(memberId))
        {
            return;
        }

        if (!Members.Contains(memberId, StringComparer.OrdinalIgnoreCase))
        {
            Members.Add(memberId.Trim());
        }
    }

    public void RemoveMember(string memberId)
    {
        if (string.IsNullOrWhiteSpace(memberId))
        {
            return;
        }

        Members = Members.Where(m => !string.Equals(m, memberId, StringComparison.OrdinalIgnoreCase)).ToList();
    }
}
