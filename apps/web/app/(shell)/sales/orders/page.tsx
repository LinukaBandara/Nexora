"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSalesOrders, approveSalesOrder, getMe, SalesOrderListItem, SalesOrderStatus } from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MoneyDisplay } from "@/components/ui/MoneyDisplay";
import { Pagination } from "@/components/ui/Pagination";
import { Toast } from "@/components/ui/Toast";

const PAGE_SIZE = 25;
const STATUS_TABS: { label: string; value: SalesOrderStatus | undefined }[] = [{ label: "All", value: undefined }, { label: "Pending approval", value: "PendingApproval" }, { label: "Approved", value: "Approved" }, { label: "Invoiced", value: "Invoiced" }];
const tones: Record<SalesOrderStatus, "success" | "warning" | "danger" | "info" | "neutral"> = { PendingApproval: "warning", Approved: "info", PartiallyInvoiced: "info", Invoiced: "success", Cancelled: "danger" };
export default function SalesOrdersPage() {
  const [items, setItems] = useState<SalesOrderListItem[]>([]); const [totalCount, setTotalCount] = useState(0); const [page, setPage] = useState(1); const [statusFilter, setStatusFilter] = useState<SalesOrderStatus | undefined>(); const [canApprove, setCanApprove] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [approvingId, setApprovingId] = useState<string | null>(null); const [toastMessage, setToastMessage] = useState<string | null>(null);
  useEffect(() => { getMe().then(m => setCanApprove(m.permissions.includes("sales.approve"))).catch(() => {}); }, []);
  async function load() { setLoading(true); setError(null); try { const result = await getSalesOrders({ status: statusFilter, page, pageSize: PAGE_SIZE }); setItems(result.items); setTotalCount(result.totalCount); } catch (err) { setError(err instanceof ApiError ? err.message : "Unable to load sales orders."); } finally { setLoading(false); } }
  useEffect(() => { load(); }, [page, statusFilter]);
  async function handleApprove(id: string, number: string) { setApprovingId(id); try { await approveSalesOrder(id); setToastMessage(`${number} approved`); load(); } catch (err) { setToastMessage(err instanceof ApiError ? err.message : "Unable to approve this order."); } finally { setApprovingId(null); } }
  return <div className="flex flex-col gap-5 sm:gap-6"><header><div className="text-page-title font-semibold tracking-tight text-text-primary">Sales orders</div><div className="mt-1 text-secondary text-text-muted">Quotation → Order → Invoice → Payment. <Link href="/sales" className="font-medium text-primary hover:underline">View customers →</Link></div></header>
    <div className="flex max-w-full gap-1 overflow-x-auto rounded-control bg-surface-secondary p-1">{STATUS_TABS.map(tab => <button key={tab.label} onClick={() => { setStatusFilter(tab.value); setPage(1); }} className={`min-w-max rounded-control px-3 py-2 text-secondary font-medium ${statusFilter === tab.value ? "bg-white text-primary shadow-card" : "text-text-muted"}`}>{tab.label}</button>)}</div>
    {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}
    <Card className="overflow-hidden">{loading ? <TableSkeleton /> : error ? <div className="p-8 text-center"><div className="font-medium text-text-primary">Unable to load sales orders.</div><div className="mt-1 text-secondary text-text-muted">{error}</div><button onClick={load} className="mt-4 text-primary font-medium">Retry</button></div> : items.length === 0 ? <div className="p-10 text-center text-secondary text-text-muted">No orders match this filter.</div> : <><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-body"><thead><tr className="border-b border-border text-dense text-text-muted"><th className="px-5 py-3 text-left font-medium">Order</th><th className="px-5 py-3 text-left font-medium">Customer</th><th className="px-5 py-3 text-left font-medium">Date</th><th className="px-5 py-3 text-left font-medium">Status</th><th className="px-5 py-3 text-right font-medium">Total</th><th className="px-5 py-3 text-right font-medium">Actions</th></tr></thead><tbody>{items.map(o => <tr key={o.id} className="border-b border-border last:border-0 hover:bg-surface-secondary"><td className="px-5 py-3 font-medium text-text-primary">{o.number}</td><td className="px-5 py-3 text-text-secondary">{o.customerName}</td><td className="px-5 py-3 text-text-muted">{o.orderDate}</td><td className="px-5 py-3"><StatusBadge label={o.status} tone={tones[o.status]} /></td><td className="px-5 py-3 text-right font-medium"><MoneyDisplay amount={o.total} /></td><td className="px-5 py-3 text-right">{canApprove && o.status === "PendingApproval" && <Button variant="secondary" onClick={() => handleApprove(o.id, o.number)} disabled={approvingId === o.id}>{approvingId === o.id ? "Approving..." : "Approve"}</Button>}</td></tr>)}</tbody></table></div><Pagination page={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} /></>}</Card>
  </div>;
}
function TableSkeleton() { return <div className="flex flex-col gap-2 p-4">{[0,1,2,3,4].map(i => <div key={i} className="h-11 animate-pulse rounded-control bg-surface-secondary" />)}</div>; }
