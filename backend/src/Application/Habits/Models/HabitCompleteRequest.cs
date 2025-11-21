namespace Taskflow.Application.Habits.Models;

public sealed class HabitCompleteRequest
{
    // yyyy-MM-dd, optional: nếu null thì dùng today (UTC hoặc local tuỳ quyết định trong service)
    public string? Date { get; set; }
}
