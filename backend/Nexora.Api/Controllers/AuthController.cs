using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexora.Application.Auth.Commands.Login;
using Nexora.Application.Auth.Commands.RefreshToken;
using Nexora.Application.Auth.Commands.Register;
using Nexora.Application.Common.Interfaces;

namespace Nexora.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly ISender _mediator;
    private readonly ICurrentUserService _currentUser;

    public AuthController(ISender mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    public record RegisterRequest(string OrganizationName, string FullName, string Email, string Password);
    public record LoginRequest(string Email, string Password);
    public record RefreshRequest(string RefreshToken);

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new RegisterCommand(request.OrganizationName, request.FullName, request.Email, request.Password), ct);
        return Ok(result);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new LoginCommand(request.Email, request.Password), ct);
        return Ok(result);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh(RefreshRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new RefreshTokenCommand(request.RefreshToken), ct);
        return Ok(result);
    }

    /// <summary>
    /// Returns the authenticated user's identity and permission list. The
    /// frontend uses this - not decoded JWT claims client-side - to decide
    /// which nav items/buttons to render. The backend still enforces every
    /// permission independently regardless of what this returns.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        return Ok(new
        {
            userId = _currentUser.UserId,
            email = _currentUser.Email,
            organizationId = _currentUser.OrganizationId,
            branchId = _currentUser.BranchId,
            permissions = _currentUser.Permissions,
        });
    }
}
