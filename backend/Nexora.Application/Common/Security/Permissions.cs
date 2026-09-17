namespace Nexora.Application.Common.Security;

/// <summary>
/// Single source of truth for permission codes. Referenced by [HasPermission("...")]
/// on controllers, by role-seeding, and by the frontend's permission-driven UI
/// (exposed via /api/v1/auth/me). Add new module permissions here, not as
/// ad-hoc strings scattered through handlers.
/// </summary>
public static class Permissions
{
    public static class Inventory
    {
        public const string Read = "inventory.read";
        public const string Create = "inventory.create";
        public const string Update = "inventory.update";
        public const string Delete = "inventory.delete";
        public const string Adjust = "inventory.adjust";
    }

    public static class Sales
    {
        public const string Read = "sales.read";
        public const string Create = "sales.create";
        public const string Approve = "sales.approve";
    }

    public static class Purchasing
    {
        public const string Read = "purchasing.read";
        public const string Create = "purchasing.create";
        public const string Approve = "purchasing.approve";
    }

    public static class Finance
    {
        public const string Read = "finance.read";
        public const string Create = "finance.create";
        public const string Approve = "finance.approve";
    }

    public static class Employees
    {
        public const string Read = "employees.read";
        public const string Create = "employees.create";
        public const string Update = "employees.update";
    }

    public static class Analytics
    {
        public const string View = "analytics.view";
    }

    public static class System
    {
        public const string ManageUsers = "system.users.manage";
        public const string ManageRoles = "system.roles.manage";
        public const string ViewAuditLogs = "system.audit.view";
        public const string ManageOrganization = "system.organization.manage";
        public const string ViewSyncCenter = "system.sync.view";
    }

    /// <summary>All codes, used by the database seeder to populate the permissions table.</summary>
    public static IEnumerable<(string Code, string Module, string Description)> All()
    {
        yield return (Inventory.Read, "inventory", "View inventory, products and stock levels");
        yield return (Inventory.Create, "inventory", "Create products and warehouses");
        yield return (Inventory.Update, "inventory", "Edit products and warehouses");
        yield return (Inventory.Delete, "inventory", "Delete products and warehouses");
        yield return (Inventory.Adjust, "inventory", "Record stock adjustments");

        yield return (Sales.Read, "sales", "View customers, orders and invoices");
        yield return (Sales.Create, "sales", "Create quotations, orders and invoices");
        yield return (Sales.Approve, "sales", "Approve sales orders");

        yield return (Purchasing.Read, "purchasing", "View suppliers and purchase orders");
        yield return (Purchasing.Create, "purchasing", "Create purchase orders");
        yield return (Purchasing.Approve, "purchasing", "Approve purchase orders");

        yield return (Finance.Read, "finance", "View financial transactions and reports");
        yield return (Finance.Create, "finance", "Record income and expenses");
        yield return (Finance.Approve, "finance", "Approve payments");

        yield return (Employees.Read, "hr", "View employee records");
        yield return (Employees.Create, "hr", "Create employee records");
        yield return (Employees.Update, "hr", "Edit employee records");

        yield return (System.ManageUsers, "system", "Invite/manage users");
        yield return (System.ManageRoles, "system", "Manage roles and permissions");
        yield return (System.ViewAuditLogs, "system", "View audit logs");
        yield return (System.ManageOrganization, "system", "Manage organization settings");
        yield return (Analytics.View, "analytics", "View dashboards and analytics across modules");

        yield return (System.ViewSyncCenter, "system", "View the Sync Center");
    }
}
