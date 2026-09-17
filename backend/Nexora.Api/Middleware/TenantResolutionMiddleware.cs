using Nexora.Application.Common.Interfaces;

namespace Nexora.Api.Middleware;

/// <summary>
/// Runs once per request, right after authentication. Reads org_id/branch_id
/// from the validated JWT and sets them on the scoped ITenantContext, which
/// NexoraDbContext's global query filters then read for every single query
/// in the request. This is the one place tenant resolution happens - it is
/// not re-derived or re-checked by individual handlers.
/// Unauthenticated endpoints (login, register, health checks) simply have
/// no tenant context set; IsResolved stays false and query filters no-op
/// on the tenant clause (soft-delete filtering still applies).
/// </summary>
public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;

    public TenantResolutionMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var orgClaim = context.User.FindFirst("org_id")?.Value;
            var branchClaim = context.User.FindFirst("branch_id")?.Value;

            if (Guid.TryParse(orgClaim, out var orgId))
            {
                Guid? branchId = Guid.TryParse(branchClaim, out var b) ? b : null;
                tenantContext.Set(orgId, branchId);
            }
        }

        await _next(context);
    }
}

public static class TenantResolutionMiddlewareExtensions
{
    public static IApplicationBuilder UseTenantResolution(this IApplicationBuilder app) =>
        app.UseMiddleware<TenantResolutionMiddleware>();
}
