import { apiFetch, buildQuery, ApiError } from "./api";

// ---- Auth - shapes match AuthController's records exactly -----------------

// Deliberately NOT going through apiFetch/the proxy - this hits our own
// /api/login route directly, which is what actually sets the HttpOnly
// cookie. Note the response no longer includes the tokens themselves;
// the browser never sees them. See app/api/login/route.ts.
export interface LoginResult {
  userId: string;
  organizationId: string;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "Login failed." }));
    throw new ApiError(body.message ?? "Login failed.", response.status);
  }

  return response.json();
}

export interface MeResult {
  userId: string;
  email: string | null;
  organizationId: string;
  branchId: string | null;
  permissions: string[];
}

export function getMe() {
  return apiFetch<MeResult>("/api/v1/auth/me");
}

// ---- Analytics - shapes match GetDashboardOverviewQuery's DTOs -----------------

export interface DailyRevenuePoint {
  date: string;
  revenue: number;
}

export interface TopProduct {
  name: string;
  quantitySold: number;
  revenue: number;
}

export interface LowStockAlert {
  productName: string;
  totalOnHand: number;
  reorderLevel: number;
}

export interface RecentActivityItem {
  description: string;
  at: string;
}

export interface DashboardOverview {
  revenue: number;
  orderCount: number;
  inventoryValue: number;
  outstandingReceivables: number;
  revenueTrend: DailyRevenuePoint[];
  topProducts: TopProduct[];
  lowStockAlerts: LowStockAlert[];
  recentActivity: RecentActivityItem[];
}

export function getDashboardOverview(from: string, to: string) {
  return apiFetch<DashboardOverview>(`/api/v1/analytics/dashboard${buildQuery({ from, to })}`);
}

// ---- Inventory - shapes match GetProductsQuery's DTOs exactly -----------------

export interface ProductListItem {
  id: string;
  sku: string;
  name: string;
  categoryName: string;
  unitAbbreviation: string;
  sellingPrice: number;
  totalOnHand: number;
  reorderLevel: number;
  isLowStock: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export function getProducts(params: { search?: string; lowStockOnly?: boolean; page?: number; pageSize?: number }) {
  return apiFetch<PagedResult<ProductListItem>>(
    `/api/v1/inventory/products${buildQuery({
      search: params.search,
      lowStockOnly: params.lowStockOnly,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 25,
    })}`
  );
}

export interface Category {
  id: string;
  name: string;
}

export function getCategories() {
  return apiFetch<Category[]>("/api/v1/inventory/categories");
}

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
}

export function getUnits() {
  return apiFetch<Unit[]>("/api/v1/inventory/units");
}

export interface CreateProductInput {
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  unitId: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
}

export function createProduct(input: CreateProductInput) {
  return apiFetch<{ id: string }>("/api/v1/inventory/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ---- Sales - shapes match GetCustomersQuery / CreateCustomerCommand exactly ------

export interface CustomerListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
}

export function getCustomers(params: { search?: string; page?: number; pageSize?: number }) {
  return apiFetch<PagedResult<CustomerListItem>>(
    `/api/v1/sales/customers${buildQuery({
      search: params.search,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 25,
    })}`
  );
}

export interface CreateCustomerInput {
  name: string;
  email?: string;
  phone?: string;
  defaultPaymentTermDays: number;
  creditLimit?: number;
}

export function createCustomer(input: CreateCustomerInput) {
  return apiFetch<{ id: string }>("/api/v1/sales/customers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type SalesOrderStatus = "PendingApproval" | "Approved" | "PartiallyInvoiced" | "Invoiced" | "Cancelled";

export interface SalesOrderListItem {
  id: string;
  number: string;
  customerName: string;
  status: SalesOrderStatus;
  orderDate: string;
  total: number;
}

export function getSalesOrders(params: { status?: SalesOrderStatus; page?: number; pageSize?: number }) {
  return apiFetch<PagedResult<SalesOrderListItem>>(
    `/api/v1/sales/orders${buildQuery({
      status: params.status,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 25,
    })}`
  );
}

export function approveSalesOrder(id: string) {
  return apiFetch<void>(`/api/v1/sales/orders/${id}/approve`, { method: "POST" });
}

