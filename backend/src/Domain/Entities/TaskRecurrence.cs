namespace Taskflow.Domain.Entities;

public class TaskRecurrence
{
    public string Type { get; set; } = "daily"; // daily | weekly | monthly
    public int Interval { get; set; } = 1;
    public List<int>? DaysOfWeek { get; set; }
    public DateTime? EndDate { get; set; }
}
