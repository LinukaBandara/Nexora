using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Identity;

namespace Nexora.Application.Auth.Commands.Login;

public record LoginCommand(string Email, string Password) : IRequest<LoginResult>;

public record LoginResult(Guid UserId, Guid OrganizationId, TokenPair Tokens);

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResult>
{
    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    private readonly IApplicationDbContext _db;
    private readonly IJwtTokenService _tokenService;
    private readonly IPasswordHasher _passwordHasher;

    public LoginCommandHandler(
        IApplicationDbContext db,
        IJwtTokenService tokenService,
        IPasswordHasher passwordHasher)
    {
        _db = db;
        _tokenService = tokenService;
        _passwordHasher = passwordHasher;
    }

    public async Task<LoginResult> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _db.Users
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);

        // Deliberately identical error for unknown, inactive, locked, and bad-password
        // accounts so authentication does not become a user-enumeration oracle.
        const string genericError = "Invalid email or password.";

        if (user is null)
            throw new UnauthorizedAccessException(genericError);

        if (user.IsLockedOut)
            throw new UnauthorizedAccessException(genericError);

        if (!user.IsActive)
            throw new UnauthorizedAccessException(genericError);

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            user.AccessFailedCount++;
            if (user.AccessFailedCount >= MaxFailedAttempts)
            {
                user.LockoutEnd = DateTimeOffset.UtcNow.Add(LockoutDuration);
                user.AccessFailedCount = 0;
            }

            await _db.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedAccessException(genericError);
        }

        user.AccessFailedCount = 0;
        user.LockoutEnd = null;
        user.LastLoginAt = DateTimeOffset.UtcNow;

        var permissionCodes = await _db.UserRoles
            .IgnoreQueryFilters()
            .Where(ur => ur.UserId == user.Id)
            .SelectMany(ur => ur.Role!.RolePermissions.Select(rp => rp.Permission!.Code))
            .Distinct()
            .ToListAsync(cancellationToken);

        var accessToken = _tokenService.CreateAccessToken(user, permissionCodes);
        var (rawRefresh, refreshHash) = _tokenService.CreateRefreshToken();

        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = refreshHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(30),
        });

        await _db.SaveChangesAsync(cancellationToken);

        return new LoginResult(
            user.Id,
            user.OrganizationId,
            new TokenPair(accessToken, rawRefresh, DateTimeOffset.UtcNow.AddMinutes(15)));
    }
}
