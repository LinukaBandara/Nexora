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
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try { const result = await getProducts({ search, lowStockOnly, page, pageSize: PAGE_SIZE }); setItems(result.items); setTotalCount(result.totalCount); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Unable to load products."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [page, search, lowStockOnly]);

  function handleSearch(value: string) { setSearch(value); setPage(1); }

  const lowStockCount = items.filter(p => p.isLowStock).length;
  const healthyCount = items.filter(p => p.totalOnHand > 0 && !p.isLowStock).length;

  return (
    <div className="flex flex-col gap-6 sm:gap-7">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-dense font-medium text-primary"><span>Inventory</span><span className="text-text-muted">/</span><span className="text-text-muted">Stock control</span></div>
          <h1 className="mt-2 text-page-title font-semibold tracking-tight text-text-primary">Inventory workspace</h1>
          <p className="mt-1 max-w-2xl text-secondary text-text-muted">Monitor stock health, pricing and product records across your operation.</p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>+ Add product</Button>
      </header>

      {isCreateOpen && <CreateProductDialog onClose={() => setIsCreateOpen(false)} onCreated={() => { setIsCreateOpen(false); setPage(1); load(); setToastMessage("Product created successfully"); }} />}
      {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="Products" value={totalCount.toLocaleString()} detail="Total catalog records" />
        <Metric label="Healthy" value={healthyCount.toLocaleString()} detail="Loaded page" />
        <Metric label="Low stock" value={lowStockCount.toLocaleString()} detail="Needs attention" warning={lowStockCount > 0} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-section-title font-semibold text-text-primary">Product stock</h2><p className="mt-1 text-dense text-text-muted">Search products or isolate items that need replenishment.</p></div>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto"><div className="sm:w-72"><SearchInput placeholder="Search products..." onSearch={handleSearch} /></div><button onClick={() => { setLowStockOnly(v => !v); setPage(1); }} className={`h-10 rounded-input border px-3 text-body font-medium transition-colors ${lowStockOnly ? "border-warning bg-warning-bg text-warning" : "border-border text-text-secondary hover:bg-surface-secondary"}`}>{lowStockOnly ? "Showing low stock" : "Low stock only"}</button></div>
        </div>
        {loading ? <TableSkeleton /> : error ? <div className="p-8 text-center"><div className="text-body font-medium text-text-primary">Unable to load inventory.</div><div className="mt-1 text-secondary text-text-muted">{error}</div><button onClick={load} className="mt-4 text-secondary font-medium text-primary">Retry</button></div> : items.length === 0 ? <EmptyState hasFilters={search !== "" || lowStockOnly} /> : <>
          <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-body"><thead><tr className="border-b border-border bg-surface-secondary/60 text-dense text-text-muted"><th className="px-5 py-3 text-left font-medium">Product</th><th className="px-5 py-3 text-left font-medium">SKU</th><th className="px-5 py-3 text-left font-medium">Category</th><th className="px-5 py-3 text-right font-medium">Stock</th><th className="px-5 py-3 text-left font-medium">Status</th><th className="px-5 py-3 text-right font-medium">Price</th></tr></thead><tbody>{items.map(p => <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/70"><td className="px-5 py-3.5"><div className="font-medium text-text-primary">{p.name}</div><div className="mt-0.5 text-dense text-text-muted">{p.unitAbbreviation} unit</div></td><td className="px-5 py-3.5 font-mono text-dense text-text-muted">{p.sku}</td><td className="px-5 py-3.5 text-text-secondary">{p.categoryName}</td><td className="px-5 py-3.5 text-right font-medium tabular-nums text-text-primary">{p.totalOnHand} <span className="font-normal text-text-muted">{p.unitAbbreviation}</span></td><td className="px-5 py-3.5">{p.totalOnHand <= 0 ? <StatusBadge label="Out of stock" tone="danger" /> : p.isLowStock ? <StatusBadge label="Low stock" tone="warning" /> : <StatusBadge label="Healthy" tone="success" />}</td><td className="px-5 py-3.5 text-right font-medium text-text-primary"><MoneyDisplay amount={p.sellingPrice} /></td></tr>)}</tbody></table></div>
          <Pagination page={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
        </>}
      </Card>
    </div>
  );
}

function Metric({ label, value, detail, warning = false }: { label: string; value: string; detail: string; warning?: boolean }) {
  return <Card className={`p-4 sm:p-5 ${warning ? "border-warning/40" : ""}`}><div className="text-dense font-medium uppercase tracking-wide text-text-muted">{label}</div><div className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${warning ? "text-warning" : "text-text-primary"}`}>{value}</div><div className="mt-1 text-dense text-text-muted">{detail}</div></Card>;
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) { return <div className="p-10 text-center"><div className="text-body text-text-primary">{hasFilters ? "No products match your search." : "No products yet."}</div><div className="mt-1 text-secondary text-text-muted">{hasFilters ? "Try a different search term or clear the filter." : "Add your first product to start managing inventory."}</div></div>; }
function TableSkeleton() { return <div className="flex flex-col gap-2 p-4">{[0,1,2,3,4].map(i => <div key={i} className="h-11 animate-pulse rounded-control bg-surface-secondary" />)}</div>; }
