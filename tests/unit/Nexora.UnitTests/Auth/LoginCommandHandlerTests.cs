using FluentAssertions;
using Microsoft.Extensions.Options;
using Nexora.Application.Auth.Commands.Login;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Identity;
using Nexora.Infrastructure.Services;
using Nexora.UnitTests.TestDoubles;
using Xunit;

namespace Nexora.UnitTests.Auth;

public class LoginCommandHandlerTests
{
    private readonly IPasswordHasher _hasher = new PasswordHasher();
    private readonly IJwtTokenService _tokenService = new JwtTokenService(
        Options.Create(new JwtOptions { SigningKey = Convert.ToBase64String(new byte[32]) }));

    [Fact]
    public async Task Login_WithCorrectPassword_Succeeds()
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
            PasswordHash = _hasher.Hash("CorrectHorseBatteryStaple1!"),
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var handler = new LoginCommandHandler(db, _tokenService, _hasher);
        var result = await handler.Handle(new LoginCommand("owner@acme.test", "CorrectHorseBatteryStaple1!"), default);

        result.UserId.Should().Be(user.Id);
        result.Tokens.AccessToken.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Login_AfterFiveFailedAttempts_LocksAccountOut()
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
            PasswordHash = _hasher.Hash("CorrectPassword1!"),
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var handler = new LoginCommandHandler(db, _tokenService, _hasher);

        // 5 wrong attempts trips the lockout (MaxFailedAttempts = 5).
        for (var i = 0; i < 5; i++)
        {
            var act = () => handler.Handle(new LoginCommand("owner@acme.test", "WrongPassword"), default);
            await act.Should().ThrowAsync<UnauthorizedAccessException>();
        }

        // Even the CORRECT password is now rejected because the account is locked.
        var lockedOutAttempt = () => handler.Handle(new LoginCommand("owner@acme.test", "CorrectPassword1!"), default);
        await lockedOutAttempt.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Invalid email or password.");
    }

    [Fact]
    public async Task Login_WithUnknownEmail_ThrowsGenericError_DoesNotRevealAccountExistence()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var handler = new LoginCommandHandler(db, _tokenService, _hasher);

        var act = () => handler.Handle(new LoginCommand("nobody@nowhere.test", "whatever"), default);

        (await act.Should().ThrowAsync<UnauthorizedAccessException>())
            .Which.Message.Should().Be("Invalid email or password.");
    }
}
