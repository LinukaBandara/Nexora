"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getCustomers, CustomerListItem } from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { Toast } from "@/components/ui/Toast";
import { CreateCustomerDialog } from "@/components/sales/CreateCustomerDialog";
import { ArrowRight, Plus, Users, UserCheck, CreditCard, Building } from "lucide-react";

const PAGE_SIZE = 25;

export default function SalesPage() {
  const [items, setItems] = useState<CustomerListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
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


  const activeCount = items.filter((c) => c.isActive).length;
  const filteredCustomers = items.filter((c) => {
    if (statusFilter === "active") return c.isActive;
    if (statusFilter === "inactive") return !c.isActive;
    return true;
  });

  return (
    <div className="flex flex-col gap-6 sm:gap-7 pb-8">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={["Sales", "Customers"]}
        title="Sales & Customers"
        description="Manage corporate accounts, customer relationships, and direct order workflows."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/sales/orders"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#D9E2DC] bg-white px-3.5 text-xs font-semibold text-[#142019] shadow-sm hover:bg-[#F4F7F5] transition"
            >
              <span>Sales Orders</span>
              <ArrowRight size={13} />
            </Link>
            <Button
              variant="primary"
              onClick={() => setIsCreateOpen(true)}
              className="h-9 gap-1.5 rounded-xl bg-[#123B2A] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#195039]"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Add Customer</span>
            </Button>
          </div>
        }
      />

      {/* Dialog & Toast */}
      {isCreateOpen && (
        <CreateCustomerDialog
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            setIsCreateOpen(false);
            setPage(1);
            load();
            setToastMessage("Customer created successfully");
          }}
        />
      )}
      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          label="Total Customers"
          value={totalCount.toLocaleString()}
          variant="dark"
          tag="CRM Active"
          changeLabel="Customer directory"
          changeDirection="up"
        />
        <KpiCard
          label="Active Accounts"
          value={activeCount.toLocaleString()}
          detail={`${activeCount} in good standing`}
          changeLabel="Current page"
          changeDirection="flat"
        />
        <KpiCard
          label="Current Page"
          value={filteredCustomers.length.toLocaleString()}
          detail="Customers shown after filters"
          changeLabel="Directory view"
          changeDirection="flat"
        />
      </section>

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-[18px] border border-[#E3E9E5] bg-white shadow-sm">
        {/* Table Toolbar */}
        <div className="flex flex-col gap-4 border-b border-[#EAEFEA] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#142019]">Customer Directory</h2>
              <span className="rounded-full bg-[#EBF4EE] px-2 py-0.5 text-[10px] font-bold text-[#1F7A4D]">
                {filteredCustomers.length} records
              </span>
            </div>
            <p className="mt-0.5 text-[12px] text-[#697B70]">
              Search and manage customer commercial records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter Tabs */}
            <div className="flex items-center rounded-xl bg-[#F0F4F1] p-1 text-xs font-semibold text-[#54685C]">
              {(["all", "active", "inactive"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`rounded-lg px-3 py-1.5 capitalize transition-all ${
                    statusFilter === filter
                      ? "bg-white text-[#123B2A] shadow-sm"
                      : "hover:text-[#142019]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-64">
              <SearchInput
                placeholder="Search customers..."
                onSearch={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* Content States */}
        {loading ? (
          <TableSkeleton rows={5} />
        ) : error ? (
          <div className="p-6">
            <ErrorState message={error} onRetry={load} />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <EmptyState
            icon={Building}
            title={search ? "No customers found" : "No customers registered"}
            description={
              search
                ? `No customers match "${search}". Try adjusting your search query.`
                : "Get started by adding your first customer to generate sales quotes and orders."
            }
            actionLabel={search ? undefined : "+ Add Customer"}
            onAction={search ? undefined : () => setIsCreateOpen(true)}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-xs">
                <thead>
                  <tr className="border-b border-[#EAEFEA] bg-[#F9FAF9] text-[10px] font-bold uppercase tracking-[0.12em] text-[#6D8174]">
                    <th className="px-6 py-3.5 text-left">Customer</th>
                    <th className="px-6 py-3.5 text-left">Contact Info</th>
                    <th className="px-6 py-3.5 text-left">Account Type</th>
                    <th className="px-6 py-3.5 text-left">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEFEA]">
                  {filteredCustomers.map((c) => {
                    const initials = c.name.slice(0, 2).toUpperCase();
                    return (
                      <tr
                        key={c.id}
                        className="transition-colors hover:bg-[#F9FAF9]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F3EC] text-xs font-bold text-[#1F7A4D]">
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-[#142019]">{c.name}</div>
                              <div className="mt-0.5 text-[10px] font-mono text-[#829488]">
                                ID: {c.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#4F6256]">
                          <div>{c.email || "—"}</div>
                          <div className="mt-0.5 text-[11px] text-[#7A8C81]">{c.phone || "—"}</div>
                        </td>
                        <td className="px-6 py-4 text-[#4F6256]">
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#F2F5F3] px-2 py-1 text-[11px] font-medium text-[#405448]">
                            Commercial Account
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            label={c.isActive ? "Active" : "Inactive"}
                            tone={c.isActive ? "success" : "neutral"}
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/sales/orders`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1F7A4D] hover:underline"
                          >
                            <span>Orders</span>
                            <ArrowRight size={12} />
                          </Link>
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
    </div>
  );
}
