using Nexora.Application.Common.Interfaces;

namespace Nexora.UnitTests.TestDoubles;

public class FakeTenantContext : ITenantContext
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

    public void Reset() => IsResolved = false;
}
