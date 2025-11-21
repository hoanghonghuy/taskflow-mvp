using Taskflow.Application.Ai.Models;

namespace Taskflow.Application.Ai.Services;

public interface IAiService
{
    Task<string> GenerateBriefingAsync(string language, string context, CancellationToken cancellationToken = default);
    Task<AnalyzeTaskResult> AnalyzeTaskAsync(string language, string text, CancellationToken cancellationToken = default);
    Task<string> ChatAsync(string language, IReadOnlyList<ChatMessageDto> messages, bool thinkingMode, bool searchGrounding, CancellationToken cancellationToken = default);
}
