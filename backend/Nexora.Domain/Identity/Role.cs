using Nexora.Domain.Common;

namespace Nexora.Domain.Identity;

/// <summary>
/// Roles are per-organization (an org admin can define custom roles),
/// but every organization is seeded with the default set:
/// SuperAdmin, OrgAdmin, Manager, HRManager, FinanceManager,
/// InventoryManager, SalesManager, Employee.
/// </summary>
public class Role : TenantEntity
{
    public string Name { get; set; } = default!;
    public bool IsSystemRole { get; set; } // seeded defaults - not deletable

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

/// <summary>
/// Permissions are global (not per-tenant) - "inventory.read",
/// "sales.approve", etc. Organizations only choose which permissions
/// their custom roles are granted; they don't define new permission
/// strings themselves.
/// </summary>
public class Permission : BaseEntity
{
    /// <summary>e.g. "inventory.read", "sales.approve"</summary>
    public string Code { get; set; } = default!;
    public string Module { get; set; } = default!; // inventory, sales, finance, hr, ...
    public string Description { get; set; } = default!;

    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

public class UserRole : TenantEntity
{
    public Guid UserId { get; set; }
    public User? User { get; set; }

    public Guid RoleId { get; set; }
    public Role? Role { get; set; }
}

public class RolePermission : BaseEntity
{
    public Guid RoleId { get; set; }
    public Role? Role { get; set; }

    public Guid PermissionId { get; set; }
    public Permission? Permission { get; set; }
}
