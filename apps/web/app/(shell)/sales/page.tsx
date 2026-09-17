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
  const [items, setItems] = useState<CustomerListItem[]>([]); const [totalCount, setTotalCount] = useState(0); const [page, setPage] = useState(1); const [search, setSearch] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [isCreateOpen, setIsCreateOpen] = useState(false); const [toastMessage, setToastMessage] = useState<string | null>(null);
  async function load() { setLoading(true); setError(null); try { const result = await getCustomers({ search, page, pageSize: PAGE_SIZE }); setItems(result.items); setTotalCount(result.totalCount); } catch (err) { setError(err instanceof ApiError ? err.message : "Unable to load customers."); } finally { setLoading(false); } }
  useEffect(() => { load(); }, [page, search]);
  return <div className="flex flex-col gap-5 sm:gap-6"><header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-page-title font-semibold tracking-tight text-text-primary">Sales</div><div className="mt-1 text-secondary text-text-muted">Customers, orders and invoices. <Link href="/sales/orders" className="font-medium text-primary hover:underline">Open sales orders →</Link></div></div><Button variant="primary" onClick={() => setIsCreateOpen(true)}>+ Add customer</Button></header>
    {isCreateOpen && <CreateCustomerDialog onClose={() => setIsCreateOpen(false)} onCreated={() => { setIsCreateOpen(false); setPage(1); load(); setToastMessage("Customer created successfully"); }} />}{toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}
    <div className="max-w-xl"><SearchInput placeholder="Search customers..." onSearch={v => { setSearch(v); setPage(1); }} /></div>
    <Card className="overflow-hidden">{loading ? <TableSkeleton /> : error ? <div className="p-8 text-center"><div className="text-body font-medium text-text-primary">Unable to load customers.</div><div className="mt-1 text-secondary text-text-muted">{error}</div><button onClick={load} className="mt-4 text-secondary font-medium text-primary">Retry</button></div> : items.length === 0 ? <EmptyState hasFilters={search !== ""} /> : <><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-body"><thead><tr className="border-b border-border text-dense text-text-muted"><th className="px-5 py-3 text-left font-medium">Name</th><th className="px-5 py-3 text-left font-medium">Email</th><th className="px-5 py-3 text-left font-medium">Phone</th><th className="px-5 py-3 text-left font-medium">Status</th></tr></thead><tbody>{items.map(c => <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-secondary"><td className="px-5 py-3 font-medium text-text-primary">{c.name}</td><td className="px-5 py-3 text-text-secondary">{c.email ?? "—"}</td><td className="px-5 py-3 text-text-secondary">{c.phone ?? "—"}</td><td className="px-5 py-3"><StatusBadge label={c.isActive ? "Active" : "Inactive"} tone={c.isActive ? "success" : "neutral"} /></td></tr>)}</tbody></table></div><Pagination page={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} /></>}</Card>
  </div>;
}
function EmptyState({ hasFilters }: { hasFilters: boolean }) { return <div className="p-10 text-center"><div className="text-body text-text-primary">{hasFilters ? "No customers match your search." : "No customers yet."}</div><div className="mt-1 text-secondary text-text-muted">{hasFilters ? "Try a different search term." : "Add your first customer to start selling."}</div></div>; }
function TableSkeleton() { return <div className="flex flex-col gap-2 p-4">{[0,1,2,3,4].map(i => <div key={i} className="h-11 animate-pulse rounded-control bg-surface-secondary" />)}</div>; }
