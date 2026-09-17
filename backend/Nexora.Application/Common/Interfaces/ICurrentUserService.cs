namespace Nexora.Application.Common.Interfaces;

/// <summary>
/// Who is making the current request. Implemented in Infrastructure by reading
/// JWT claims - Application code never touches HttpContext directly, which is
/// what keeps use-case handlers testable and host-agnostic (same handlers run
/// under Nexora.Api and Nexora.LocalNode.Api).
/// </summary>
public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    Guid? OrganizationId { get; }
    Guid? BranchId { get; }
    IReadOnlyCollection<string> Permissions { get; }
    bool IsAuthenticated { get; }
    bool HasPermission(string permissionCode);
}
