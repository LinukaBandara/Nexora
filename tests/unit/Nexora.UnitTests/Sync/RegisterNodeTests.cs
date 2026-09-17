using FluentAssertions;
using Nexora.Application.Sync.Commands.RegisterNode;
using Nexora.Domain.Identity;
using Nexora.Infrastructure.Services;
using Nexora.UnitTests.TestDoubles;
using Xunit;

namespace Nexora.UnitTests.Sync;

public class RegisterNodeTests
{
    [Fact]
    public async Task RegisterNode_ReturnsRawSecret_ButOnlyPersistsItsHash()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var org = new Organization { Name = "Acme", Slug = "acme" };
        db.Organizations.Add(org);
        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);
        currentUser.OrganizationId = org.Id;

        var hasher = new PasswordHasher();
        var handler = new RegisterNodeCommandHandler(db, currentUser, hasher);

        var result = await handler.Handle(new RegisterNodeCommand("Colombo Branch"), default);

        result.NodeSecret.Should().NotBeNullOrWhiteSpace();

        var stored = db.NodeRegistrations.Single();
        stored.NodeSecretHash.Should().NotBe(result.NodeSecret); // never stored raw
        hasher.Verify(result.NodeSecret, stored.NodeSecretHash).Should().BeTrue();
    }

    [Fact]
    public async Task RegisterNode_WithDuplicateName_Throws()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var org = new Organization { Name = "Acme", Slug = "acme" };
        db.Organizations.Add(org);
        await db.SaveChangesAsync();
        tenantContext.Set(org.Id, null);
        currentUser.OrganizationId = org.Id;

        var hasher = new PasswordHasher();
        var handler = new RegisterNodeCommandHandler(db, currentUser, hasher);

        await handler.Handle(new RegisterNodeCommand("Colombo Branch"), default);

        var act = () => handler.Handle(new RegisterNodeCommand("Colombo Branch"), default);
        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*already registered*");
    }
}
