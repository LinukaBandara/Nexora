"use client";

import { useEffect, useState } from "react";
import { getDashboardOverview, DashboardOverview } from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { MoneyDisplay } from "@/components/ui/MoneyDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LineChart } from "@/components/ui/LineChart";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

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
      const overview = await getDashboardOverview(startOfMonthISO(), todayISO());
      setData(overview);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load the dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <Card className="p-6">
        <div className="text-body text-text-primary">Unable to load dashboard data.</div>
        <div className="mt-1 text-secondary text-text-muted">{error}</div>
        <button onClick={load} className="mt-3 text-secondary font-medium text-primary hover:underline">
          Retry
        </button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-page-title font-semibold text-text-primary">Overview</div>
        <div className="mt-1 text-secondary text-text-muted">Here's what's happening this month.</div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          label="Revenue"
          value={<MoneyDisplay amount={data.revenue} />}
          variant="dark"
          sparkline={data.revenueTrend.map((p) => p.revenue)}
        />
        <KpiCard label="Orders" value={data.orderCount} />
        <KpiCard label="Inventory value" value={<MoneyDisplay amount={data.inventoryValue} />} />
        <KpiCard label="Outstanding receivables" value={<MoneyDisplay amount={data.outstandingReceivables} />} />
      </div>

      <Card className="p-4">
        <div className="mb-3 text-card-title font-semibold text-text-primary">Revenue trend</div>
        <LineChart
          data={data.revenueTrend.map((p) => ({ label: p.date, value: p.revenue }))}
          formatValue={(v) => new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(v)}
        />
      </Card>

      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        <Card className="p-4">
          <div className="mb-3 text-card-title font-semibold text-text-primary">Top products</div>
          {data.topProducts.length === 0 ? (
            <EmptyState message="No sales recorded yet this period." />
          ) : (
            <table className="w-full text-body">
              <tbody>
                {data.topProducts.map((p) => (
                  <tr key={p.name} className="border-b border-border last:border-0">
                    <td className="py-2 text-text-primary">{p.name}</td>
                    <td className="py-2 text-right text-text-muted">{p.quantitySold} sold</td>
                    <td className="py-2 text-right font-medium text-text-primary">
                      <MoneyDisplay amount={p.revenue} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 text-card-title font-semibold text-text-primary">Low stock</div>
          {data.lowStockAlerts.length === 0 ? (
            <EmptyState message="Nothing is low on stock right now." />
          ) : (
            <div className="flex flex-col gap-2">
              {data.lowStockAlerts.map((a) => (
                <div key={a.productName} className="flex items-center justify-between text-body">
                  <span className="text-text-primary">{a.productName}</span>
                  <StatusBadge
                    label={`${a.totalOnHand} left`}
                    tone={a.totalOnHand <= 0 ? "danger" : "warning"}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <div className="mb-3 text-card-title font-semibold text-text-primary">Recent activity</div>
        {data.recentActivity.length === 0 ? (
          <EmptyState message="Nothing has happened yet." />
        ) : (
          <div className="flex flex-col gap-2">
            {data.recentActivity.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-body">
                <span className="text-text-secondary">{item.description}</span>
                <span className="text-dense text-text-muted">{new Date(item.at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="py-6 text-center text-secondary text-text-muted">{message}</div>;
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-48 animate-pulse rounded-control bg-surface-secondary" />
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-card bg-surface-secondary" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-card bg-surface-secondary" />
    </div>
  );
}
