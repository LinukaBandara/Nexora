using Microsoft.EntityFrameworkCore;
using Nexora.Application.Common.Interfaces;
using Nexora.Domain.Audit;
using Nexora.Domain.Common;
using Nexora.Domain.Finance;
using Nexora.Domain.Identity;
using Nexora.Domain.Inventory;
using Nexora.Domain.Notifications;
using Nexora.Domain.Purchasing;
using Nexora.Domain.Sales;
using Nexora.Domain.Sync;
using Nexora.Infrastructure.Persistence.Interceptors;

namespace Nexora.Infrastructure.Persistence;

public class NexoraDbContext : DbContext, IApplicationDbContext
{
    private readonly ITenantContext _tenantContext;
    private readonly AuditableEntitySaveChangesInterceptor _auditInterceptor;
    private readonly SyncOutboxInterceptor _syncOutboxInterceptor;
    private readonly FinancialImmutabilityInterceptor _immutabilityInterceptor;

    public NexoraDbContext(
        DbContextOptions<NexoraDbContext> options,
        ITenantContext tenantContext,
        AuditableEntitySaveChangesInterceptor auditInterceptor,
        SyncOutboxInterceptor syncOutboxInterceptor,
        FinancialImmutabilityInterceptor immutabilityInterceptor) : base(options)
    {
        _tenantContext = tenantContext;
        _auditInterceptor = auditInterceptor;
        _syncOutboxInterceptor = syncOutboxInterceptor;
        _immutabilityInterceptor = immutabilityInterceptor;
    }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<OrganizationSetting> OrganizationSettings => Set<OrganizationSetting>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    public DbSet<ProductCategory> ProductCategories => Set<ProductCategory>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<WarehouseLocation> WarehouseLocations => Set<WarehouseLocation>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<StockAdjustment> StockAdjustments => Set<StockAdjustment>();
    public DbSet<StockTransfer> StockTransfers => Set<StockTransfer>();
    public DbSet<StockTransferItem> StockTransferItems => Set<StockTransferItem>();

    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<CustomerAddress> CustomerAddresses => Set<CustomerAddress>();
    public DbSet<Quotation> Quotations => Set<Quotation>();
    public DbSet<QuotationItem> QuotationItems => Set<QuotationItem>();
    public DbSet<SalesOrder> SalesOrders => Set<SalesOrder>();
    public DbSet<SalesOrderItem> SalesOrderItems => Set<SalesOrderItem>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<Payment> Payments => Set<Payment>();

    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<PurchaseOrderItem> PurchaseOrderItems => Set<PurchaseOrderItem>();
    public DbSet<GoodsReceipt> GoodsReceipts => Set<GoodsReceipt>();
    public DbSet<GoodsReceiptItem> GoodsReceiptItems => Set<GoodsReceiptItem>();
    public DbSet<SupplierInvoice> SupplierInvoices => Set<SupplierInvoice>();

    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Income> Incomes => Set<Income>();

    public DbSet<SyncOutboxEvent> SyncOutboxEvents => Set<SyncOutboxEvent>();
    public DbSet<SyncInboxEvent> SyncInboxEvents => Set<SyncInboxEvent>();
    public DbSet<SyncConflict> SyncConflicts => Set<SyncConflict>();
    public DbSet<SyncCheckpoint> SyncCheckpoints => Set<SyncCheckpoint>();
    public DbSet<NodeRegistration> NodeRegistrations => Set<NodeRegistration>();

    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(NexoraDbContext).Assembly);

        // Soft-delete filter for everything, plus a tenant filter for everything
        // deriving from TenantEntity. This is applied centrally, once, here -
        // not left to be remembered per-query. IgnoreQueryFilters() is used
        // explicitly and rarely (auth lookups pre-tenant-resolution, admin tooling).
        // Two separate generic helpers (constrained to TenantEntity vs BaseEntity)
        // are used instead of a single one with a runtime cast, because EF Core
        // cannot translate an (object) cast inside a query-filter expression to SQL.
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            var clrType = entityType.ClrType;
            if (!typeof(BaseEntity).IsAssignableFrom(clrType)) continue;

            var isTenantEntity = typeof(TenantEntity).IsAssignableFrom(clrType);
            var methodName = isTenantEntity
                ? nameof(BuildTenantFilter)
                : nameof(BuildSoftDeleteOnlyFilter);

            var method = typeof(NexoraDbContext)
                .GetMethod(methodName, System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static)!
                .MakeGenericMethod(clrType);

            var filter = method.Invoke(null, new object[] { _tenantContext });
            modelBuilder.Entity(clrType).HasQueryFilter((System.Linq.Expressions.LambdaExpression)filter!);
        }

        base.OnModelCreating(modelBuilder);
    }

    private static System.Linq.Expressions.Expression<Func<TEntity, bool>> BuildTenantFilter<TEntity>(ITenantContext tenantContext)
        where TEntity : TenantEntity
    {
        return e => e.DeletedAt == null &&
                     (!tenantContext.IsResolved || e.OrganizationId == tenantContext.OrganizationId);
    }

    private static System.Linq.Expressions.Expression<Func<TEntity, bool>> BuildSoftDeleteOnlyFilter<TEntity>(ITenantContext tenantContext)
        where TEntity : BaseEntity
    {
        return e => e.DeletedAt == null;
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.AddInterceptors(_immutabilityInterceptor, _auditInterceptor, _syncOutboxInterceptor);
    }
}
