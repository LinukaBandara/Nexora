using Microsoft.AspNetCore.Http;
using Nexora.Application.Common.Interfaces;

namespace Nexora.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private System.Security.Claims.ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public Guid? UserId =>
        Guid.TryParse(User?.FindFirst("sub")?.Value, out var id) ? id : null;

    public string? Email => User?.FindFirst("email")?.Value;

    public Guid? OrganizationId =>
        Guid.TryParse(User?.FindFirst("org_id")?.Value, out var id) ? id : null;

    public Guid? BranchId =>
        Guid.TryParse(User?.FindFirst("branch_id")?.Value, out var id) ? id : null;

    public IReadOnlyCollection<string> Permissions =>
        User?.FindAll("perm").Select(c => c.Value).ToList() ?? new List<string>();

    public bool HasPermission(string permissionCode) => Permissions.Contains(permissionCode);
}
