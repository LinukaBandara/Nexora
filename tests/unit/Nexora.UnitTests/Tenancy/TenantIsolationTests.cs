using FluentAssertions;
using Nexora.Domain.Identity;
using Nexora.UnitTests.TestDoubles;
using Xunit;

namespace Nexora.UnitTests.Tenancy;

/// <summary>
/// Verifies the global query filter in NexoraDbContext (see
/// Nexora.Infrastructure/Persistence/NexoraDbContext.cs) actually prevents
/// one organization's data from being visible while another organization's
/// tenant context is active. This is the single most important guarantee
/// in a multi-tenant system - see Phase 0 risk analysis, "tenant data
/// leakage" is rated Critical impact.
/// </summary>
public class TenantIsolationTests
{
    [Fact]
    public async Task Users_AreNotVisible_AcrossOrganizations()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var orgA = new Organization { Name = "Org A", Slug = "org-a" };
        var orgB = new Organization { Name = "Org B", Slug = "org-b" };
        db.Organizations.AddRange(orgA, orgB);

        db.Users.Add(new User { OrganizationId = orgA.Id, Email = "user@org-a.test", FullName = "A User", PasswordHash = "x" });
        db.Users.Add(new User { OrganizationId = orgB.Id, Email = "user@org-b.test", FullName = "B User", PasswordHash = "x" });
        await db.SaveChangesAsync();

        // Scope the tenant context to Org A, as TenantResolutionMiddleware would from the JWT.
        tenantContext.Set(orgA.Id, null);

        var visibleUsers = db.Users.ToList();

        visibleUsers.Should().ContainSingle();
        visibleUsers.Single().Email.Should().Be("user@org-a.test");
    }

    [Fact]
    public async Task SoftDeletedRecords_AreExcluded_EvenWithinTheSameTenant()
    {
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var org = new Organization { Name = "Org A", Slug = "org-a" };
        db.Organizations.Add(org);

        var branch = new Branch { OrganizationId = org.Id, Name = "Head Office", DeletedAt = DateTimeOffset.UtcNow };
        db.Branches.Add(branch);
        await db.SaveChangesAsync();

        tenantContext.Set(org.Id, null);

        db.Branches.ToList().Should().BeEmpty();
    }

    [Fact]
    public async Task WithoutResolvedTenantContext_QueryReturnsRecordsAcrossAllOrganizations()
    {
        // This is intentional and only reachable via explicit design: before
        // tenant resolution has run (e.g. during Login, which must find a
        // user by email alone), queries fall back to unscoped - but every
        // such call site uses .IgnoreQueryFilters() explicitly and
        // deliberately rather than relying on this implicit fallback, which
        // exists for authentication and platform-admin tooling only.
        var tenantContext = new FakeTenantContext();
        var currentUser = new FakeCurrentUserService();
        await using var db = TestDbContextFactory.Create(tenantContext, currentUser);

        var orgA = new Organization { Name = "Org A", Slug = "org-a" };
        var orgB = new Organization { Name = "Org B", Slug = "org-b" };
        db.Organizations.AddRange(orgA, orgB);
        db.Users.Add(new User { OrganizationId = orgA.Id, Email = "a@test.com", FullName = "A", PasswordHash = "x" });
        db.Users.Add(new User { OrganizationId = orgB.Id, Email = "b@test.com", FullName = "B", PasswordHash = "x" });
        await db.SaveChangesAsync();

        // tenantContext.IsResolved is still false here.
        db.Users.Count().Should().Be(2);
    }
}
