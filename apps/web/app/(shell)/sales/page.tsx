"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCustomers, CustomerListItem } from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { Toast } from "@/components/ui/Toast";
import { CreateCustomerDialog } from "@/components/sales/CreateCustomerDialog";

const PAGE_SIZE = 25;

export default function SalesPage() {
  const [items, setItems] = useState<CustomerListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await getCustomers({ search, page, pageSize: PAGE_SIZE });
      setItems(result.items);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, search]);

  return (
    <div className="flex flex-col gap-6 sm:gap-7">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-dense font-medium text-primary">
            <span>Sales</span><span className="text-text-muted">/</span><span className="text-text-muted">Customers</span>
          </div>
          <h1 className="mt-2 text-page-title font-semibold tracking-tight text-text-primary">Customer workspace</h1>
          <p className="mt-1 max-w-2xl text-secondary text-text-muted">Keep customer records organized and move directly into sales orders when you are ready to sell.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/sales/orders" className="inline-flex h-10 items-center justify-center rounded-input border border-border bg-surface px-4 text-body font-medium text-text-primary transition hover:bg-surface-secondary">Sales orders <span className="ml-2 text-text-muted">→</span></Link>
          <Button variant="primary" onClick={() => setIsCreateOpen(true)}>+ Add customer</Button>
        </div>
      </header>

      {isCreateOpen && <CreateCustomerDialog onClose={() => setIsCreateOpen(false)} onCreated={() => { setIsCreateOpen(false); setPage(1); load(); setToastMessage("Customer created successfully"); }} />}
      {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="Customers" value={totalCount.toLocaleString()} detail="Total records" />
        <Metric label="Loaded" value={items.length.toLocaleString()} detail={`Page ${page}`} />
        <Metric label="Workspace" value="Active" detail="Customer management" />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-section-title font-semibold text-text-primary">Customers</h2><p className="mt-1 text-dense text-text-muted">Search, review and manage customer records.</p></div>
          <div className="w-full lg:max-w-sm"><SearchInput placeholder="Search customers..." onSearch={v => { setSearch(v); setPage(1); }} /></div>
        </div>
        {loading ? <TableSkeleton /> : error ? <div className="p-8 text-center"><div className="text-body font-medium text-text-primary">Unable to load customers.</div><div className="mt-1 text-secondary text-text-muted">{error}</div><button onClick={load} className="mt-4 text-secondary font-medium text-primary">Retry</button></div> : items.length === 0 ? <EmptyState hasFilters={search !== ""} /> : <>
          <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-body"><thead><tr className="border-b border-border bg-surface-secondary/60 text-dense text-text-muted"><th className="px-5 py-3 text-left font-medium">Customer</th><th className="px-5 py-3 text-left font-medium">Email</th><th className="px-5 py-3 text-left font-medium">Phone</th><th className="px-5 py-3 text-left font-medium">Status</th></tr></thead><tbody>{items.map(c => <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/70"><td className="px-5 py-3.5"><div className="font-medium text-text-primary">{c.name}</div><div className="mt-0.5 text-dense text-text-muted">Customer record</div></td><td className="px-5 py-3.5 text-text-secondary">{c.email ?? "—"}</td><td className="px-5 py-3.5 text-text-secondary">{c.phone ?? "—"}</td><td className="px-5 py-3.5"><StatusBadge label={c.isActive ? "Active" : "Inactive"} tone={c.isActive ? "success" : "neutral"} /></td></tr>)}</tbody></table></div>
          <Pagination page={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
        </>}
      </Card>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <Card className="p-4 sm:p-5"><div className="text-dense font-medium uppercase tracking-wide text-text-muted">{label}</div><div className="mt-2 text-2xl font-semibold tracking-tight text-text-primary tabular-nums">{value}</div><div className="mt-1 text-dense text-text-muted">{detail}</div></Card>;
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) { return <div className="p-10 text-center"><div className="text-body text-text-primary">{hasFilters ? "No customers match your search." : "No customers yet."}</div><div className="mt-1 text-secondary text-text-muted">{hasFilters ? "Try a different search term." : "Add your first customer to start selling."}</div></div>; }
function TableSkeleton() { return <div className="flex flex-col gap-2 p-4">{[0,1,2,3,4].map(i => <div key={i} className="h-11 animate-pulse rounded-control bg-surface-secondary" />)}</div>; }
