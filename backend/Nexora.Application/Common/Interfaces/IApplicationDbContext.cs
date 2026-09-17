using Microsoft.EntityFrameworkCore;
using Nexora.Domain.Audit;
using Nexora.Domain.Finance;
using Nexora.Domain.Identity;
using Nexora.Domain.Inventory;
using Nexora.Domain.Notifications;
using Nexora.Domain.Purchasing;
using Nexora.Domain.Sales;
using Nexora.Domain.Sync;

namespace Nexora.Application.Common.Interfaces;

/// <summary>
/// The Application layer depends on this abstraction, not on EF Core or
/// Nexora.Infrastructure directly - keeps use-case handlers unit-testable
/// against an in-memory provider without pulling in Npgsql/Postgres.
/// </summary>
public interface IApplicationDbContext
{
    DbSet<Organization> Organizations { get; }
    DbSet<Branch> Branches { get; }
    DbSet<OrganizationSetting> OrganizationSettings { get; }
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Role> Roles { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<RolePermission> RolePermissions { get; }
    DbSet<AuditLog> AuditLogs { get; }

    DbSet<ProductCategory> ProductCategories { get; }
    DbSet<Unit> Units { get; }
    DbSet<Product> Products { get; }
    DbSet<Warehouse> Warehouses { get; }
    DbSet<WarehouseLocation> WarehouseLocations { get; }
    DbSet<InventoryItem> InventoryItems { get; }
    DbSet<StockMovement> StockMovements { get; }
    DbSet<StockAdjustment> StockAdjustments { get; }
    DbSet<StockTransfer> StockTransfers { get; }
    DbSet<StockTransferItem> StockTransferItems { get; }

    DbSet<Customer> Customers { get; }
    DbSet<CustomerAddress> CustomerAddresses { get; }
    DbSet<Quotation> Quotations { get; }
    DbSet<QuotationItem> QuotationItems { get; }
    DbSet<SalesOrder> SalesOrders { get; }
    DbSet<SalesOrderItem> SalesOrderItems { get; }
    DbSet<Invoice> Invoices { get; }
    DbSet<InvoiceItem> InvoiceItems { get; }
    DbSet<Payment> Payments { get; }

    DbSet<Supplier> Suppliers { get; }
    DbSet<PurchaseOrder> PurchaseOrders { get; }
    DbSet<PurchaseOrderItem> PurchaseOrderItems { get; }
    DbSet<GoodsReceipt> GoodsReceipts { get; }
    DbSet<GoodsReceiptItem> GoodsReceiptItems { get; }
    DbSet<SupplierInvoice> SupplierInvoices { get; }

    DbSet<Account> Accounts { get; }
    DbSet<Expense> Expenses { get; }
    DbSet<Income> Incomes { get; }

    DbSet<SyncOutboxEvent> SyncOutboxEvents { get; }
    DbSet<SyncInboxEvent> SyncInboxEvents { get; }
    DbSet<SyncConflict> SyncConflicts { get; }
    DbSet<SyncCheckpoint> SyncCheckpoints { get; }
    DbSet<NodeRegistration> NodeRegistrations { get; }

    DbSet<Notification> Notifications { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
