"use client";

import React, { useEffect, useState } from "react";
import {
  getFinancialSummary,
  getFinanceTransactions,
  FinancialSummary,
  FinanceTransaction,
} from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { MoneyDisplay } from "@/components/ui/MoneyDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DualBarChart, DualBarPoint } from "@/components/ui/DualBarChart";
import { DonutChart } from "@/components/ui/DonutChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CircleDollarSign,
  CreditCard,
  Layers,
  Receipt,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}
function monthStart() {
  const d = new Date();
  return iso(new Date(d.getFullYear(), d.getMonth(), 1));
}
function today() {
  return iso(new Date());
}

export default function FinancePage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const from = monthStart();
      const to = today();
      const [sum, txs] = await Promise.all([
        getFinancialSummary(from, to),
        getFinanceTransactions({ from, to, page: 1, pageSize: 10 }).catch(() => ({
          items: [],
          totalCount: 0,
          page: 1,
          pageSize: 10,
        })),
      ]);
      setSummary(sum);
      setTransactions(txs.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load financial data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 sm:gap-7 pb-8">
        <div className="h-16 w-80 animate-pulse rounded-xl bg-[#E8EDE9]" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-[16px] bg-[#E8EDE9]" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-[18px] bg-[#E8EDE9]" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex flex-col gap-6 pb-8">
        <PageHeader
          breadcrumbs={["Accounting", "Finance"]}
          title="Finance & Cash Position"
          description="Monitor cash flow, receivables and payables."
        />
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  // Dual bar chart data points for visualization
  const chartData: DualBarPoint[] = [
    { label: "W1", income: Math.round(summary.income * 0.22), expenses: Math.round(summary.expenses * 0.2) },
    { label: "W2", income: Math.round(summary.income * 0.26), expenses: Math.round(summary.expenses * 0.28) },
    { label: "W3", income: Math.round(summary.income * 0.31), expenses: Math.round(summary.expenses * 0.24) },
    { label: "W4", income: Math.round(summary.income * 0.21), expenses: Math.round(summary.expenses * 0.28) },
  ];

  const totalPosition = Math.max(summary.receivables + summary.payables, 1);
  const receivableRatio = Math.round((summary.receivables / totalPosition) * 100);
  const payableRatio = Math.round((summary.payables / totalPosition) * 100);

  return (
    <div className="flex flex-col gap-6 sm:gap-7 pb-8">
      {/* Header */}
      <PageHeader
        breadcrumbs={["Accounting", "Finance"]}
        title="Finance"
        description="Monitor cash flow, customer receivables, supplier obligations and operating margins."
        actions={
          <button
            onClick={load}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#D7DFDA] bg-white px-3.5 text-xs font-semibold text-[#142019] shadow-sm hover:bg-[#F2F5F3] transition"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        }
        dateBadge={
          <div className="flex items-center gap-1.5 rounded-xl border border-[#E3E9E5] bg-white px-3 py-2 text-xs font-medium text-[#526458] shadow-sm">
            <Calendar size={13} className="text-[#1F7A4D]" />
            <span>
              {monthStart()} — {today()}
            </span>
          </div>
        }
      />

      {/* KPI Cards Row (Income, Expenses, Net Cash Flow, Receivables, Payables) */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Total Income"
          value={<MoneyDisplay amount={summary.income} />}
          variant="dark"
          tag="Revenue"
          changeLabel="Period inflow"
          changeDirection="up"
        />
        <KpiCard
          label="Total Expenses"
          value={<MoneyDisplay amount={summary.expenses} />}
          detail="Procurement & overhead"
          changeLabel="Operating costs"
          changeDirection="down"
        />
        <KpiCard
          label="Net Cash Flow"
          value={<MoneyDisplay amount={summary.netCashFlow} />}
          detail="Current-period net movement"
          changeLabel={summary.netCashFlow >= 0 ? "+ Surplus" : "- Deficit"}
          changeDirection={summary.netCashFlow >= 0 ? "up" : "down"}
        />
        <KpiCard
          label="Customer Receivables"
          value={<MoneyDisplay amount={summary.receivables} />}
          detail="Invoiced balances due"
          changeLabel="Asset pipeline"
          changeDirection="up"
        />
        <KpiCard
          label="Supplier Payables"
          value={<MoneyDisplay amount={summary.payables} />}
          detail="Committed invoices"
          changeLabel="Liabilities"
          changeDirection="down"
        />
      </section>

      {/* Cash Flow Visualizations */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Large Cash Flow Chart Card */}
        <div className="lg:col-span-2 rounded-[18px] border border-[#E3E9E5] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#EAEFEA] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#142019]">Cash Flow Dynamics</h2>
                <span className="rounded-full bg-[#EBF4EE] px-2 py-0.5 text-[10px] font-bold text-[#1F7A4D]">
                  Current Month
                </span>
              </div>
              <p className="mt-0.5 text-[12px] text-[#697B70]">
                Illustrative weekly allocation of the current-period income and expense totals.
              </p>
            </div>

            {/* Reference-style Legend */}
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-[#142019]">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#123B2A]" />
                <span>Income</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#142019]">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#8EE04E]" />
                <span>Expenses</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <div className="mb-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#73857A]">
                Net Position
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#142019] mt-0.5">
                <MoneyDisplay amount={summary.netCashFlow} />
              </div>
            </div>
            <DualBarChart data={chartData} height={200} />
          </div>
        </div>

        {/* Balance Ratio Card */}
        <div className="rounded-[18px] border border-[#E3E9E5] bg-white p-5 sm:p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-[#EAEFEA] pb-4">
            <div>
              <h2 className="text-sm font-bold text-[#142019]">Balance Allocation</h2>
              <p className="mt-0.5 text-[12px] text-[#697B70]">Receivables vs. Payables</p>
            </div>
            <StatusBadge label="Current mix" tone="neutral" />
          </div>

          <div className="mt-5 flex flex-1 items-center justify-center">
            <DonutChart
              segments={[
                { label: "Receivables", value: summary.receivables, color: "#1F7A4D" },
                { label: "Payables", value: summary.payables, color: "#C84A4A" },
              ]}
              size={180}
              thickness={36}
              centerLabel="Receivable share"
              centerValue={`${receivableRatio}%`}
            />
          </div>

          <div className="mt-4 rounded-xl border border-[#E3E9E5] bg-[#F9FAF9] p-3.5 text-xs text-[#526558]">
            <div className="font-semibold text-[#142019]">Liquid Margin Factor</div>
            <div className="mt-0.5 text-[11px] text-[#728479]">
              Receivables represent {receivableRatio}% of the combined receivable and payable balance.
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="overflow-hidden rounded-[18px] border border-[#E3E9E5] bg-white shadow-sm">
        <div className="border-b border-[#EAEFEA] px-6 py-4">
          <h2 className="text-sm font-bold text-[#142019]">Recent Financial Journal</h2>
          <p className="mt-0.5 text-[12px] text-[#697B70]">
            Audit of latest settlements, vendor payments and sales receipts.
          </p>
        </div>

        {transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No transactions logged"
            description="Recent payment vouchers and receipts will appear in this ledger."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-xs">
              <thead>
                <tr className="border-b border-[#EAEFEA] bg-[#F9FAF9] text-[10px] font-bold uppercase tracking-[0.12em] text-[#6D8174]">
                  <th className="px-6 py-3.5 text-left">Transaction Details</th>
                  <th className="px-6 py-3.5 text-left">Type</th>
                  <th className="px-6 py-3.5 text-left">Date</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFEA]">
                {transactions.map((tx) => {
                  const isIncome = tx.type.toLowerCase() === "income";
                  return (
                    <tr
                      key={tx.id}
                      className="transition-colors hover:bg-[#F9FAF9]"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#142019]">{tx.description}</div>
                        <div className="text-[10px] font-mono text-[#829488]">ID: {tx.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          label={tx.type}
                          tone={isIncome ? "success" : "danger"}
                        />
                      </td>
                      <td className="px-6 py-4 text-[#617468]">{tx.date}</td>
                      <td className="px-6 py-4 text-right font-bold text-[#142019]">
                        <span className={isIncome ? "text-[#1F7A4D]" : "text-[#142019]"}>
                          {isIncome ? "+ " : "- "}
                          <MoneyDisplay amount={tx.amount} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
