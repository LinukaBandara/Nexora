using Nexora.Application.Common.Interfaces;

namespace Nexora.UnitTests.TestDoubles;

public class FakeCurrentUserService : ICurrentUserService
{
    public Guid? UserId { get; set; }
    public string? Email { get; set; }
    public Guid? OrganizationId { get; set; }
    public Guid? BranchId { get; set; }
    public bool IsAuthenticated { get; set; } = true;
    public IReadOnlyCollection<string> Permissions { get; set; } = Array.Empty<string>();

    public bool HasPermission(string permissionCode) => Permissions.Contains(permissionCode);
}
