"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, TrendingUp, BarChart2 } from "lucide-react";
import { getDashboardOverview, DashboardOverview } from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { MoneyDisplay } from "@/components/ui/MoneyDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LineChart } from "@/components/ui/LineChart";
import { BarChart } from "@/components/ui/BarChart";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function startOfMonthISO() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); }

type ChartMode = "line" | "bar";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<ChartMode>("line");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setData(await getDashboardOverview(startOfMonthISO(), todayISO()));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load the dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const trend = useMemo(() => data?.revenueTrend.map(p => p.revenue) ?? [], [data]);
  const latest = trend.at(-1) ?? 0;
  const previous = trend.at(-2) ?? latest;
  const direction = latest > previous ? "up" : latest < previous ? "down" : "flat";
  const change = previous === 0 ? "No prior-day comparison" : `${Math.abs(((latest - previous) / previous) * 100).toFixed(1)}% vs previous day`;

  const formatLKR = (v: number) =>
    new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(v);

  if (loading) return <DashboardSkeleton />;
  if (error || !data) return (
    <Card className="p-8">
      <div className="text-[15px] font-semibold text-text-primary">Unable to load dashboard</div>
      <div className="mt-1 text-secondary text-text-muted">{error}</div>
      <button onClick={load} className="mt-5 rounded-input bg-primary px-4 py-2 text-sm font-semibold text-white">Retry</button>
    </Card>
  );

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 pb-8 lg:gap-7">
      {/* Page Header */}
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Business overview</div>
          <h1 className="mt-2 text-[27px] font-bold tracking-[-0.035em] text-text-primary sm:text-[31px]">Overview</h1>
          <p className="mt-1.5 text-[13px] text-text-muted">Your business at a glance for the current month.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 self-start rounded-[11px] border border-border bg-white px-3.5 py-2.5 text-[11px] font-medium text-text-secondary shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {startOfMonthISO()} — {todayISO()}
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Revenue" value={<MoneyDisplay amount={data.revenue} />} variant="dark" sparkline={trend} changeDirection={direction} changeLabel={change} />
        <KpiCard label="Orders" value={data.orderCount} />
        <KpiCard label="Inventory value" value={<MoneyDisplay amount={data.inventoryValue} />} />
        <KpiCard label="Outstanding receivables" value={<MoneyDisplay amount={data.outstandingReceivables} />} />
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_340px]">
        <Card className="overflow-hidden border border-border bg-white p-0 shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-[14px] font-semibold tracking-tight text-text-primary">Revenue trend</h2>
              <p className="mt-1 text-[11px] text-text-muted">Daily revenue generated across the business</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge label="Live" tone="success" />
              {/* Chart mode toggle */}
              <div className="flex items-center gap-0.5 rounded-lg bg-surface-secondary p-0.5">
                <button
                  onClick={() => setChartMode("line")}
                  title="Line chart"
                  className={`flex h-7 w-7 items-center justify-center rounded-md transition ${chartMode === "line" ? "bg-white shadow-sm text-text-primary" : "text-text-muted hover:text-text-primary"}`}
                >
                  <TrendingUp size={13} />
                </button>
                <button
                  onClick={() => setChartMode("bar")}
                  title="Bar chart"
                  className={`flex h-7 w-7 items-center justify-center rounded-md transition ${chartMode === "bar" ? "bg-white shadow-sm text-text-primary" : "text-text-muted hover:text-text-primary"}`}
                >
                  <BarChart2 size={13} />
                </button>
              </div>
            </div>
          </div>
          <div className="px-2 pb-4 pt-4 sm:px-4 sm:pb-5">
            {chartMode === "line" ? (
              <LineChart
                data={data.revenueTrend.map(p => ({ label: p.date, value: p.revenue }))}
                formatValue={formatLKR}
                height={220}
              />
            ) : (
              <BarChart
                data={data.revenueTrend.map(p => ({ label: p.date.slice(5), value: p.revenue }))}
                formatValue={formatLKR}
                height={220}
              />
            )}
          </div>
        </Card>

        {/* Insight card */}
        <Card className="relative overflow-hidden border-0 bg-[#123B2A] p-5 text-white shadow-card sm:p-6">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full border border-white/10" />
          <div className="absolute -right-6 top-8 h-20 w-20 rounded-full border border-white/[0.06]" />
          <div className="relative">
            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#8FB6A0]">NEXORA insight</div>
            <h2 className="mt-3 text-[19px] font-semibold">Operational attention</h2>
            <p className="mt-2 text-[12px] leading-5 text-[#C4D9CC]">
              {data.lowStockAlerts.length
                ? `${data.lowStockAlerts.length} product${data.lowStockAlerts.length === 1 ? "" : "s"} need stock attention.`
                : "No low-stock products are currently flagged."}
            </p>
          </div>
          <div className="relative mt-8 grid grid-cols-2 gap-2.5">
            <div className="rounded-[11px] border border-white/10 bg-white/[0.07] p-3">
              <div className="text-[9px] uppercase tracking-wide text-[#8FB6A0]">Low stock</div>
              <div className="mt-1 text-xl font-semibold">{data.lowStockAlerts.length}</div>
            </div>
            <div className="rounded-[11px] border border-white/10 bg-white/[0.07] p-3">
              <div className="text-[9px] uppercase tracking-wide text-[#8FB6A0]">Receivables</div>
              <div className="mt-1 text-[12px] font-semibold"><MoneyDisplay amount={data.outstandingReceivables} /></div>
            </div>
          </div>
        </Card>
      </section>

      {/* Tables Section */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <Card className="overflow-hidden border border-border bg-white p-0 shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-[14px] font-semibold text-text-primary">Top products</h2>
              <p className="mt-1 text-[11px] text-text-muted">Best-performing products this period</p>
            </div>
            <Link href="/inventory" className="flex items-center gap-1 text-[11px] font-semibold text-primary">Inventory <ArrowUpRight size={13} /></Link>
          </div>
          {data.topProducts.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-[12px]">
                <thead>
                  <tr className="border-b border-border bg-[#F8FAF8] text-[9px] uppercase tracking-[0.1em] text-text-muted">
                    <th className="px-5 py-3 text-left font-semibold sm:px-6">Product</th>
                    <th className="px-5 py-3 text-right font-semibold">Units</th>
                    <th className="px-5 py-3 text-right font-semibold sm:px-6">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((p, i) => (
                    <tr key={p.name} className="border-b border-border last:border-0 hover:bg-[#FAFCFA]">
                      <td className="px-5 py-3.5 font-semibold text-text-primary sm:px-6">
                        <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface-secondary text-[10px] text-text-muted">{i + 1}</span>
                        {p.name}
                      </td>
                      <td className="px-5 py-3.5 text-right text-text-secondary">{p.quantitySold}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-text-primary sm:px-6"><MoneyDisplay amount={p.revenue} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState message="No sales recorded yet this period." />}
        </Card>

        <Card className="overflow-hidden border border-border bg-white p-0 shadow-card">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <h2 className="text-[14px] font-semibold text-text-primary">Inventory attention</h2>
            <p className="mt-1 text-[11px] text-text-muted">Products approaching reorder level</p>
          </div>
          {data.lowStockAlerts.length ? (
            <div className="divide-y divide-border">
              {data.lowStockAlerts.map(a => (
                <div key={a.productName} className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-semibold text-text-primary">{a.productName}</div>
                    <div className="mt-0.5 text-[10px] text-text-muted">Reorder threshold reached</div>
                  </div>
                  <StatusBadge label={`${a.totalOnHand} left`} tone={a.totalOnHand <= 0 ? "danger" : "warning"} />
                </div>
              ))}
            </div>
          ) : <EmptyState message="All products are above reorder level." />}
        </Card>
      </section>

      {/* Recent Activity */}
      <Card className="overflow-hidden border border-border bg-white p-0 shadow-card">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="text-[14px] font-semibold text-text-primary">Recent activity</h2>
          <p className="mt-1 text-[11px] text-text-muted">Latest events across the business</p>
        </div>
        {data.recentActivity.length ? (
          <div className="divide-y divide-border">
            {data.recentActivity.map((item, i) => (
              <div key={i} className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[12px] text-text-secondary">{item.description}</span>
                <span className="text-[10px] text-text-muted">{new Date(item.at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : <EmptyState message="Nothing has happened yet." />}
      </Card>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="px-5 py-10 text-center text-[12px] text-text-muted">{message}</div>;
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6">
      <div className="h-14 w-72 animate-pulse rounded-control bg-surface-secondary" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map(i => <div key={i} className="h-32 animate-pulse rounded-card bg-surface-secondary" />)}
      </div>
      <div className="h-[390px] animate-pulse rounded-card bg-surface-secondary" />
    </div>
  );
}
