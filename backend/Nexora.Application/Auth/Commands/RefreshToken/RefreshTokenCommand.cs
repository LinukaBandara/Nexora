using MediatR;
using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Identity;

namespace Nexora.Application.Auth.Commands.RefreshToken;

public record RefreshTokenCommand(string RefreshToken) : IRequest<TokenPair>;

/// <summary>
/// Rotates refresh tokens on every use (the old one is revoked and linked to
/// its replacement). If a revoked token is presented again, every active
/// token for that user is revoked - it's a strong signal the old token leaked.
/// </summary>
public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, TokenPair>
{
    private readonly IApplicationDbContext _db;
    private readonly IJwtTokenService _tokenService;

    public RefreshTokenCommandHandler(IApplicationDbContext db, IJwtTokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    public async Task<TokenPair> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var incomingHash = _tokenService.Hash(request.RefreshToken);

        var existing = await _db.RefreshTokens
            .IgnoreQueryFilters()
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.TokenHash == incomingHash, cancellationToken);

        if (existing is null)
            throw new UnauthorizedAccessException("Invalid refresh token.");

        if (existing.RevokedAt is not null)
        {
            // Reuse of a revoked token: assume compromise, kill the whole session family.
            var allActiveForUser = await _db.RefreshTokens
                .IgnoreQueryFilters()
                .Where(rt => rt.UserId == existing.UserId && rt.RevokedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var token in allActiveForUser)
                token.RevokedAt = DateTimeOffset.UtcNow;

            await _db.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedAccessException("Refresh token reuse detected - all sessions revoked.");
        }

        if (existing.ExpiresAt <= DateTimeOffset.UtcNow)
            throw new UnauthorizedAccessException("Refresh token expired.");

        var user = existing.User!;

        // A deactivated account must not be able to mint a fresh access token
        // from a refresh token that was issued before deactivation.
        if (!user.IsActive || user.IsLockedOut)
        {
            existing.RevokedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedAccessException("Refresh token is no longer valid.");
        }

        var permissionCodes = await _db.UserRoles
            .IgnoreQueryFilters()
            .Where(ur => ur.UserId == user.Id)
            .SelectMany(ur => ur.Role!.RolePermissions.Select(rp => rp.Permission!.Code))
            .Distinct()
            .ToListAsync(cancellationToken);

        var newAccessToken = _tokenService.CreateAccessToken(user, permissionCodes);
        var (rawRefresh, refreshHash) = _tokenService.CreateRefreshToken();

        var replacement = new Domain.Identity.RefreshToken
        {
            UserId = user.Id,
            TokenHash = refreshHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(30),
        };
        _db.RefreshTokens.Add(replacement);

        existing.RevokedAt = DateTimeOffset.UtcNow;
        existing.ReplacedByTokenId = replacement.Id;

        await _db.SaveChangesAsync(cancellationToken);

        return new TokenPair(newAccessToken, rawRefresh, DateTimeOffset.UtcNow.AddMinutes(15));
    }
}
