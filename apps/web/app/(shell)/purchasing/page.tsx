"use client";

import React, { useEffect, useState } from "react";
import {
  approvePurchaseOrder,
  receiveGoods,
  createSupplierInvoice,
  createSupplier,
  getMe,
  getPurchaseOrders,
  getSuppliers,
  PurchaseOrderListItem,
  SupplierListItem,
} from "@/lib/nexora-api";
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
import { Dialog } from "@/components/ui/Dialog";
import { Toast } from "@/components/ui/Toast";
import {
  Building2,
  Check,
  CheckCircle2,
  FileText,
  Plus,
  RotateCcw,
  Truck,
  Users,
} from "lucide-react";

const PAGE_SIZE = 25;

const orderTones: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  PendingApproval: "warning",
  Approved: "info",
  PartiallyReceived: "info",
  Received: "success",
  Cancelled: "danger",
};

export default function PurchasingPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "suppliers">("orders");
  const [orders, setOrders] = useState<PurchaseOrderListItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [canApprove, setCanApprove] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isApprovingId, setIsApprovingId] = useState<string | null>(null);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderListItem | null>(null);
  const [receiving, setReceiving] = useState(false);
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [supplierInvoiceTotal, setSupplierInvoiceTotal] = useState("");
  const [savingSupplierInvoice, setSavingSupplierInvoice] = useState(false);

  useEffect(() => {
    getMe()
      .then((m) =>
        setCanApprove(m.permissions.some((p) => p.toLowerCase() === "purchasing.approve"))
      )
      .catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "orders") {
        const res = await getPurchaseOrders({ page, pageSize: PAGE_SIZE });
        setOrders(res.items);
        setTotalCount(res.totalCount);
      } else {
        const res = await getSuppliers({ search, page, pageSize: PAGE_SIZE });
        setSuppliers(res.items);
        setTotalCount(res.totalCount);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load purchasing data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [activeTab, page, search]);

  async function handleApprove(id: string, number: string) {
    setIsApprovingId(id);
    try {
      await approvePurchaseOrder(id);
      setToastMessage(`Purchase order ${number} approved.`);
      load();
    } catch (err) {
      setToastMessage(err instanceof ApiError ? err.message : "Unable to approve purchase order.");
    } finally {
      setIsApprovingId(null);
    }
  }

  async function handleSaveSupplier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSavingSupplier(true);
    try {
      await createSupplier({
        name: String(fd.get("name")),
        email: String(fd.get("email") || ""),
        phone: String(fd.get("phone") || ""),
        address: String(fd.get("address") || ""),
        defaultPaymentTermDays: Number(fd.get("terms") || 30),
      });
      setIsSupplierModalOpen(false);
      setToastMessage("Supplier created successfully.");
      setPage(1);
      load();
    } catch (err) {
      setToastMessage(err instanceof ApiError ? err.message : "Unable to create supplier.");
    } finally {
      setSavingSupplier(false);
    }
  }

  const pendingOrdersCount = orders.filter((o) => o.status === "PendingApproval").length;
  const approvedOrdersCount = orders.filter((o) => o.status === "Approved" || o.status === "Received").length;
  const totalCommitted = orders.reduce((acc, curr) => acc + curr.total, 0);

  function openOrder(order: PurchaseOrderListItem) { setSelectedOrder(order); setSupplierInvoiceNumber(""); setSupplierInvoiceTotal(String(order.total)); }

  async function handleReceive() {
    if (!selectedOrder) return;
    const lines = selectedOrder.items.map(item => ({ purchaseOrderItemId: item.id, quantity: item.quantity - item.quantityReceived })).filter(item => item.quantity > 0);
    if (!lines.length) return;
    setReceiving(true);
    try { await receiveGoods(selectedOrder.id, lines, "Received through NEXORA purchasing workflow"); setToastMessage(`Goods received for ${selectedOrder.number}.`); setSelectedOrder(null); await load(); }
    catch (err) { setToastMessage(err instanceof ApiError ? err.message : "Unable to receive goods."); }
    finally { setReceiving(false); }
  }

  async function handleSupplierInvoice() {
    if (!selectedOrder || !supplierInvoiceNumber.trim()) return;
    const total = Number(supplierInvoiceTotal); if (!total || total <= 0) return;
    setSavingSupplierInvoice(true);
    try { await createSupplierInvoice(selectedOrder.id, { supplierInvoiceNumber: supplierInvoiceNumber.trim(), total }); setToastMessage("Supplier invoice recorded."); setSupplierInvoiceNumber(""); }
    catch (err) { setToastMessage(err instanceof ApiError ? err.message : "Unable to record supplier invoice."); }
    finally { setSavingSupplierInvoice(false); }
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-7 pb-8">
      {/* Header */}
      <PageHeader
        breadcrumbs={["Procurement", "Purchasing"]}
        title="Purchasing"
        description="Manage vendor relationships, purchase order workflows, goods receipt and payables."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={() => setIsSupplierModalOpen(true)}
              className="h-9 gap-1.5 rounded-xl bg-[#123B2A] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#195039]"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Add Supplier</span>
            </Button>
          </div>
        }
      />

      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Purchase Orders"
          value={activeTab === "orders" ? totalCount.toLocaleString() : orders.length.toLocaleString()}
          variant="dark"
          tag="Procurement"
          changeLabel="Automated tracking"
          changeDirection="up"
        />
        <KpiCard
          label="Pending Approval"
          value={pendingOrdersCount.toLocaleString()}
          detail={pendingOrdersCount > 0 ? "Requires authorization" : "Zero approvals waiting"}
          changeLabel={pendingOrdersCount > 0 ? "Needs review" : "Optimal"}
          changeDirection={pendingOrdersCount > 0 ? "down" : "up"}
        />
        <KpiCard
          label="Authorized / Received"
          value={approvedOrdersCount.toLocaleString()}
          detail="In-flight and completed POs"
          changeLabel="Normal operations"
          changeDirection="up"
        />
        <KpiCard
          label="Total Commitments"
          value={<MoneyDisplay amount={totalCommitted} />}
          detail="Active orders on page"
          changeLabel="Within budget"
          changeDirection="up"
        />
      </section>

      {/* Main Content Card */}
      <div className="overflow-hidden rounded-[18px] border border-[#E3E9E5] bg-white shadow-sm">
        {/* Tab & Toolbar Bar */}
        <div className="flex flex-col gap-4 border-b border-[#EAEFEA] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Navigation Pill Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-[#F0F4F1] p-1 text-xs font-semibold text-[#54685C]">
            <button
              onClick={() => {
                setActiveTab("orders");
                setPage(1);
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-all ${
                activeTab === "orders"
                  ? "bg-white text-[#123B2A] shadow-sm"
                  : "hover:text-[#142019]"
              }`}
            >
              <FileText size={14} />
              <span>Purchase Orders</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("suppliers");
                setPage(1);
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-all ${
                activeTab === "suppliers"
                  ? "bg-white text-[#123B2A] shadow-sm"
                  : "hover:text-[#142019]"
              }`}
            >
              <Building2 size={14} />
              <span>Suppliers ({suppliers.length})</span>
            </button>
          </div>

          {/* Supplier Search when in suppliers tab */}
          {activeTab === "suppliers" && (
            <div className="w-full sm:w-64">
              <SearchInput
                placeholder="Search suppliers..."
                onSearch={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
              />
            </div>
          )}
        </div>

        {/* Content View */}
        {loading ? (
          <TableSkeleton rows={5} />
        ) : error ? (
          <div className="p-6">
            <ErrorState message={error} onRetry={load} />
          </div>
        ) : activeTab === "orders" ? (
          orders.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No purchase orders"
              description="Purchase orders created for inventory replenishment will appear in this registry."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-xs">
                  <thead>
                    <tr className="border-b border-[#EAEFEA] bg-[#F9FAF9] text-[10px] font-bold uppercase tracking-[0.12em] text-[#6D8174]">
                      <th className="px-6 py-3.5 text-left">PO Number</th>
                      <th className="px-6 py-3.5 text-left">Supplier</th>
                      <th className="px-6 py-3.5 text-left">Order Date</th>
                      <th className="px-6 py-3.5 text-left">Status</th>
                      <th className="px-6 py-3.5 text-right">Committed Total</th>
                      <th className="px-6 py-3.5 text-right">Approval Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEFEA]">
                    {orders.map((po) => (
                      <tr
                        key={po.id}
                        className="transition-colors hover:bg-[#F9FAF9]"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#142019]">{po.number}</div>
                          <div className="text-[10px] font-mono text-[#829488]">ID: {po.id}</div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-[#2C3E33]">
                          {po.supplierName}
                        </td>
                        <td className="px-6 py-4 text-[#617468]">{po.orderDate}</td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            label={po.status}
                            tone={orderTones[po.status] ?? "neutral"}
                          />
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-[#142019]">
                          <MoneyDisplay amount={po.total} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {canApprove && po.status === "PendingApproval" ? (
                            <Button
                              variant="secondary"
                              onClick={() => handleApprove(po.id, po.number)}
                              disabled={isApprovingId === po.id}
                              className="h-8 rounded-lg border-[#CCD8D1] bg-[#F2F7F4] px-3 text-[11px] font-bold text-[#123B2A] hover:bg-[#E3EFE8]"
                            >
                              <Check size={12} strokeWidth={2.5} />
                              <span>{isApprovingId === po.id ? "Approving..." : "Approve PO"}</span>
                            </Button>
                          ) : po.status === "Approved" || po.status === "Received" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1F7A4D]">
                              <CheckCircle2 size={13} />
                              <span>Approved</span>
                            </span>
                          ) : (
                            <button onClick={() => openOrder(order)} className="inline-flex items-center gap-1 rounded-lg border border-[#D9E2DC] px-2.5 py-1.5 text-[11px] font-semibold text-[#234334] hover:bg-[#F4F7F5]">Open</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                totalCount={totalCount}
                onPageChange={setPage}
              />
            </>
          )
        ) : suppliers.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={search ? "No suppliers found" : "No suppliers registered"}
            description={
              search
                ? `No suppliers matched "${search}". Try adjusting the filter.`
                : "Register approved suppliers to start creating procurement purchase orders."
            }
            actionLabel={search ? undefined : "+ Add Supplier"}
            onAction={search ? undefined : () => setIsSupplierModalOpen(true)}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-xs">
                <thead>
                  <tr className="border-b border-[#EAEFEA] bg-[#F9FAF9] text-[10px] font-bold uppercase tracking-[0.12em] text-[#6D8174]">
                    <th className="px-6 py-3.5 text-left">Supplier</th>
                    <th className="px-6 py-3.5 text-left">Contact Info</th>
                    <th className="px-6 py-3.5 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEFEA]">
                  {suppliers.map((s) => {
                    const initials = s.name.slice(0, 2).toUpperCase();
                    return (
                      <tr
                        key={s.id}
                        className="transition-colors hover:bg-[#F9FAF9]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F3EC] text-xs font-bold text-[#1F7A4D]">
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-[#142019]">{s.name}</div>
                              <div className="text-[10px] font-mono text-[#829488]">ID: {s.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#4F6256]">
                          <div>{s.email || "—"}</div>
                          <div className="mt-0.5 text-[11px] text-[#7A8C81]">{s.phone || "—"}</div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            label={s.isActive ? "Active Supplier" : "Inactive"}
                            tone={s.isActive ? "success" : "neutral"}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={totalCount}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Add Supplier Dialog */}
      {selectedOrder && activeTab === "orders" && (
        <Dialog title={"Purchase Order " + selectedOrder.number} onClose={() => setSelectedOrder(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#F7F9F7] p-3 text-xs">
              <div><div className="text-[#718278]">Supplier</div><div className="mt-1 font-semibold text-[#142019]">{selectedOrder.supplierName}</div></div>
              <div><div className="text-[#718278]">Status</div><div className="mt-1"><StatusBadge label={selectedOrder.status} tone={orderTones[selectedOrder.status] ?? "neutral"} /></div></div>
            </div>
            <div className="rounded-xl border border-[#E3E9E5] overflow-hidden">
              <div className="border-b border-[#EAEFEA] bg-[#F9FAF9] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#6D8174]">Purchase lines</div>
              <div className="divide-y divide-[#EAEFEA]">
                {selectedOrder.items.map(item => <div key={item.id} className="flex items-center justify-between px-3 py-3 text-xs"><div><div className="font-semibold text-[#142019]">{item.productName}</div><div className="text-[#718278]">{item.quantityReceived} / {item.quantity} received</div></div><MoneyDisplay amount={item.lineTotal} /></div>)}
              </div>
            </div>
            {(selectedOrder.status === "Approved" || selectedOrder.status === "PartiallyReceived") && (
              <Button variant="primary" onClick={handleReceive} disabled={receiving} className="w-full justify-center bg-[#123B2A] text-white">{receiving ? "Receiving goods..." : "Receive Outstanding Goods"}</Button>
            )}
            {(selectedOrder.status === "Approved" || selectedOrder.status === "PartiallyReceived" || selectedOrder.status === "Received") && (
              <div className="space-y-2 rounded-xl border border-[#D9E2DC] p-4">
                <div className="text-xs font-bold text-[#142019]">Supplier invoice</div>
                <div className="grid grid-cols-2 gap-2"><input value={supplierInvoiceNumber} onChange={e => setSupplierInvoiceNumber(e.target.value)} placeholder="Invoice number" className="h-9 rounded-lg border border-[#D9E2DC] px-3 text-xs outline-none" /><input type="number" min="0.01" step="0.01" value={supplierInvoiceTotal} onChange={e => setSupplierInvoiceTotal(e.target.value)} placeholder="Total" className="h-9 rounded-lg border border-[#D9E2DC] px-3 text-xs outline-none" /></div>
                <Button variant="secondary" onClick={handleSupplierInvoice} disabled={savingSupplierInvoice || !supplierInvoiceNumber.trim()} className="w-full justify-center">{savingSupplierInvoice ? "Saving..." : "Record Supplier Invoice"}</Button>
              </div>
            )}
          </div>
        </Dialog>
      )}
      {isSupplierModalOpen && (
        <Dialog title="Add approved supplier" onClose={() => setIsSupplierModalOpen(false)}>
          <form onSubmit={handleSaveSupplier} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#4D6054]">
                Supplier / Company Name *
              </label>
              <input
                required
                name="name"
                placeholder="e.g. Lanka Agri Supplies Ltd."
                className="w-full rounded-xl border border-[#D5DDD8] bg-white px-3.5 py-2.5 text-xs text-[#142019] placeholder:text-[#91A297] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#4D6054]">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="orders@supplier.com"
                  className="w-full rounded-xl border border-[#D5DDD8] bg-white px-3.5 py-2.5 text-xs text-[#142019] placeholder:text-[#91A297] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#4D6054]">
                  Phone Number
                </label>
                <input
                  name="phone"
                  placeholder="+94 11 000 0000"
                  className="w-full rounded-xl border border-[#D5DDD8] bg-white px-3.5 py-2.5 text-xs text-[#142019] placeholder:text-[#91A297] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#4D6054]">
                  Physical / Office Address
                </label>
                <input
                  name="address"
                  placeholder="City, Industrial Zone"
                  className="w-full rounded-xl border border-[#D5DDD8] bg-white px-3.5 py-2.5 text-xs text-[#142019] placeholder:text-[#91A297] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#4D6054]">
                  Default Terms (days)
                </label>
                <input
                  type="number"
                  name="terms"
                  defaultValue="30"
                  className="w-full rounded-xl border border-[#D5DDD8] bg-white px-3.5 py-2.5 text-xs text-[#142019] placeholder:text-[#91A297] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
                />
              </div>
            </div>

            <div className="mt-2 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsSupplierModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingSupplier}
                className="rounded-xl bg-[#123B2A] text-xs font-semibold text-white hover:bg-[#184F38]"
              >
                {savingSupplier ? "Saving..." : "Save Supplier"}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
