using Microsoft.AspNetCore.Authorization;

namespace Nexora.Api.Authorization;

public class PermissionRequirement : IAuthorizationRequirement
{
    public string PermissionCode { get; }
    public PermissionRequirement(string permissionCode) => PermissionCode = permissionCode;
}

/// <summary>
/// Checks the "perm" claims embedded in the access token at issuance time
/// (see JwtTokenService.CreateAccessToken). This is deliberately independent
/// of the frontend hiding buttons - even if a request reaches the API with
/// a valid token but missing this permission claim, it is rejected here,
/// not trusted because the UI wouldn't have shown the button.
/// </summary>
public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (context.User.HasClaim("perm", requirement.PermissionCode))
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}
