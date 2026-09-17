using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Security;
using Nexora.Domain.Identity;
using Nexora.Domain.Inventory;
using Nexora.Infrastructure.Persistence;

namespace Nexora.Api;

/// <summary>
/// Runs on Development startup only (see Program.cs). Seeds the global
/// permission catalog - required for the RegisterCommand's OrgAdmin role
/// to have anything to grant - plus a demo organization so the frontend
/// has something to log into locally. Never runs against Production;
/// see spec section 55 on demo data / credentials never being real ones.
/// </summary>
public static class DbSeeder
{
    /// <summary>
    /// Default role → permission-module mapping from spec section 10.
    /// Applied to every new organization at registration time is out of
    /// scope for this seeder (RegisterCommand only creates OrgAdmin) -
    /// this table is used by SeedDefaultRoleTemplatesAsync below to seed
    /// the *template* an org can clone roles from, and directly onto the
    /// demo organization for local development.
    /// </summary>
    private static readonly Dictionary<string, string[]> DefaultRoleModules = new()
    {
        ["Manager"] = new[] { "inventory", "sales", "purchasing", "finance", "hr", "analytics" },
        ["HR Manager"] = new[] { "hr" },
        ["Finance Manager"] = new[] { "finance" },
        ["Inventory Manager"] = new[] { "inventory" },
        ["Sales Manager"] = new[] { "sales" },
        ["Employee"] = Array.Empty<string>(), // read-only base role; specific reads granted below
    };

    public static async Task SeedAsync(NexoraDbContext db)
    {
        await SeedPermissionsAsync(db);
        var demoOrgId = await SeedDemoOrganizationAsync(db);
        await SeedDemoInventoryLookupsAsync(db, demoOrgId);
    }

    /// <summary>
    /// Public on its own because a local node needs this half without the
    /// other half - RBAC permission checks need the permissions table
    /// populated locally too, but a demo organization only makes sense
    /// once, centrally, in the cloud. See Nexora.LocalNode.Api/Program.cs.
    /// </summary>
    public static async Task SeedPermissionsAsync(NexoraDbContext db)
    {
        var existingCodes = await db.Permissions.IgnoreQueryFilters()
            .Select(p => p.Code).ToListAsync();

        var missing = Permissions.All()
            .Where(p => !existingCodes.Contains(p.Code))
            .Select(p => new Permission { Code = p.Code, Module = p.Module, Description = p.Description });

        db.Permissions.AddRange(missing);
        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Seeds one demo organization with the full default role set from
    /// spec section 10 (Manager, HR Manager, Finance Manager, Inventory
    /// Manager, Sales Manager, Employee - Super Admin and Org Admin are
    /// created directly by RegisterCommand/platform bootstrap instead).
    /// Idempotent: safe to run on every Development startup.
    /// </summary>
    private static async Task<Guid> SeedDemoOrganizationAsync(NexoraDbContext db)
    {
        var demoOrg = await db.Organizations.IgnoreQueryFilters()
            .FirstOrDefaultAsync(o => o.Slug == "demo");

        if (demoOrg is null)
        {
            demoOrg = new Organization { Name = "Demo Organization", Slug = "demo", PlanTier = "business" };
            db.Organizations.Add(demoOrg);

            db.Branches.Add(new Branch
            {
                OrganizationId = demoOrg.Id,
                Name = "Head Office",
                IsHeadOffice = true,
            });

            await db.SaveChangesAsync();
        }

        var allPermissions = await db.Permissions.IgnoreQueryFilters().ToListAsync();
        var existingRoleNames = await db.Roles.IgnoreQueryFilters()
            .Where(r => r.OrganizationId == demoOrg.Id)
            .Select(r => r.Name)
            .ToListAsync();

        foreach (var (roleName, modules) in DefaultRoleModules)
        {
            if (existingRoleNames.Contains(roleName)) continue;

            var role = new Role
            {
                OrganizationId = demoOrg.Id,
                Name = roleName,
                IsSystemRole = true,
            };
            db.Roles.Add(role);

            // "Employee" gets read-only access across every module; managers
            // get full access (read/create/update/approve as applicable)
            // within their own module(s) - matches the granular permission
            // examples in spec section 10.
            var grantedPermissions = modules.Length == 0
                ? allPermissions.Where(p => p.Code.EndsWith(".read"))
                : allPermissions.Where(p => modules.Contains(p.Module));

            foreach (var permission in grantedPermissions)
            {
                db.RolePermissions.Add(new RolePermission
                {
                    RoleId = role.Id,
                    PermissionId = permission.Id,
                });
            }
        }

        await db.SaveChangesAsync();
        return demoOrg.Id;
    }

    /// <summary>
    /// Seeds a "General" product category and a handful of common units
    /// (pcs, kg, box, litre) for the demo organization, so the Inventory
    /// module has somewhere to point CreateProductCommand's required
    /// CategoryId/UnitId without the frontend needing a "manage lookups"
    /// screen to exist yet. Idempotent.
    /// </summary>
    private static async Task SeedDemoInventoryLookupsAsync(NexoraDbContext db, Guid organizationId)
    {
        var hasCategory = await db.ProductCategories.IgnoreQueryFilters()
            .AnyAsync(c => c.OrganizationId == organizationId);

        if (!hasCategory)
        {
            db.ProductCategories.Add(new ProductCategory { OrganizationId = organizationId, Name = "General" });
        }

        var hasUnits = await db.Units.IgnoreQueryFilters()
            .AnyAsync(u => u.OrganizationId == organizationId);

        if (!hasUnits)
        {
            db.Units.AddRange(
                new Unit { OrganizationId = organizationId, Name = "Pieces", Abbreviation = "pcs" },
                new Unit { OrganizationId = organizationId, Name = "Kilogram", Abbreviation = "kg" },
                new Unit { OrganizationId = organizationId, Name = "Litre", Abbreviation = "l" },
                new Unit { OrganizationId = organizationId, Name = "Box", Abbreviation = "box" });
        }

        await db.SaveChangesAsync();
    }
}
