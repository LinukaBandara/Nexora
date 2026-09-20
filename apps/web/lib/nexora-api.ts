import { apiFetch, buildQuery, ApiError } from "./api";

export interface LoginResult { userId: string; organizationId: string; }
export async function login(email: string, password: string): Promise<LoginResult> {
  const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "Login failed." }));
    throw new ApiError(body.message ?? "Login failed.", response.status);
  }
  return response.json();
}

export interface MeResult { userId: string; email: string | null; organizationId: string; branchId: string | null; permissions: string[]; }
export function getMe() { return apiFetch<MeResult>("/api/v1/auth/me"); }

export interface DailyRevenuePoint { date: string; revenue: number; }
export interface TopProduct { name: string; quantitySold: number; revenue: number; }
export interface LowStockAlert { productName: string; totalOnHand: number; reorderLevel: number; }
export interface RecentActivityItem { description: string; at: string; }
export interface DashboardOverview { revenue: number; orderCount: number; inventoryValue: number; outstandingReceivables: number; revenueTrend: DailyRevenuePoint[]; topProducts: TopProduct[]; lowStockAlerts: LowStockAlert[]; recentActivity: RecentActivityItem[]; }
export function getDashboardOverview(from: string, to: string) { return apiFetch<DashboardOverview>(`/api/v1/analytics/dashboard${buildQuery({ from, to })}`); }

export interface ProductListItem { id: string; sku: string; name: string; categoryName: string; unitAbbreviation: string; sellingPrice: number; totalOnHand: number; reorderLevel: number; isLowStock: boolean; }
export interface PagedResult<T> { items: T[]; totalCount: number; page: number; pageSize: number; }
export function getProducts(params: { search?: string; lowStockOnly?: boolean; page?: number; pageSize?: number }) { return apiFetch<PagedResult<ProductListItem>>(`/api/v1/inventory/products${buildQuery({ search: params.search, lowStockOnly: params.lowStockOnly, page: params.page ?? 1, pageSize: params.pageSize ?? 25 })}`); }
export interface Category { id: string; name: string; }
export function getCategories() { return apiFetch<Category[]>("/api/v1/inventory/categories"); }
export interface Unit { id: string; name: string; abbreviation: string; }
export function getUnits() { return apiFetch<Unit[]>("/api/v1/inventory/units"); }
export interface CreateProductInput { sku: string; name: string; description?: string; categoryId: string; unitId: string; costPrice: number; sellingPrice: number; reorderLevel: number; }
export function createProduct(input: CreateProductInput) { return apiFetch<{ id: string }>("/api/v1/inventory/products", { method: "POST", body: JSON.stringify(input) }); }

export interface CustomerListItem { id: string; name: string; email: string | null; phone: string | null; isActive: boolean; }
export function getCustomers(params: { search?: string; page?: number; pageSize?: number }) { return apiFetch<PagedResult<CustomerListItem>>(`/api/v1/sales/customers${buildQuery({ search: params.search, page: params.page ?? 1, pageSize: params.pageSize ?? 25 })}`); }
export interface CreateCustomerInput { name: string; email?: string; phone?: string; defaultPaymentTermDays: number; creditLimit?: number; }
export function createCustomer(input: CreateCustomerInput) { return apiFetch<{ id: string }>("/api/v1/sales/customers", { method: "POST", body: JSON.stringify(input) }); }
export type SalesOrderStatus = "PendingApproval" | "Approved" | "PartiallyInvoiced" | "Invoiced" | "Cancelled";
export interface SalesOrderItem { id: string; productId: string; productName: string; quantity: number; quantityInvoiced: number; unitPrice: number; lineTotal: number; }
export interface SalesOrderListItem { id: string; number: string; customerName: string; status: SalesOrderStatus; orderDate: string; total: number; items: SalesOrderItem[]; }
export function getSalesOrders(params: { status?: SalesOrderStatus; page?: number; pageSize?: number }) { return apiFetch<PagedResult<SalesOrderListItem>>(`/api/v1/sales/orders${buildQuery({ status: params.status, page: params.page ?? 1, pageSize: params.pageSize ?? 25 })}`); }
export function approveSalesOrder(id: string) { return apiFetch<void>(`/api/v1/sales/orders/${id}/approve`, { method: "POST" }); }
export interface CreateInvoiceLine { salesOrderItemId: string; quantity: number; }
export function createInvoice(salesOrderId: string, lines: CreateInvoiceLine[]) { return apiFetch<{ invoiceId: string }>(`/api/v1/sales/orders/${salesOrderId}/invoices`, { method: "POST", body: JSON.stringify({ lines }) }); }
export interface InvoiceDetail { id: string; number: string; customerName: string; status: string; issueDate: string; dueDate: string; subtotal: number; total: number; amountPaid: number; amountDue: number; items: { productName: string; quantity: number; unitPrice: number; lineTotal: number }[]; payments: { id: string; amount: number; method: string; reference: string | null; receivedAt: string }[]; }
export function getInvoiceDetail(id: string) { return apiFetch<InvoiceDetail>(`/api/v1/sales/invoices/${id}`); }
export function recordPayment(invoiceId: string, input: { amount: number; method: string; reference?: string; notes?: string }) { return apiFetch<{ paymentId: string }>(`/api/v1/sales/invoices/${invoiceId}/payments`, { method: "POST", body: JSON.stringify(input) }); }

export interface SupplierListItem { id: string; name: string; email: string | null; phone: string | null; isActive: boolean; }
export function getSuppliers(params: { search?: string; page?: number; pageSize?: number }) { return apiFetch<PagedResult<SupplierListItem>>(`/api/v1/purchasing/suppliers${buildQuery({ search: params.search, page: params.page ?? 1, pageSize: params.pageSize ?? 25 })}`); }
export interface CreateSupplierInput { name: string; email?: string; phone?: string; address?: string; defaultPaymentTermDays: number; }
export function createSupplier(input: CreateSupplierInput) { return apiFetch<{ id: string }>("/api/v1/purchasing/suppliers", { method: "POST", body: JSON.stringify(input) }); }
export type PurchaseOrderStatus = "PendingApproval" | "Approved" | "PartiallyReceived" | "Received" | "Cancelled";
export interface PurchaseOrderItem { id: string; productId: string; productName: string; quantity: number; quantityReceived: number; unitCost: number; lineTotal: number; }
export interface PurchaseOrderListItem { id: string; number: string; supplierName: string; status: PurchaseOrderStatus | string; orderDate: string; total: number; items: PurchaseOrderItem[]; }
export function getPurchaseOrders(params: { status?: PurchaseOrderStatus; page?: number; pageSize?: number }) { return apiFetch<PagedResult<PurchaseOrderListItem>>(`/api/v1/purchasing/orders${buildQuery({ status: params.status, page: params.page ?? 1, pageSize: params.pageSize ?? 25 })}`); }
export function approvePurchaseOrder(id: string) { return apiFetch<void>(`/api/v1/purchasing/orders/${id}/approve`, { method: "POST" }); }
export interface ReceiveGoodsLine { purchaseOrderItemId: string; quantity: number; }
export function receiveGoods(purchaseOrderId: string, lines: ReceiveGoodsLine[], notes?: string) { return apiFetch<{ receiptId: string }>(`/api/v1/purchasing/orders/${purchaseOrderId}/receipts`, { method: "POST", body: JSON.stringify({ lines, notes }) }); }
export function createSupplierInvoice(purchaseOrderId: string, input: { supplierInvoiceNumber: string; total: number; dueDate?: string }) { return apiFetch<{ invoiceId: string }>(`/api/v1/purchasing/orders/${purchaseOrderId}/supplier-invoices`, { method: "POST", body: JSON.stringify(input) }); }

export interface FinancialSummary { income: number; expenses: number; netCashFlow: number; receivables: number; payables: number; }
export function getFinancialSummary(from: string, to: string) { return apiFetch<FinancialSummary>(`/api/v1/finance/summary${buildQuery({ from, to })}`); }
export interface FinanceTransaction { id: string; type: string; amount: number; description: string; date: string; }
export function getFinanceTransactions(params: { from?: string; to?: string; page?: number; pageSize?: number }) { return apiFetch<PagedResult<FinanceTransaction>>(`/api/v1/finance/transactions${buildQuery({ from: params.from, to: params.to, page: params.page ?? 1, pageSize: params.pageSize ?? 25 })}`); }

export interface NotificationItem { id: string; type: string; title: string; message: string; entityType: string | null; entityId: string | null; isRead: boolean; createdAt: string; }
export function getNotifications(params: { unreadOnly?: boolean; page?: number; pageSize?: number } = {}) { return apiFetch<PagedResult<NotificationItem>>(`/api/v1/notifications${buildQuery({ unreadOnly: params.unreadOnly ?? false, page: params.page ?? 1, pageSize: params.pageSize ?? 25 })}`); }
export function markNotificationRead(id: string) { return apiFetch<void>(`/api/v1/notifications/${id}/read`, { method: "POST" }); }

export interface SyncEvent { aggregateType: string; eventType: string; outcome: string; at: string; }
export interface SyncStatus { pendingEvents: number; syncedToday: number; failedEvents: number; openConflicts: number; lastSyncedAt: string | null; recentEvents: SyncEvent[]; }
export function getSyncStatus() { return apiFetch<SyncStatus>("/api/v1/sync/status"); }
