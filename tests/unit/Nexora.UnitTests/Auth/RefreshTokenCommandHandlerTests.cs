using FluentAssertions;
using Microsoft.Extensions.Options;
using Nexora.Application.Auth.Commands.RefreshToken;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Identity;
using Nexora.Infrastructure.Services;
using Nexora.UnitTests.TestDoubles;
using Xunit;

namespace Nexora.UnitTests.Auth;

public class RefreshTokenCommandHandlerTests
{
    private readonly IJwtTokenService _tokenService = new JwtTokenService(
        Options.Create(new JwtOptions { SigningKey = Convert.ToBase64String(new byte[32]) }));

    [Fact]
    public async Task Refresh_WithActiveToken_RotatesAndRevokesOldToken()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var org = new Organization { Name = "Acme", Slug = "acme" };
        db.Organizations.Add(org);

        var user = new User
        {
            OrganizationId = org.Id,
            Email = "owner@acme.test",
            FullName = "Owner",
            PasswordHash = "unused",
        };
        db.Users.Add(user);

        var (rawRefresh, hash) = _tokenService.CreateRefreshToken();
        var token = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = hash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(30),
        };
        db.RefreshTokens.Add(token);
        await db.SaveChangesAsync();

        var handler = new RefreshTokenCommandHandler(db, _tokenService);
        var result = await handler.Handle(new RefreshTokenCommand(rawRefresh), default);

        result.AccessToken.Should().NotBeNullOrWhiteSpace();
        result.RefreshToken.Should().NotBe(rawRefresh);
        token.RevokedAt.Should().NotBeNull();
        token.ReplacedByTokenId.Should().NotBeNull();

        var replacement = await db.RefreshTokens.FindAsync(token.ReplacedByTokenId);
        replacement.Should().NotBeNull();
        replacement!.RevokedAt.Should().BeNull();
    }

    [Fact]
    public async Task Refresh_ReusedRevokedToken_RevokesAllActiveSessions()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var org = new Organization { Name = "Acme", Slug = "acme" };
        db.Organizations.Add(org);
        var user = new User
        {
            OrganizationId = org.Id,
            Email = "owner@acme.test",
            FullName = "Owner",
            PasswordHash = "unused",
        };
        db.Users.Add(user);

        var (rawRefresh, hash) = _tokenService.CreateRefreshToken();
        var revoked = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = hash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(30),
            RevokedAt = DateTimeOffset.UtcNow.AddMinutes(-1),
        };
        var active = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = _tokenService.CreateRefreshToken().Hash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(30),
        };
        db.RefreshTokens.AddRange(revoked, active);
        await db.SaveChangesAsync();

        var handler = new RefreshTokenCommandHandler(db, _tokenService);
        var act = () => handler.Handle(new RefreshTokenCommand(rawRefresh), default);

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Refresh token reuse detected - all sessions revoked.");
        active.RevokedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Refresh_InactiveUser_RevokesTokenAndRejectsRefresh()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var org = new Organization { Name = "Acme", Slug = "acme" };
        db.Organizations.Add(org);
        var user = new User
        {
            OrganizationId = org.Id,
            Email = "owner@acme.test",
            FullName = "Owner",
            PasswordHash = "unused",
            IsActive = false,
        };
        db.Users.Add(user);

        var (rawRefresh, hash) = _tokenService.CreateRefreshToken();
        var token = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = hash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(30),
        };
        db.RefreshTokens.Add(token);
        await db.SaveChangesAsync();

        var handler = new RefreshTokenCommandHandler(db, _tokenService);
        var act = () => handler.Handle(new RefreshTokenCommand(rawRefresh), default);

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Refresh token is no longer valid.");
        token.RevokedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Refresh_LockedUser_RevokesTokenAndRejectsRefresh()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var org = new Organization { Name = "Acme", Slug = "acme" };
        db.Organizations.Add(org);
        var user = new User
        {
            OrganizationId = org.Id,
            Email = "owner@acme.test",
            FullName = "Owner",
            PasswordHash = "unused",
            LockoutEnd = DateTimeOffset.UtcNow.AddMinutes(10),
        };
        db.Users.Add(user);

        var (rawRefresh, hash) = _tokenService.CreateRefreshToken();
        var token = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = hash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(30),
        };
        db.RefreshTokens.Add(token);
        await db.SaveChangesAsync();

        var handler = new RefreshTokenCommandHandler(db, _tokenService);
        var act = () => handler.Handle(new RefreshTokenCommand(rawRefresh), default);

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Refresh token is no longer valid.");
        token.RevokedAt.Should().NotBeNull();
    }
}
