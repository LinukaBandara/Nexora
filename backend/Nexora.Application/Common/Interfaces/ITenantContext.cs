namespace Nexora.Application.Common.Interfaces;

/// <summary>
/// Resolved once per request (see TenantResolutionMiddleware in Nexora.Api).
/// The DbContext reads this to apply the global tenant query filter, so
/// individual repository calls never need to remember to filter by
/// organization themselves - it is not optional and not per-handler.
/// </summary>
public interface ITenantContext
{
    Guid OrganizationId { get; }
    Guid? BranchId { get; }
    bool IsResolved { get; }
    void Set(Guid organizationId, Guid? branchId);
}
