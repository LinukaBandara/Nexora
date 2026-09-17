"use client";

import { useEffect, useState } from "react";
import { approvePurchaseOrder, createSupplier, getMe, getPurchaseOrders, getSuppliers, PurchaseOrderListItem, SupplierListItem } from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MoneyDisplay } from "@/components/ui/MoneyDisplay";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { Toast } from "@/components/ui/Toast";

const PAGE_SIZE = 25;
const tones: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = { PendingApproval: "warning", Approved: "info", PartiallyReceived: "info", Received: "success", Cancelled: "danger" };

export default function PurchasingPage() {
  const [tab, setTab] = useState<"orders" | "suppliers">("orders");
  const [orders, setOrders] = useState<PurchaseOrderListItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [canApprove, setCanApprove] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true); setError(null);
    try {
      if (tab === "orders") { const r = await getPurchaseOrders({ page, pageSize: PAGE_SIZE }); setOrders(r.items); setTotal(r.totalCount); }
      else { const r = await getSuppliers({ search, page, pageSize: PAGE_SIZE }); setSuppliers(r.items); setTotal(r.totalCount); }
    } catch (e) { setError(e instanceof ApiError ? e.message : "Unable to load purchasing data."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [tab, page, search]);
  useEffect(() => { getMe().then((m) => setCanApprove(m.permissions.includes("purchasing.approve"))).catch(() => {}); }, []);

  async function approve(id: string, number: string) {
    try { await approvePurchaseOrder(id); setToast(`${number} approved`); load(); }
    catch (e) { setToast(e instanceof ApiError ? e.message : "Unable to approve purchase order."); }
  }

  async function saveSupplier(form: HTMLFormElement) {
    const fd = new FormData(form); setSaving(true);
    try {
      await createSupplier({ name: String(fd.get("name")), email: String(fd.get("email") || ""), phone: String(fd.get("phone") || ""), address: String(fd.get("address") || ""), defaultPaymentTermDays: Number(fd.get("terms") || 30) });
      setSupplierOpen(false); setToast("Supplier created successfully"); setPage(1); load();
    } catch (e) { setToast(e instanceof ApiError ? e.message : "Unable to create supplier."); }
    finally { setSaving(false); }
  }

  return <div className="flex flex-col gap-5 sm:gap-6">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-page-title font-semibold tracking-tight text-text-primary">Purchasing</div><div className="mt-1 text-secondary text-text-muted">Manage suppliers and the Purchase Order → Goods Receipt → Supplier Invoice workflow.</div></div>{tab === "suppliers" && <Button variant="primary" onClick={() => setSupplierOpen(true)}>+ Add supplier</Button>}</header>
    <div className="flex gap-1 rounded-control bg-surface-secondary p-1 w-fit"><button onClick={() => { setTab("orders"); setPage(1); }} className={`rounded-control px-4 py-2 text-secondary font-medium ${tab === "orders" ? "bg-white text-primary shadow-card" : "text-text-muted"}`}>Purchase orders</button><button onClick={() => { setTab("suppliers"); setPage(1); }} className={`rounded-control px-4 py-2 text-secondary font-medium ${tab === "suppliers" ? "bg-white text-primary shadow-card" : "text-text-muted"}`}>Suppliers</button></div>
    {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    {tab === "suppliers" && <div className="max-w-xl"><SearchInput placeholder="Search suppliers..." onSearch={(v) => { setSearch(v); setPage(1); }} /></div>}
    <Card className="overflow-hidden">
      {loading ? <TableSkeleton /> : error ? <div className="p-8 text-center"><div className="text-body font-medium text-text-primary">Unable to load purchasing data.</div><div className="mt-1 text-secondary text-text-muted">{error}</div><button onClick={load} className="mt-4 text-secondary font-medium text-primary">Retry</button></div> : tab === "orders" ? <OrderTable orders={orders} canApprove={canApprove} onApprove={approve} /> : <SupplierTable suppliers={suppliers} />}
      {!loading && !error && <Pagination page={page} pageSize={PAGE_SIZE} totalCount={total} onPageChange={setPage} />}
    </Card>
    {supplierOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"><form onSubmit={(e) => { e.preventDefault(); saveSupplier(e.currentTarget); }} className="w-full max-w-lg rounded-dialog bg-white p-6 shadow-dialog"><div className="text-lg font-semibold text-text-primary">Add supplier</div><div className="mt-5 grid gap-3 sm:grid-cols-2">{[["name","Name","text"],["email","Email","email"],["phone","Phone","text"],["address","Address","text"],["terms","Payment terms (days)","number"]].map(([name,label,type]) => <label key={name} className="text-secondary font-medium text-text-secondary sm:col-span-1"><span className="mb-1.5 block text-dense">{label}</span><input required={name === "name"} name={name} type={type} defaultValue={name === "terms" ? "30" : ""} className="w-full rounded-input border border-border bg-white px-3 py-2.5 text-body outline-none focus:border-primary" /></label>)}</div><div className="mt-6 flex justify-end gap-2"><Button variant="secondary" type="button" onClick={() => setSupplierOpen(false)}>Cancel</Button><Button variant="primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Create supplier"}</Button></div></form></div>}
  </div>;
}

function OrderTable({ orders, canApprove, onApprove }: { orders: PurchaseOrderListItem[]; canApprove: boolean; onApprove: (id: string, number: string) => void }) { if (!orders.length) return <div className="p-10 text-center text-secondary text-text-muted">No purchase orders yet.</div>; return <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-body"><thead><tr className="border-b border-border text-dense text-text-muted"><th className="px-5 py-3 text-left">Order</th><th className="px-5 py-3 text-left">Supplier</th><th className="px-5 py-3 text-left">Date</th><th className="px-5 py-3 text-left">Status</th><th className="px-5 py-3 text-right">Total</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody>{orders.map((o) => <tr key={o.id} className="border-b border-border last:border-0 hover:bg-surface-secondary"><td className="px-5 py-3 font-medium text-text-primary">{o.number}</td><td className="px-5 py-3 text-text-secondary">{o.supplierName}</td><td className="px-5 py-3 text-text-muted">{o.orderDate}</td><td className="px-5 py-3"><StatusBadge label={o.status} tone={tones[o.status] ?? "neutral"} /></td><td className="px-5 py-3 text-right font-medium"><MoneyDisplay amount={o.total} /></td><td className="px-5 py-3 text-right">{canApprove && o.status === "PendingApproval" && <Button variant="secondary" onClick={() => onApprove(o.id, o.number)}>Approve</Button>}</td></tr>)}</tbody></table></div>; }
function SupplierTable({ suppliers }: { suppliers: SupplierListItem[] }) { if (!suppliers.length) return <div className="p-10 text-center text-secondary text-text-muted">No suppliers found.</div>; return <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-body"><thead><tr className="border-b border-border text-dense text-text-muted"><th className="px-5 py-3 text-left">Supplier</th><th className="px-5 py-3 text-left">Email</th><th className="px-5 py-3 text-left">Phone</th><th className="px-5 py-3 text-left">Status</th></tr></thead><tbody>{suppliers.map((s) => <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-secondary"><td className="px-5 py-3 font-medium text-text-primary">{s.name}</td><td className="px-5 py-3 text-text-secondary">{s.email ?? "—"}</td><td className="px-5 py-3 text-text-secondary">{s.phone ?? "—"}</td><td className="px-5 py-3"><StatusBadge label={s.isActive ? "Active" : "Inactive"} tone={s.isActive ? "success" : "neutral"} /></td></tr>)}</tbody></table></div>; }
function TableSkeleton() { return <div className="flex flex-col gap-2 p-4">{[0,1,2,3,4].map((i) => <div key={i} className="h-11 animate-pulse rounded-control bg-surface-secondary" />)}</div>; }
