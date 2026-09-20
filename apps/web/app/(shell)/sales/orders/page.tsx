"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  getSalesOrders,
  approveSalesOrder,
  createInvoice,
  getInvoiceDetail,
  recordPayment,
  getMe,
  SalesOrderListItem,
  SalesOrderStatus,
} from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MoneyDisplay } from "@/components/ui/MoneyDisplay";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { Toast } from "@/components/ui/Toast";
import { Dialog } from "@/components/ui/Dialog";
import { Check, CheckCircle2, FileText, ShoppingCart, Eye, CreditCard } from "lucide-react";

const PAGE_SIZE = 25;

const STATUS_TABS: { label: string; value: SalesOrderStatus | undefined }[] = [
  { label: "All Orders", value: undefined },
  { label: "Pending Approval", value: "PendingApproval" },
  { label: "Approved", value: "Approved" },
  { label: "Invoiced", value: "Invoiced" },
];

const statusTones: Record<
  SalesOrderStatus,
  "success" | "warning" | "danger" | "info" | "neutral"
> = {
  PendingApproval: "warning",
  Approved: "info",
  PartiallyInvoiced: "info",
  Invoiced: "success",
  Cancelled: "danger",
};

export default function SalesOrdersPage() {
  const [items, setItems] = useState<SalesOrderListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<SalesOrderStatus | undefined>();
  const [canApprove, setCanApprove] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderListItem | null>(null);
  const [invoice, setInvoice] = useState<Awaited<ReturnType<typeof getInvoiceDetail>> | null>(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BankTransfer");
  const [recordingPayment, setRecordingPayment] = useState(false);

  useEffect(() => {
    getMe()
      .then((m) =>
        setCanApprove(m.permissions.some((p) => p.toLowerCase() === "sales.approve"))
      )
      .catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await getSalesOrders({
        status: statusFilter,
        page,
        pageSize: PAGE_SIZE,
      });
      setItems(result.items);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load sales orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, statusFilter]);

  async function handleApprove(id: string, number: string) {
    setApprovingId(id);
    try {
      await approveSalesOrder(id);
      setToastMessage(`${number} has been approved successfully.`);
      load();
    } catch (err) {
      setToastMessage(err instanceof ApiError ? err.message : "Unable to approve this order.");
    } finally {
      setApprovingId(null);
    }
  }

  const pendingCount = items.filter((o) => o.status === "PendingApproval").length;
  const approvedCount = items.filter((o) => o.status === "Approved" || o.status === "Invoiced").length;
  const totalVolume = items.reduce((acc, curr) => acc + curr.total, 0);

  function openOrder(order: SalesOrderListItem) {
    setSelectedOrder(order); setInvoice(null); setPaymentAmount("");
  }

  async function handleCreateInvoice() {
    if (!selectedOrder) return;
    const lines = selectedOrder.items.map(item => ({ salesOrderItemId: item.id, quantity: item.quantity - item.quantityInvoiced })).filter(item => item.quantity > 0);
    if (!lines.length) return;
    setCreatingInvoice(true);
    try { const result = await createInvoice(selectedOrder.id, lines); setInvoice(await getInvoiceDetail(result.invoiceId)); setToastMessage("Invoice created successfully."); await load(); }
    catch (err) { setToastMessage(err instanceof ApiError ? err.message : "Unable to create invoice."); }
    finally { setCreatingInvoice(false); }
  }

  async function handleRecordPayment() {
    if (!invoice) return;
    const amount = Number(paymentAmount); if (!amount || amount <= 0) return;
    setRecordingPayment(true);
    try { await recordPayment(invoice.id, { amount, method: paymentMethod }); setInvoice(await getInvoiceDetail(invoice.id)); setPaymentAmount(""); setToastMessage("Payment recorded successfully."); }
    catch (err) { setToastMessage(err instanceof ApiError ? err.message : "Unable to record payment."); }
    finally { setRecordingPayment(false); }
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-7 pb-8">
      {/* Header */}
      <PageHeader
        breadcrumbs={["Sales", "Orders"]}
        title="Sales Orders"
        description="Track customer orders through quotation, approval, dispatch, and final invoicing."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/sales"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#D9E2DC] bg-white px-3.5 text-xs font-semibold text-[#142019] shadow-sm hover:bg-[#F4F7F5] transition"
            >
              <ShoppingCart size={14} className="text-[#1F7A4D]" />
              <span>Customers</span>
            </Link>
          </div>
        }
      />

      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          label="Total Orders"
          value={totalCount.toLocaleString()}
          variant="dark"
          tag="Order Stream"
          changeLabel="Real-time synchronized"
          changeDirection="up"
        />
        <KpiCard
          label="Pending Approval"
          value={pendingCount.toLocaleString()}
          detail={pendingCount > 0 ? "Requires authorization" : "All orders up to date"}
          changeLabel={pendingCount > 0 ? "Action needed" : "Clean queue"}
          changeDirection={pendingCount > 0 ? "down" : "up"}
        />
        <KpiCard
          label="Page Order Value"
          value={<MoneyDisplay amount={totalVolume} />}
          detail={`${items.length} orders in view`}
          changeLabel="Healthy pipeline"
          changeDirection="up"
        />
      </section>

      {/* Main Card */}
      <div className="overflow-hidden rounded-[18px] border border-[#E3E9E5] bg-white shadow-sm">
        {/* Table Toolbar & Status Tabs */}
        <div className="flex flex-col gap-4 border-b border-[#EAEFEA] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#142019]">Order Registry</h2>
              <span className="rounded-full bg-[#EBF4EE] px-2 py-0.5 text-[10px] font-bold text-[#1F7A4D]">
                {items.length} items
              </span>
            </div>
            <p className="mt-0.5 text-[12px] text-[#697B70]">
              Filter orders by approval and billing milestones.
            </p>
          </div>

          {/* Status Tabs */}
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-[#F0F4F1] p-1 text-xs font-semibold text-[#54685C]">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.label}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={`min-w-max rounded-lg px-3.5 py-1.5 transition-all ${
                  statusFilter === tab.value
                    ? "bg-white text-[#123B2A] shadow-sm"
                    : "hover:text-[#142019]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <TableSkeleton rows={5} />
        ) : error ? (
          <div className="p-6">
            <ErrorState message={error} onRetry={load} />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No orders found"
            description={
              statusFilter
                ? `No sales orders currently have status "${statusFilter}".`
                : "No sales orders exist yet in the system."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-xs">
                <thead>
                  <tr className="border-b border-[#EAEFEA] bg-[#F9FAF9] text-[10px] font-bold uppercase tracking-[0.12em] text-[#6D8174]">
                    <th className="px-6 py-3.5 text-left">Order #</th>
                    <th className="px-6 py-3.5 text-left">Customer</th>
                    <th className="px-6 py-3.5 text-left">Order Date</th>
                    <th className="px-6 py-3.5 text-left">Status</th>
                    <th className="px-6 py-3.5 text-right">Order Total</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEFEA]">
                  {items.map((order) => (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-[#F9FAF9]"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#142019]">{order.number}</div>
                        <div className="text-[10px] font-mono text-[#829488]">ID: {order.id}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-[#2C3F34]">
                        {order.customerName}
                      </td>
                      <td className="px-6 py-4 text-[#617469]">{order.orderDate}</td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          label={order.status}
                          tone={statusTones[order.status] ?? "neutral"}
                        />
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-[#142019]">
                        <MoneyDisplay amount={order.total} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canApprove && order.status === "PendingApproval" ? (
                          <Button
                            variant="secondary"
                            onClick={() => handleApprove(order.id, order.number)}
                            disabled={approvingId === order.id}
                            className="h-8 rounded-lg border-[#CCD8D1] bg-[#F2F7F4] px-3 text-[11px] font-bold text-[#123B2A] hover:bg-[#E3EFE8]"
                          >
                            <Check size={12} strokeWidth={2.5} />
                            <span>{approvingId === order.id ? "Approving..." : "Approve"}</span>
                          </Button>
                        ) : order.status === "Approved" || order.status === "Invoiced" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1F7A4D]">
                            <CheckCircle2 size={13} />
                            <span>Authorized</span>
                          </span>
                        ) : (
                          <button onClick={() => openOrder(order)} className="inline-flex items-center gap-1 rounded-lg border border-[#D9E2DC] px-2.5 py-1.5 text-[11px] font-semibold text-[#234334] hover:bg-[#F4F7F5]"><Eye size={13} /> Open</button>
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
        )}
      </div>
      {selectedOrder && (
        <Dialog title={"Sales Order " + selectedOrder.number} onClose={() => setSelectedOrder(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#F7F9F7] p-3 text-xs">
              <div><div className="text-[#718278]">Customer</div><div className="mt-1 font-semibold text-[#142019]">{selectedOrder.customerName}</div></div>
              <div><div className="text-[#718278]">Status</div><div className="mt-1"><StatusBadge label={selectedOrder.status} tone={statusTones[selectedOrder.status] ?? "neutral"} /></div></div>
            </div>
            <div className="rounded-xl border border-[#E3E9E5] overflow-hidden">
              <div className="border-b border-[#EAEFEA] bg-[#F9FAF9] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#6D8174]">Order lines</div>
              <div className="divide-y divide-[#EAEFEA]">
                {selectedOrder.items.map(item => <div key={item.id} className="flex items-center justify-between px-3 py-3 text-xs"><div><div className="font-semibold text-[#142019]">{item.productName}</div><div className="text-[#718278]">{item.quantityInvoiced} / {item.quantity} invoiced</div></div><MoneyDisplay amount={item.lineTotal} /></div>)}
              </div>
            </div>
            {!invoice && (selectedOrder.status === "Approved" || selectedOrder.status === "PartiallyInvoiced") && (
              <Button variant="primary" onClick={handleCreateInvoice} disabled={creatingInvoice} className="w-full justify-center bg-[#123B2A] text-white">{creatingInvoice ? "Creating invoice..." : "Create Invoice"}</Button>
            )}
            {invoice && (
              <div className="space-y-3 rounded-xl border border-[#D9E2DC] p-4">
                <div className="flex items-center justify-between"><div><div className="text-sm font-bold text-[#142019]">{invoice.number}</div><div className="text-[11px] text-[#718278]">{invoice.status}</div></div><MoneyDisplay amount={invoice.amountDue} /></div>
                <div className="text-[11px] text-[#718278]">Paid {invoice.amountPaid.toLocaleString()} · Due {invoice.amountDue.toLocaleString()}</div>
                {invoice.amountDue > 0 && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2"><input type="number" min="0.01" max={invoice.amountDue} step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="Payment amount" className="h-9 rounded-lg border border-[#D9E2DC] px-3 text-xs outline-none focus:border-[#1F7A4D]" /><select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="h-9 rounded-lg border border-[#D9E2DC] bg-white px-3 text-xs outline-none"><option>BankTransfer</option><option>Cash</option><option>Card</option><option>Cheque</option><option>Other</option></select></div>
                    <Button variant="secondary" onClick={handleRecordPayment} disabled={recordingPayment || !paymentAmount} className="w-full justify-center"><CreditCard size={14} /> {recordingPayment ? "Recording..." : "Record Payment"}</Button>
                  </div>
                )}
                {invoice.payments.length > 0 && <div className="border-t border-[#EAEFEA] pt-3 text-[11px] text-[#718278]">{invoice.payments.length} payment(s) recorded</div>}
              </div>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
