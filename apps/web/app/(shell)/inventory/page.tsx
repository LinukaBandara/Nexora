"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getProducts, ProductListItem } from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MoneyDisplay } from "@/components/ui/MoneyDisplay";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { CreateProductDialog } from "@/components/inventory/CreateProductDialog";
import { Toast } from "@/components/ui/Toast";
import { AlertCircle, Box, Package, Plus } from "lucide-react";

const PAGE_SIZE = 25;

export default function InventoryPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    setPage(1);
    if (searchParams.get("action") === "create") setIsCreateOpen(true);
  }, [searchParams]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await getProducts({ search, lowStockOnly, page, pageSize: PAGE_SIZE });
      setItems(result.items);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, search, lowStockOnly]);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  const lowStockCount = items.filter((p) => p.isLowStock).length;
  const healthyCount = items.filter((p) => p.totalOnHand > 0 && !p.isLowStock).length;
  const estimatedCatalogValue = items.reduce((acc, p) => acc + p.sellingPrice * p.totalOnHand, 0);

  return (
    <div className="flex flex-col gap-6 pb-8 sm:gap-7">
      <PageHeader breadcrumbs={["Inventory", "Catalog"]} title="Inventory" description="Monitor stock levels, warehouse products and automated replenishment thresholds." actions={<Button variant="primary" onClick={() => setIsCreateOpen(true)} className="h-9 gap-1.5 rounded-xl bg-[#123B2A] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#195039]"><Plus size={15} strokeWidth={2.5} /><span>Add Product</span></Button>} />

      {isCreateOpen && <CreateProductDialog onClose={() => setIsCreateOpen(false)} onCreated={() => { setIsCreateOpen(false); setPage(1); load(); setToastMessage("Product added to inventory successfully."); }} />}
      {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Catalog Products" value={totalCount.toLocaleString()} variant="dark" tag="Live Stock" changeLabel="100% synchronized" changeDirection="up" />
        <KpiCard label="Healthy Stock" value={healthyCount.toLocaleString()} detail={`${healthyCount} items above reorder target`} changeLabel="Normal operations" changeDirection="up" />
        <KpiCard label="Low Stock Alerts" value={lowStockCount.toLocaleString()} detail={lowStockCount > 0 ? `${lowStockCount} items need reordering` : "Zero shortages reported"} changeLabel={lowStockCount > 0 ? "Requires restock" : "Optimal"} changeDirection={lowStockCount > 0 ? "down" : "up"} />
        <KpiCard label="Estimated Stock Value" value={<MoneyDisplay amount={estimatedCatalogValue} />} detail="Based on visible on-hand units" changeLabel="Current page valuation" changeDirection="flat" />
      </section>

      <div className="overflow-hidden rounded-[18px] border border-[#E3E9E5] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#EAEFEA] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><div className="flex items-center gap-2"><h2 className="text-sm font-bold text-[#142019]">Stock Registry</h2><span className="rounded-full bg-[#EBF4EE] px-2 py-0.5 text-[10px] font-bold text-[#1F7A4D]">{items.length} items on page</span></div><p className="mt-0.5 text-[12px] text-[#697B70]">Filter products, monitor SKU thresholds, and check on-hand balances.</p></div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button onClick={() => { setLowStockOnly((v) => !v); setPage(1); }} className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${lowStockOnly ? "border-[#E8B4B4] bg-[#FDF2F2] text-[#C84A4A]" : "border-[#D7DFDA] bg-white text-[#4A5E51] hover:bg-[#F2F5F3]"}`}><AlertCircle size={14} /><span>{lowStockOnly ? "Showing Low Stock" : "Filter Low Stock"}</span></button>
            <div className="w-full sm:w-64"><SearchInput placeholder="Search products or SKU..." onSearch={handleSearch} /></div>
          </div>
        </div>

        {loading ? <TableSkeleton rows={5} /> : error ? <div className="p-6"><ErrorState message={error} onRetry={load} /></div> : items.length === 0 ? <EmptyState icon={Package} title={lowStockOnly ? "No low stock products" : search ? "No matching products found" : "Inventory is empty"} description={lowStockOnly ? "All catalog items currently satisfy their replenishment reorder thresholds." : search ? `No products matched "${search}". Try checking the spelling or resetting filters.` : "Add your first product to begin tracking warehouse stock levels and order fulfillments."} actionLabel={lowStockOnly ? "Clear Filter" : search ? undefined : "+ Add Product"} onAction={lowStockOnly ? () => setLowStockOnly(false) : search ? undefined : () => setIsCreateOpen(true)} /> : <>
          <div className="overflow-x-auto"><table className="w-full min-w-[840px] text-xs"><thead><tr className="border-b border-[#EAEFEA] bg-[#F9FAF9] text-[10px] font-bold uppercase tracking-[0.12em] text-[#6D8174]"><th className="px-6 py-3.5 text-left">Product</th><th className="px-6 py-3.5 text-left">SKU</th><th className="px-6 py-3.5 text-left">Category</th><th className="px-6 py-3.5 text-right">On Hand</th><th className="px-6 py-3.5 text-right">Reorder Level</th><th className="px-6 py-3.5 text-right">Unit Price</th><th className="px-6 py-3.5 text-left">Status</th></tr></thead><tbody className="divide-y divide-[#EAEFEA]">{items.map((p) => <tr key={p.id} className="transition-colors hover:bg-[#F9FAF9]"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDF5F0] text-[#1F7A4D]"><Box size={17} /></div><div><div className="font-bold text-[#142019]">{p.name}</div><div className="text-[10px] text-[#7A8C81]">Measured in {p.unitAbbreviation}</div></div></div></td><td className="px-6 py-4"><span className="rounded-md bg-[#F0F4F1] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#485C50]">{p.sku}</span></td><td className="px-6 py-4 font-medium text-[#485C50]">{p.categoryName}</td><td className="px-6 py-4 text-right"><span className="font-bold tabular-nums text-[#142019]">{p.totalOnHand}</span> <span className="text-[11px] text-[#7A8C81]">{p.unitAbbreviation}</span></td><td className="px-6 py-4 text-right tabular-nums text-[#6E8075]">{p.reorderLevel} {p.unitAbbreviation}</td><td className="px-6 py-4 text-right font-bold text-[#142019]"><MoneyDisplay amount={p.sellingPrice} /></td><td className="px-6 py-4">{p.totalOnHand <= 0 ? <StatusBadge label="Out of stock" tone="danger" /> : p.isLowStock ? <StatusBadge label="Low stock" tone="warning" /> : <StatusBadge label="Healthy" tone="success" />}</td></tr>)}</tbody></table></div>
          <Pagination page={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
        </>}
      </div>
    </div>
  );
}
