using Nexora.Application.Common.Interfaces;

namespace Nexora.Infrastructure.Services;

/// <summary>Registered as Scoped - one instance per request/operation.</summary>
public class TenantContext : ITenantContext
{
    public Guid OrganizationId { get; private set; }
    public Guid? BranchId { get; private set; }
    public bool IsResolved { get; private set; }

    public void Set(Guid organizationId, Guid? branchId)
    {
        OrganizationId = organizationId;
        BranchId = branchId;
        IsResolved = true;
    }
}
