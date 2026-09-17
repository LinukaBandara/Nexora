"use client";

import { useEffect, useState } from "react";
import { getProducts, ProductListItem } from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MoneyDisplay } from "@/components/ui/MoneyDisplay";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { CreateProductDialog } from "@/components/inventory/CreateProductDialog";
import { Toast } from "@/components/ui/Toast";

const PAGE_SIZE = 25;
export default function InventoryPage() {
  const [items, setItems] = useState<ProductListItem[]>([]); const [totalCount, setTotalCount] = useState(0); const [page, setPage] = useState(1); const [search, setSearch] = useState(""); const [lowStockOnly, setLowStockOnly] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [isCreateOpen, setIsCreateOpen] = useState(false); const [toastMessage, setToastMessage] = useState<string | null>(null);
  async function load() { setLoading(true); setError(null); try { const result = await getProducts({ search, lowStockOnly, page, pageSize: PAGE_SIZE }); setItems(result.items); setTotalCount(result.totalCount); } catch (err) { setError(err instanceof ApiError ? err.message : "Unable to load products."); } finally { setLoading(false); } }
  useEffect(() => { load(); }, [page, search, lowStockOnly]);
  function handleSearch(value: string) { setSearch(value); setPage(1); }
  return <div className="flex flex-col gap-5 sm:gap-6"><header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-page-title font-semibold tracking-tight text-text-primary">Inventory</div><div className="mt-1 text-secondary text-text-muted">Manage products, stock and warehouses.</div></div><Button variant="primary" onClick={() => setIsCreateOpen(true)}>+ Add product</Button></header>
    {isCreateOpen && <CreateProductDialog onClose={() => setIsCreateOpen(false)} onCreated={() => { setIsCreateOpen(false); setPage(1); load(); setToastMessage("Product created successfully"); }} />}{toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center"><SearchInput placeholder="Search products..." onSearch={handleSearch} /><button onClick={() => { setLowStockOnly(v => !v); setPage(1); }} className={`rounded-input border px-3 py-2 text-body transition-colors ${lowStockOnly ? "border-warning bg-warning-bg text-warning" : "border-border text-text-secondary hover:bg-surface-secondary"}`}>Low stock only</button></div>
    <Card className="overflow-hidden">{loading ? <TableSkeleton /> : error ? <div className="p-8 text-center"><div className="text-body font-medium text-text-primary">Unable to load inventory.</div><div className="mt-1 text-secondary text-text-muted">{error}</div><button onClick={load} className="mt-4 text-secondary font-medium text-primary">Retry</button></div> : items.length === 0 ? <EmptyState hasFilters={search !== "" || lowStockOnly} /> : <><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-body"><thead><tr className="border-b border-border text-dense text-text-muted"><th className="px-5 py-3 text-left font-medium">Product</th><th className="px-5 py-3 text-left font-medium">SKU</th><th className="px-5 py-3 text-left font-medium">Category</th><th className="px-5 py-3 text-right font-medium">Stock</th><th className="px-5 py-3 text-left font-medium">Status</th><th className="px-5 py-3 text-right font-medium">Price</th></tr></thead><tbody>{items.map(p => <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-secondary"><td className="px-5 py-3 font-medium text-text-primary">{p.name}</td><td className="px-5 py-3 text-text-muted">{p.sku}</td><td className="px-5 py-3 text-text-secondary">{p.categoryName}</td><td className="px-5 py-3 text-right tabular-nums text-text-primary">{p.totalOnHand} {p.unitAbbreviation}</td><td className="px-5 py-3">{p.totalOnHand <= 0 ? <StatusBadge label="Out of stock" tone="danger" /> : p.isLowStock ? <StatusBadge label="Low stock" tone="warning" /> : <StatusBadge label="Healthy" tone="success" />}</td><td className="px-5 py-3 text-right font-medium text-text-primary"><MoneyDisplay amount={p.sellingPrice} /></td></tr>)}</tbody></table></div><Pagination page={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} /></>}</Card>
  </div>;
}
function EmptyState({ hasFilters }: { hasFilters: boolean }) { return <div className="p-10 text-center"><div className="text-body text-text-primary">{hasFilters ? "No products match your search." : "No products yet."}</div><div className="mt-1 text-secondary text-text-muted">{hasFilters ? "Try a different search term or clear the filter." : "Add your first product to start managing inventory."}</div></div>; }
function TableSkeleton() { return <div className="flex flex-col gap-2 p-4">{[0,1,2,3,4].map(i => <div key={i} className="h-11 animate-pulse rounded-control bg-surface-secondary" />)}</div>; }
