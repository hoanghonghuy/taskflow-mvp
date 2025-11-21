using Microsoft.Extensions.Diagnostics.HealthChecks;
using Taskflow.Infrastructure.Persistence;

namespace Taskflow.WebApi;

public sealed class AppDbContextHealthCheck : IHealthCheck
{
    private readonly AppDbContext _db;

    public AppDbContextHealthCheck(AppDbContext db)
    {
        _db = db;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var canConnect = await _db.Database.CanConnectAsync(cancellationToken);
            return canConnect
                ? HealthCheckResult.Healthy()
                : HealthCheckResult.Unhealthy("Database connection check failed.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Database connection threw an exception.", ex);
        }
    }
}
