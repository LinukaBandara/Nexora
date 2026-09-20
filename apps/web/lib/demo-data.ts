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

const DEMO_STORAGE_KEY = "nexora-demo-state-v1";

function readDemoState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeDemoState(state: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state)); } catch {}
}

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
  {
    id: "so1",
    number: "SO-2026-0018",
    customerName: "Balangoda Agro Centre",
    status: "Approved",
    orderDate: "2026-09-17",
    total: 164000,
    items: [
      { id: "so1-i1", productId: "p1", productName: "Premium Fertilizer 25kg", quantity: 10, quantityInvoiced: 0, unitPrice: 12500, lineTotal: 125000 },
      { id: "so1-i2", productId: "p3", productName: "Crop Protection Kit", quantity: 5, quantityInvoiced: 0, unitPrice: 7800, lineTotal: 39000 },
    ],
  },
  {
    id: "so2",
    number: "SO-2026-0019",
    customerName: "Sabaragamuwa Farmers Co-op",
    status: "PendingApproval",
    orderDate: "2026-09-17",
    total: 94100,
    items: [
      { id: "so2-i1", productId: "p2", productName: "Organic Soil Mix", quantity: 12, quantityInvoiced: 0, unitPrice: 4200, lineTotal: 50400 },
      { id: "so2-i2", productId: "p4", productName: "Premium Seed Pack", quantity: 23, quantityInvoiced: 0, unitPrice: 1850, lineTotal: 42550 },
    ],
  },
  {
    id: "so3",
    number: "SO-2026-0020",
    customerName: "Green Valley Holdings",
    status: "Invoiced",
    orderDate: "2026-09-16",
    total: 127800,
    items: [
      { id: "so3-i1", productId: "p1", productName: "Premium Fertilizer 25kg", quantity: 6, quantityInvoiced: 6, unitPrice: 12500, lineTotal: 75000 },
      { id: "so3-i2", productId: "p5", productName: "Irrigation Connector", quantity: 48, quantityInvoiced: 48, unitPrice: 1100, lineTotal: 52800 },
    ],
  },
];

const purchaseOrders = [
  {
    id: "po1",
    number: "PO-2026-0012",
    supplierName: "Ceylon Agri Supply",
    status: "Approved",
    orderDate: "2026-09-16",
    total: 215000,
    items: [
      { id: "po1-i1", productId: "p1", productName: "Premium Fertilizer 25kg", quantity: 10, quantityReceived: 0, unitCost: 12500, lineTotal: 125000 },
      { id: "po1-i2", productId: "p3", productName: "Crop Protection Kit", quantity: 10, quantityReceived: 0, unitCost: 9000, lineTotal: 90000 },
    ],
  },
  {
    id: "po2",
    number: "PO-2026-0013",
    supplierName: "Island Equipment Traders",
    status: "PendingApproval",
    orderDate: "2026-09-17",
    total: 88400,
    items: [
      { id: "po2-i1", productId: "p4", productName: "Premium Seed Pack", quantity: 20, quantityReceived: 0, unitCost: 1850, lineTotal: 37000 },
      { id: "po2-i2", productId: "p5", productName: "Irrigation Connector", quantity: 50, quantityReceived: 0, unitCost: 1028, lineTotal: 51400 },
    ],
  },
];

export function demoResponse(path: string[], search: string, method: string, body?: string) {
  let requestBody: Record<string, unknown> = {};
  try { requestBody = body ? JSON.parse(body) : {}; } catch {}

  const key = path.join("/");
  const params = new URLSearchParams(search);
  const stored = readDemoState();
  const state = {
    products: stored?.products ?? products,
    customers: stored?.customers ?? customers,
    suppliers: stored?.suppliers ?? suppliers,
    salesOrders: stored?.salesOrders ?? salesOrders,
    purchaseOrders: stored?.purchaseOrders ?? purchaseOrders,
    notifications: stored?.notifications ?? null,
    invoices: stored?.invoices ?? [],
  };
  state.salesOrders = state.salesOrders.map((order: any) => ({
    ...order,
    items: order.items ?? [],
  }));
  state.purchaseOrders = state.purchaseOrders.map((order: any) => ({
    ...order,
    items: order.items ?? [],
  }));
  const save = () => writeDemoState(state);

  if (key === "auth/me" && method === "GET") return DEMO_USER;

  if (key === "analytics/dashboard" && method === "GET") {
    const revenueTrend = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(Date.now() - (13 - index) * 86400000).toISOString().slice(0, 10);
      return { date, revenue: 65000 + ((index * 17321) % 90000) };
    });
    const inventoryValue = state.products.reduce(
      (sum: number, p: { sellingPrice: number; totalOnHand: number }) => sum + p.sellingPrice * p.totalOnHand,
      0,
    );
    const orderCount = state.salesOrders.length;
    const topProducts = state.products.slice(0, 4).map((p: { name: string }, i: number) => ({
      name: p.name,
      quantitySold: 58 - i * 9,
      revenue: 312000 - i * 41000,
    }));
    return {
      revenue: 1487200,
      orderCount,
      inventoryValue,
      outstandingReceivables: 684300,
      revenueTrend,
      topProducts,
      lowStockAlerts: state.products
        .filter((p: { isLowStock: boolean }) => p.isLowStock)
        .map((p: { name: string; totalOnHand: number; reorderLevel: number }) => ({
          productName: p.name,
          totalOnHand: p.totalOnHand,
          reorderLevel: p.reorderLevel,
        })),
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
    const filtered = state.products.filter(
      (p) => (!searchValue || `${p.name} ${p.sku}`.toLowerCase().includes(searchValue)) && (!lowOnly || p.isLowStock),
    );
    return { items: filtered, totalCount: filtered.length, page: 1, pageSize: 25 };
  }

  if (key === "inventory/categories" && method === "GET") {
    return [
      { id: "cat1", name: "Agriculture" },
      { id: "cat2", name: "Crop Care" },
      { id: "cat3", name: "Seeds" },
      { id: "cat4", name: "Equipment" },
    ];
  }

  if (key === "inventory/units" && method === "GET") {
    return [
      { id: "u1", name: "Bag", abbreviation: "bag" },
      { id: "u2", name: "Pack", abbreviation: "pack" },
      { id: "u3", name: "Pieces", abbreviation: "pcs" },
    ];
  }

  if (key === "sales/customers" && method === "GET") return { items: state.customers, totalCount: state.customers.length, page: 1, pageSize: 25 };

  if (key === "sales/orders" && method === "GET") {
    const status = params.get("status");
    const items = status ? state.salesOrders.filter((o) => o.status === status) : state.salesOrders;
    return { items, totalCount: items.length, page: 1, pageSize: 25 };
  }

  if (key === "purchasing/suppliers" && method === "GET") return { items: state.suppliers, totalCount: state.suppliers.length, page: 1, pageSize: 25 };
  if (key === "purchasing/orders" && method === "GET") return { items: state.purchaseOrders, totalCount: state.purchaseOrders.length, page: 1, pageSize: 25 };

  if (key.startsWith("sales/invoices/") && method === "GET") {
    const invoice = state.invoices.find((i: { id: string }) => i.id === path[2]);
    return invoice ?? {};
  }

  if (key.startsWith("sales/invoices/") && key.endsWith("/payments") && method === "POST") {
    const invoice = state.invoices.find((i: { id: string }) => i.id === path[2]);
    if (!invoice) return {};
    const amount = Number(requestBody.amount ?? 0);
    invoice.amountPaid += amount;
    invoice.amountDue = Math.max(0, invoice.total - invoice.amountPaid);
    invoice.status = invoice.amountDue === 0 ? "Paid" : "PartiallyPaid";
    invoice.payments.push({ id: `demo-payment-${Date.now()}`, amount, method: String(requestBody.method ?? "BankTransfer"), reference: requestBody.reference ?? null, receivedAt: new Date().toISOString() });
    save();
    return { paymentId: invoice.payments[invoice.payments.length - 1].id, demo: true };
  }

  if (key.startsWith("sales/orders/") && key.endsWith("/invoices") && method === "POST") {
    const order = state.salesOrders.find((o: { id: string }) => o.id === path[2]);
    if (!order) return {};
    const lines = Array.isArray(requestBody.lines) ? requestBody.lines as { salesOrderItemId: string; quantity: number }[] : [];
    const invoiceItems = lines.map((line) => { const item = order.items.find((i: { id: string }) => i.id === line.salesOrderItemId); const qty = Number(line.quantity); return { productName: item?.productName ?? "Product", quantity: qty, unitPrice: item?.unitPrice ?? 0, lineTotal: qty * (item?.unitPrice ?? 0) }; });
    lines.forEach((line) => { const item = order.items.find((i: { id: string }) => i.id === line.salesOrderItemId); if (item) item.quantityInvoiced += Number(line.quantity); });
    const total = invoiceItems.reduce((sum, i) => sum + i.lineTotal, 0);
    order.status = order.items.every((i: { quantity: number; quantityInvoiced: number }) => i.quantityInvoiced >= i.quantity) ? "Invoiced" : "PartiallyInvoiced";
    const invoice = { id: `demo-invoice-${Date.now()}`, number: `INV-DEMO-${Date.now().toString().slice(-6)}`, customerName: order.customerName, status: "Unpaid", issueDate: new Date().toISOString().slice(0,10), dueDate: new Date(Date.now()+30*86400000).toISOString().slice(0,10), subtotal: total, total, amountPaid: 0, amountDue: total, items: invoiceItems, payments: [] };
    state.invoices.push(invoice); save(); return { invoiceId: invoice.id, demo: true };
  }

  if (key.startsWith("purchasing/orders/") && key.endsWith("/receipts") && method === "POST") {
    const order = state.purchaseOrders.find((o: { id: string }) => o.id === path[2]);
    if (!order) return {};
    const lines = Array.isArray(requestBody.lines) ? requestBody.lines as { purchaseOrderItemId: string; quantity: number }[] : [];
    lines.forEach((line) => { const item = order.items.find((i: { id: string }) => i.id === line.purchaseOrderItemId); if (item) item.quantityReceived += Number(line.quantity); });
    order.status = order.items.every((i: { quantity: number; quantityReceived: number }) => i.quantityReceived >= i.quantity) ? "Received" : "PartiallyReceived";
    save(); return { receiptId: `demo-receipt-${Date.now()}`, demo: true };
  }

  if (key.startsWith("purchasing/orders/") && key.endsWith("/supplier-invoices") && method === "POST") {
    save(); return { invoiceId: `demo-supplier-invoice-${Date.now()}`, demo: true };
  }

  if (key === "finance/summary" && method === "GET") {
    return { income: 1487200, expenses: 926500, netCashFlow: 560700, receivables: 684300, payables: 412800 };
  }

  if (key === "finance/transactions" && method === "GET") {
    return {
      items: [
        { id: "ft1", type: "Income", amount: 186500, description: "SO-2026-0018 payment", date: "2026-09-17" },
        { id: "ft2", type: "Expense", amount: 215000, description: "PO-2026-0012 supplier payment", date: "2026-09-16" },
        { id: "ft3", type: "Income", amount: 127800, description: "SO-2026-0020 payment", date: "2026-09-16" },
      ],
      totalCount: 3,
      page: 1,
      pageSize: 25,
    };
  }

  if (key === "notifications" && method === "GET") {
    const notificationItems = state.notifications ?? [
      { id: "n1", type: "LowStock", title: "Low stock alert", message: "Premium Seed Pack is below its reorder level.", entityType: "Product", entityId: "p4", isRead: false, createdAt: new Date().toISOString() },
      { id: "n2", type: "Approval", title: "Approval required", message: "Sales order SO-2026-0019 is waiting for approval.", entityType: "SalesOrder", entityId: "so2", isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: "n3", type: "Payment", title: "Payment received", message: "Balangoda Agro Centre payment was recorded.", entityType: "Payment", entityId: "pay1", isRead: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
    ];
    state.notifications = notificationItems;
    save();
    const unreadOnly = params.get("unreadOnly") === "true";
    const visible = unreadOnly ? notificationItems.filter((n: { isRead: boolean }) => !n.isRead) : notificationItems;
    return { items: visible, totalCount: visible.length, page: 1, pageSize: 25 };
  }

  if (key.startsWith("notifications/") && method === "POST") {
    const notificationId = path[1];
    const notificationItems = state.notifications ?? [];
    const item = notificationItems.find((n: { id: string }) => n.id === notificationId);
    if (item) item.isRead = true;
    state.notifications = notificationItems;
    save();
    return undefined;
  }

  if (key === "sync/status" && method === "GET") {
    return {
      pendingEvents: 2,
      syncedToday: 47,
      failedEvents: 0,
      openConflicts: 1,
      lastSyncedAt: new Date(Date.now() - 240000).toISOString(),
      recentEvents: [
        { aggregateType: "SalesOrder", eventType: "OrderApproved", outcome: "Synced", at: new Date().toISOString() },
        { aggregateType: "Inventory", eventType: "StockAdjusted", outcome: "Synced", at: new Date(Date.now() - 120000).toISOString() },
        { aggregateType: "Customer", eventType: "CustomerUpdated", outcome: "Conflict", at: new Date(Date.now() - 240000).toISOString() },
      ],
    };
  }

  if (method === "POST" && key === "inventory/products") {
    const product = {
      id: `demo-product-${Date.now()}`,
      sku: String(requestBody.sku ?? "NX-DEMO-" + String(state.products.length + 1).padStart(3, "0")),
      name: String(requestBody.name ?? "Demo Product"),
      categoryName: String(requestBody.categoryId ?? "General"),
      unitAbbreviation: "pcs",
      sellingPrice: Number(requestBody.sellingPrice ?? 0),
      totalOnHand: 0,
      reorderLevel: Number(requestBody.reorderLevel ?? 0),
      isLowStock: false,
    };
    state.products = [...state.products, product];
    save();
    return { id: product.id, demo: true };
  }

  if (method === "POST" && key === "sales/customers") {
    const customer = {
      id: `demo-customer-${Date.now()}`,
      name: String(requestBody.name ?? "Demo Customer"),
      email: String(requestBody.email ?? "demo@customer.local"),
      phone: String(requestBody.phone ?? "+94 70 000 0000"),
      isActive: true,
    };
    state.customers = [...state.customers, customer];
    save();
    return { id: customer.id, demo: true };
  }

  if (method === "POST" && key === "purchasing/suppliers") {
    const supplier = {
      id: `demo-supplier-${Date.now()}`,
      name: String(requestBody.name ?? "Demo Supplier"),
      email: String(requestBody.email ?? "demo@supplier.local"),
      phone: String(requestBody.phone ?? "+94 70 000 0001"),
      isActive: true,
    };
    state.suppliers = [...state.suppliers, supplier];
    save();
    return { id: supplier.id, demo: true };
  }

  if (method === "POST" && key.endsWith("/approve")) {
    const collection = key.startsWith("sales/orders/") ? state.salesOrders : state.purchaseOrders;
    const id = path[2];
    const item = collection.find((entry: { id: string }) => entry.id === id);
    if (item) item.status = "Approved";
    save();
    return undefined;
  }

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) return { id: "demo-created", demo: true };
  return {};
}
