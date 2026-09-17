using Microsoft.AspNetCore.Authorization;

namespace Nexora.Api.Authorization;

/// <summary>
/// Usage: [HasPermission(Permissions.Inventory.Create)] on a controller action.
/// Each distinct permission code gets its own dynamically-registered policy
/// (see Program.cs AddPolicy loop over Permissions.All()) so this stays a
/// one-line attribute rather than requiring a policy name string to be kept
/// in sync separately.
/// </summary>
public class HasPermissionAttribute : AuthorizeAttribute
{
    public HasPermissionAttribute(string permissionCode) : base(policy: permissionCode) { }
}
