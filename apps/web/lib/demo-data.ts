export const DEMO_USER = {
  userId: "demo-user",
  email: "demo@nexora.local",
  organizationId: "demo-org",
  branchId: "demo-branch",
  permissions: [
    "Dashboard.View",
    "Inventory.View",
    "Inventory.Manage",
    "Sales.View",
    "Sales.Manage",
    "Sales.Approve",
    "Purchasing.View",
    "Purchasing.Manage",
    "Purchasing.Approve",
    "Finance.View",
    "Notifications.View",
    "Sync.View",
  ],
};

const products = [
  { id: "p1", sku: "NX-001", name: "Premium Fertilizer 25kg", categoryName: "Agriculture", unitAbbreviation: "bag", sellingPrice: 12500, totalOnHand: 42, reorderLevel: 20, isLowStock: false },
  { id: "p2", sku: "NX-002", name: "Organic Soil Mix", categoryName: "Agriculture", unitAbbreviation: "bag", sellingPrice: 4200, totalOnHand: 18, reorderLevel: 25, isLowStock: true },
  { id: "p3", sku: "NX-003", name: "Crop Protection Kit", categoryName: "Crop Care", unitAbbreviation: "kit", sellingPrice: 7800, totalOnHand: 31, reorderLevel: 15, isLowStock: false },
  { id: "p4", sku: "NX-004", name: "Premium Seed Pack", categoryName: "Seeds", unitAbbreviation: "pack", sellingPrice: 1850, totalOnHand: 9, reorderLevel: 20, isLowStock: true },
  { id: "p5", sku: "NX-005", name: "Irrigation Connector", categoryName: "Equipment", unitAbbreviation: "pcs", sellingPrice: 950, totalOnHand: 76, reorderLevel: 30, isLowStock: false },
];

const customers = [
  { id: "c1", name: "Balangoda Agro Centre", email: "accounts@balagro.example", phone: "+94 71 555 0101", isActive: true },
  { id: "c2", name: "Sabaragamuwa Farmers Co-op", email: "finance@sfc.example", phone: "+94 77 555 0102", isActive: true },
  { id: "c3", name: "Green Valley Holdings", email: "hello@greenvalley.example", phone: "+94 76 555 0103", isActive: true },
];

const suppliers = [
  { id: "s1", name: "Ceylon Agri Supply", email: "sales@cas.example", phone: "+94 71 555 0201", isActive: true },
  { id: "s2", name: "Island Equipment Traders", email: "orders@iet.example", phone: "+94 77 555 0202", isActive: true },
  { id: "s3", name: "Greenfield Distribution", email: "ops@gfd.example", phone: "+94 76 555 0203", isActive: true },
];

const salesOrders = [
  { id: "so1", number: "SO-2026-0018", customerName: "Balangoda Agro Centre", status: "Approved", orderDate: "2026-09-17", total: 186500 },
  { id: "so2", number: "SO-2026-0019", customerName: "Sabaragamuwa Farmers Co-op", status: "PendingApproval", orderDate: "2026-09-17", total: 94200 },
  { id: "so3", number: "SO-2026-0020", customerName: "Green Valley Holdings", status: "Invoiced", orderDate: "2026-09-16", total: 127800 },
];

const purchaseOrders = [
  { id: "po1", number: "PO-2026-0012", supplierName: "Ceylon Agri Supply", status: "Approved", orderDate: "2026-09-16", total: 215000 },
  { id: "po2", number: "PO-2026-0013", supplierName: "Island Equipment Traders", status: "PendingApproval", orderDate: "2026-09-17", total: 88400 },
];

export function demoResponse(path: string[], search: string, method: string) {
  const key = path.join("/");
  const params = new URLSearchParams(search);

  if (key === "auth/me" && method === "GET") return DEMO_USER;

  if (key === "analytics/dashboard" && method === "GET") {
    const revenueTrend = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(Date.now() - (13 - index) * 86400000).toISOString().slice(0, 10);
      return { date, revenue: 65000 + ((index * 17321) % 90000) };
    });
    return {
      revenue: 1487200,
      orderCount: 86,
      inventoryValue: 4265800,
      outstandingReceivables: 684300,
      revenueTrend,
      topProducts: products.slice(0, 4).map((p, i) => ({ name: p.name, quantitySold: 58 - i * 9, revenue: 312000 - i * 41000 })),
      lowStockAlerts: products.filter((p) => p.isLowStock).map(({ productName, ...rest }) => ({ productName: rest.name, totalOnHand: rest.totalOnHand, reorderLevel: rest.reorderLevel })),
      recentActivity: [
        { description: "Sales order SO-2026-0018 approved", at: new Date().toISOString() },
        { description: "Purchase order PO-2026-0013 created", at: new Date(Date.now() - 3600000).toISOString() },
        { description: "Low stock alert generated for Premium Seed Pack", at: new Date(Date.now() - 7200000).toISOString() },
        { description: "Payment received from Balangoda Agro Centre", at: new Date(Date.now() - 10800000).toISOString() },
      ],
    };
  }

  if (key === "inventory/products" && method === "GET") {
    const searchValue = (params.get("search") ?? "").toLowerCase();
    const lowOnly = params.get("lowStockOnly") === "true";
    const filtered = products.filter((p) => (!searchValue || `${p.name} ${p.sku}`.toLowerCase().includes(searchValue)) && (!lowOnly || p.isLowStock));
    return { items: filtered, totalCount: filtered.length, page: 1, pageSize: 25 };
  }
  if (key === "inventory/categories" && method === "GET") return [{ id: "cat1", name: "Agriculture" }, { id: "cat2", name: "Crop Care" }, { id: "cat3", name: "Seeds" }, { id: "cat4", name: "Equipment" }];
  if (key === "inventory/units" && method === "GET") return [{ id: "u1", name: "Bag", abbreviation: "bag" }, { id: "u2", name: "Pack", abbreviation: "pack" }, { id: "u3", name: "Pieces", abbreviation: "pcs" }];

  if (key === "sales/customers" && method === "GET") return { items: customers, totalCount: customers.length, page: 1, pageSize: 25 };
  if (key === "sales/orders" && method === "GET") {
    const status = params.get("status");
    const items = status ? salesOrders.filter((o) => o.status === status) : salesOrders;
    return { items, totalCount: items.length, page: 1, pageSize: 25 };
  }

  if (key === "purchasing/suppliers" && method === "GET") return { items: suppliers, totalCount: suppliers.length, page: 1, pageSize: 25 };
  if (key === "purchasing/orders" && method === "GET") return { items: purchaseOrders, totalCount: purchaseOrders.length, page: 1, pageSize: 25 };

  if (key === "finance/summary" && method === "GET") return { income: 1487200, expenses: 926500, netCashFlow: 560700, receivables: 684300, payables: 412800 };
  if (key === "finance/transactions" && method === "GET") return { items: [
    { id: "ft1", type: "Income", amount: 186500, description: "SO-2026-0018 payment", date: "2026-09-17" },
    { id: "ft2", type: "Expense", amount: 215000, description: "PO-2026-0012 supplier payment", date: "2026-09-16" },
    { id: "ft3", type: "Income", amount: 127800, description: "SO-2026-0020 payment", date: "2026-09-16" },
  ], totalCount: 3, page: 1, pageSize: 25 };

  if (key === "notifications" && method === "GET") return { items: [
    { id: "n1", type: "LowStock", title: "Low stock alert", message: "Premium Seed Pack is below its reorder level.", entityType: "Product", entityId: "p4", isRead: false, createdAt: new Date().toISOString() },
    { id: "n2", type: "Approval", title: "Approval required", message: "Sales order SO-2026-0019 is waiting for approval.", entityType: "SalesOrder", entityId: "so2", isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: "n3", type: "Payment", title: "Payment received", message: "Balangoda Agro Centre payment was recorded.", entityType: "Payment", entityId: "pay1", isRead: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
  ], totalCount: 3, page: 1, pageSize: 25 };

  if (key === "sync/status" && method === "GET") return { pendingEvents: 2, syncedToday: 47, failedEvents: 0, openConflicts: 1, lastSyncedAt: new Date(Date.now() - 240000).toISOString(), recentEvents: [
    { aggregateType: "SalesOrder", eventType: "OrderApproved", outcome: "Synced", at: new Date().toISOString() },
    { aggregateType: "Inventory", eventType: "StockAdjusted", outcome: "Synced", at: new Date(Date.now() - 120000).toISOString() },
    { aggregateType: "Customer", eventType: "CustomerUpdated", outcome: "Conflict", at: new Date(Date.now() - 240000).toISOString() },
  ] };

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) return { id: "demo-created", demo: true };
  return {};
}
