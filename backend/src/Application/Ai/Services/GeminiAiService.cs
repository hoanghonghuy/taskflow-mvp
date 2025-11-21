using System.Net.Http.Json;
using System.Text.Json;
using Taskflow.Application.Ai.Models;

namespace Taskflow.Application.Ai.Services;

public sealed class GeminiAiService : IAiService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    private const string ModelName = "gemini-1.5-flash";

    public GeminiAiService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress ??= new Uri("https://generativelanguage.googleapis.com/");

        _apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY")
                 ?? string.Empty;
    }

    public async Task<string> GenerateBriefingAsync(string language, string context, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            throw new InvalidOperationException("Gemini API key is not configured.");
        }

        var prompt = BuildBriefingPrompt(language, context);
        return await GenerateTextAsync(prompt, cancellationToken).ConfigureAwait(false);
    }

    public async Task<AnalyzeTaskResult> AnalyzeTaskAsync(string language, string text, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            throw new InvalidOperationException("Gemini API key is not configured.");
        }

        var prompt = BuildAnalyzeTaskPrompt(language, text);
        var raw = await GenerateTextAsync(prompt, cancellationToken).ConfigureAwait(false);

        // Very lightweight parsing: expect a simple JSON object in the response fenced by ```json
        var json = ExtractJsonBlock(raw);
        if (json is null)
        {
            // Fallback: use first line as title
            return new AnalyzeTaskResult
            {
                Title = text.Trim().Length > 0 ? text.Trim() : "New task",
                Priority = "none",
                Tags = new List<string>()
            };
        }

        try
        {
            var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var result = new AnalyzeTaskResult();

            if (root.TryGetProperty("title", out var titleProp))
            {
                result.Title = titleProp.GetString() ?? string.Empty;
            }

            if (root.TryGetProperty("dueDate", out var dueProp))
            {
                var s = dueProp.GetString();
                if (DateTime.TryParse(s, out var dt))
                {
                    result.DueDate = dt;
                }
            }

            if (root.TryGetProperty("priority", out var prioProp))
            {
                result.Priority = prioProp.GetString() ?? "none";
            }

            if (root.TryGetProperty("tags", out var tagsProp) && tagsProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var t in tagsProp.EnumerateArray())
                {
                    var v = t.GetString();
                    if (!string.IsNullOrWhiteSpace(v))
                    {
                        result.Tags.Add(v);
                    }
                }
            }

            if (string.IsNullOrWhiteSpace(result.Title))
            {
                result.Title = text.Trim().Length > 0 ? text.Trim() : "New task";
            }

            return result;
        }
        catch
        {
            return new AnalyzeTaskResult
            {
                Title = text.Trim().Length > 0 ? text.Trim() : "New task",
                Priority = "none",
                Tags = new List<string>()
            };
        }
    }

    public async Task<string> ChatAsync(string language, IReadOnlyList<ChatMessageDto> messages, bool thinkingMode, bool searchGrounding, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            throw new InvalidOperationException("Gemini API key is not configured.");
        }

        var prompt = BuildChatPrompt(language, messages, thinkingMode, searchGrounding);
        return await GenerateTextAsync(prompt, cancellationToken).ConfigureAwait(false);
    }

    private async Task<string> GenerateTextAsync(string prompt, CancellationToken cancellationToken)
    {
        var request = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[] { new { text = prompt } }
                }
            }
        };

        using var response = await _httpClient.PostAsJsonAsync(
            $"v1beta/models/{ModelName}:generateContent?key={_apiKey}",
            request,
            cancellationToken).ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            throw new InvalidOperationException($"Gemini API call failed with status {(int)response.StatusCode}: {errorBody}");
        }

        var payload = await response.Content.ReadFromJsonAsync<GeminiGenerateContentResponse>(cancellationToken: cancellationToken).ConfigureAwait(false);
        var text = payload?.Candidates?
            .SelectMany(c => c.Content?.Parts ?? new List<GeminiPart>())
            .Select(p => p.Text)
            .FirstOrDefault(t => !string.IsNullOrWhiteSpace(t));

        return text ?? string.Empty;
    }

    private static string BuildBriefingPrompt(string language, string context)
    {
        var lang = string.IsNullOrWhiteSpace(language) ? "en" : language.ToLowerInvariant();

        return $@"You are an assistant helping a user plan their day based on their tasks, habits and focus sessions.

Language: {(lang.StartsWith("vi") ? "Vietnamese" : "English")}.

Context:
{context}

Write a short daily briefing in markdown (use headings and bullet lists), at most 250 words.";
    }

    private static string BuildAnalyzeTaskPrompt(string language, string text)
    {
        var lang = string.IsNullOrWhiteSpace(language) ? "en" : language.ToLowerInvariant();

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("You help users convert free-form text into a structured task.");
        sb.AppendLine();
        sb.AppendLine("User input:");
        sb.AppendLine(text);
        sb.AppendLine();
        sb.AppendLine("Respond ONLY with a single JSON object. The object must have these keys:");
        sb.AppendLine(@"- ""title"": string");
        sb.AppendLine(@"- ""dueDate"": string or null (ISO 8601 date)");
        sb.AppendLine(@"- ""priority"": one of: ""none"", ""low"", ""medium"", ""high"", ""urgent""");
        sb.AppendLine(@"- ""tags"": array of strings");
        sb.AppendLine();
        sb.Append("Use ");
        sb.Append(lang.StartsWith("vi") ? "Vietnamese" : "English");
        sb.AppendLine(" for values where applicable (except priority which must be one of the fixed literals).");
        sb.AppendLine("Do not include any extra commentary outside the JSON.");

        return sb.ToString();
    }

    private static string BuildChatPrompt(string language, IReadOnlyList<ChatMessageDto> messages, bool thinkingMode, bool searchGrounding)
    {
        var lang = string.IsNullOrWhiteSpace(language) ? "en" : language.ToLowerInvariant();

        var systemIntro = $"You are Taskflow's AI assistant, helping the user with productivity, tasks and planning. Answer in {(lang.StartsWith("vi") ? "Vietnamese" : "English")}.";

        if (thinkingMode)
        {
            systemIntro += " You may reason step by step, but keep the final answer concise.";
        }

        if (searchGrounding)
        {
            systemIntro += " You may mention that external information may be outdated and should be verified.";
        }

        var history = string.Join("\n\n", messages.Select(m => $"{(m.Role.Equals("user", StringComparison.OrdinalIgnoreCase) ? "User" : "Assistant")}: {m.Text}"));

        return systemIntro + "\n\nConversation so far:\n" + history + "\n\nAssistant:";
    }

    private static string? ExtractJsonBlock(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        var start = text.IndexOf("```json", StringComparison.OrdinalIgnoreCase);
        if (start >= 0)
        {
            start += "```json".Length;
            var end = text.IndexOf("```", start, StringComparison.OrdinalIgnoreCase);
            if (end > start)
            {
                return text.Substring(start, end - start).Trim();
            }
        }

        // Fallback: try to find first '{' and last '}'
        var firstBrace = text.IndexOf('{');
        var lastBrace = text.LastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace)
        {
            return text.Substring(firstBrace, lastBrace - firstBrace + 1);
        }

        return null;
    }

    private sealed class GeminiGenerateContentResponse
    {
        public List<GeminiCandidate> Candidates { get; set; } = new();
    }

    private sealed class GeminiCandidate
    {
        public GeminiContent? Content { get; set; }
    }

    private sealed class GeminiContent
    {
        public List<GeminiPart> Parts { get; set; } = new();
    }

    private sealed class GeminiPart
    {
        public string Text { get; set; } = string.Empty;
    }
}
