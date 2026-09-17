"use client";

import { useEffect, useMemo, useState } from "react";
import { getDashboardOverview, DashboardOverview } from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { MoneyDisplay } from "@/components/ui/MoneyDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LineChart } from "@/components/ui/LineChart";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function startOfMonthISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  const trend = useMemo(() => data?.revenueTrend.map((p) => p.revenue) ?? [], [data]);
  const latestRevenue = trend.at(-1) ?? 0;
  const previousRevenue = trend.at(-2) ?? latestRevenue;
  const revenueDirection = latestRevenue > previousRevenue ? "up" : latestRevenue < previousRevenue ? "down" : "flat";
  const revenueChange = previousRevenue === 0 ? "No prior-day comparison" : `${Math.abs(((latestRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)}% vs previous day`;

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <Card className="p-6">
        <div className="text-body font-medium text-text-primary">Unable to load dashboard data.</div>
        <div className="mt-1 text-secondary text-text-muted">{error}</div>
        <button onClick={load} className="mt-4 rounded-control bg-primary px-4 py-2 text-secondary font-medium text-white">Retry</button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-page-title font-semibold tracking-tight text-text-primary">Overview</div>
          <div className="mt-1 text-secondary text-text-muted">Your business at a glance for the current month.</div>
        </div>
        <div className="rounded-control border border-border bg-surface px-3 py-2 text-dense text-text-muted">{startOfMonthISO()} — {todayISO()}</div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Revenue" value={<MoneyDisplay amount={data.revenue} />} variant="dark" sparkline={trend} changeDirection={revenueDirection} changeLabel={revenueChange} />
        <KpiCard label="Orders" value={data.orderCount} />
        <KpiCard label="Inventory value" value={<MoneyDisplay amount={data.inventoryValue} />} />
        <KpiCard label="Outstanding receivables" value={<MoneyDisplay amount={data.outstandingReceivables} />} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.7fr)]">
        <Card className="p-4 sm:p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="text-card-title font-semibold text-text-primary">Revenue trend</div>
              <div className="mt-1 text-dense text-text-muted">Daily revenue from the live ERP dataset</div>
            </div>
            <StatusBadge label="Live" tone="success" />
          </div>
          <LineChart data={data.revenueTrend.map((p) => ({ label: p.date, value: p.revenue }))} formatValue={(v) => new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(v)} />
        </Card>

        <Card className="flex flex-col justify-between bg-sidebar-bg p-5 text-white">
          <div>
            <div className="text-dense uppercase tracking-wide text-sidebar-text-muted">NEXORA insight</div>
            <div className="mt-3 text-lg font-semibold">Operational attention</div>
            <p className="mt-2 text-secondary leading-6 text-sidebar-text">
              {data.lowStockAlerts.length > 0
                ? `${data.lowStockAlerts.length} product${data.lowStockAlerts.length === 1 ? "" : "s"} need stock attention.`
                : "No low-stock products are currently flagged."}
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-card bg-white/10 p-3"><div className="text-dense text-sidebar-text-muted">Low stock</div><div className="mt-1 text-xl font-semibold">{data.lowStockAlerts.length}</div></div>
            <div className="rounded-card bg-white/10 p-3"><div className="text-dense text-sidebar-text-muted">Receivables</div><div className="mt-1 text-sm font-semibold"><MoneyDisplay amount={data.outstandingReceivables} /></div></div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-border px-4 py-4 sm:px-5">
            <div className="text-card-title font-semibold text-text-primary">Top products</div>
            <div className="mt-1 text-dense text-text-muted">Best-performing products this period</div>
          </div>
          {data.topProducts.length === 0 ? <EmptyState message="No sales recorded yet this period." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-body">
                <thead><tr className="border-b border-border text-dense text-text-muted"><th className="px-5 py-3 text-left font-medium">Product</th><th className="px-5 py-3 text-right font-medium">Units</th><th className="px-5 py-3 text-right font-medium">Revenue</th></tr></thead>
                <tbody>{data.topProducts.map((p) => <tr key={p.name} className="border-b border-border last:border-0 hover:bg-surface-secondary"><td className="px-5 py-3 font-medium text-text-primary">{p.name}</td><td className="px-5 py-3 text-right text-text-muted">{p.quantitySold}</td><td className="px-5 py-3 text-right font-medium text-text-primary"><MoneyDisplay amount={p.revenue} /></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-border px-4 py-4 sm:px-5"><div className="text-card-title font-semibold text-text-primary">Low stock</div><div className="mt-1 text-dense text-text-muted">Products approaching reorder level</div></div>
          {data.lowStockAlerts.length === 0 ? <EmptyState message="Nothing is low on stock right now." /> : <div className="divide-y divide-border">{data.lowStockAlerts.map((a) => <div key={a.productName} className="flex items-center justify-between gap-3 px-5 py-3"><span className="truncate text-body font-medium text-text-primary">{a.productName}</span><StatusBadge label={`${a.totalOnHand} left`} tone={a.totalOnHand <= 0 ? "danger" : "warning"} /></div>)}</div>}
        </Card>
      </section>

      <Card className="overflow-hidden">
        <div className="border-b border-border px-4 py-4 sm:px-5"><div className="text-card-title font-semibold text-text-primary">Recent activity</div><div className="mt-1 text-dense text-text-muted">Latest events across the business</div></div>
        {data.recentActivity.length === 0 ? <EmptyState message="Nothing has happened yet." /> : <div className="divide-y divide-border">{data.recentActivity.map((item, i) => <div key={i} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-body text-text-secondary">{item.description}</span><span className="text-dense text-text-muted">{new Date(item.at).toLocaleString()}</span></div>)}</div>}
      </Card>
    </div>
  );
}

function EmptyState({ message }: { message: string }) { return <div className="py-10 text-center text-secondary text-text-muted">{message}</div>; }

function DashboardSkeleton() {
  return <div className="flex flex-col gap-5"><div className="h-10 w-48 animate-pulse rounded-control bg-surface-secondary" /><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0,1,2,3].map((i) => <div key={i} className="h-32 animate-pulse rounded-card bg-surface-secondary" />)}</div><div className="h-80 animate-pulse rounded-card bg-surface-secondary" /></div>;
}
