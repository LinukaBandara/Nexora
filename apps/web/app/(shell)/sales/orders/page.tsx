"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  getSalesOrders,
  approveSalesOrder,
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
import { Check, CheckCircle2, ChevronRight, FileText, Plus, ShoppingCart } from "lucide-react";

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
                          <span className="text-[11px] text-[#86998E]">Processed</span>
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
    </div>
  );
}
