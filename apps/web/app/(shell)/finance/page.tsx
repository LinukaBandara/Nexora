"use client";

import { useEffect, useState } from "react";
import { getFinancialSummary, FinancialSummary } from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { MoneyDisplay } from "@/components/ui/MoneyDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";

function iso(d: Date) { return d.toISOString().slice(0, 10); }
function monthStart() { const d = new Date(); return iso(new Date(d.getFullYear(), d.getMonth(), 1)); }
function today() { return iso(new Date()); }

export default function FinancePage() {
  const [data, setData] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  async function load() { setLoading(true); setError(null); try { setData(await getFinancialSummary(monthStart(), today())); } catch (e) { setError(e instanceof ApiError ? e.message : "Unable to load finance data."); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  if (loading) return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0,1,2,3].map((i) => <div key={i} className="h-32 animate-pulse rounded-card bg-surface-secondary" />)}</div>;
  if (error || !data) return <Card className="p-6"><div className="font-medium text-text-primary">Unable to load finance.</div><div className="mt-1 text-secondary text-text-muted">{error}</div><button onClick={load} className="mt-4 text-primary font-medium">Retry</button></Card>;
  return <div className="flex flex-col gap-5 sm:gap-6">
    <header><div className="text-page-title font-semibold tracking-tight text-text-primary">Finance</div><div className="mt-1 text-secondary text-text-muted">Cash flow, receivables and payables connected to NEXORA transactions.</div></header>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Income" value={<MoneyDisplay amount={data.income} />} variant="dark" /><KpiCard label="Expenses" value={<MoneyDisplay amount={data.expenses} />} /><KpiCard label="Net cash flow" value={<MoneyDisplay amount={data.netCashFlow} />} changeDirection={data.netCashFlow >= 0 ? "up" : "down"} changeLabel={data.netCashFlow >= 0 ? "Positive" : "Negative"} /><KpiCard label="Receivables" value={<MoneyDisplay amount={data.receivables} />} /></div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><Card className="p-5"><div className="flex items-center justify-between"><div><div className="text-card-title font-semibold text-text-primary">Receivables</div><div className="mt-1 text-dense text-text-muted">Outstanding customer balances</div></div><StatusBadge label="Live" tone="success" /></div><div className="mt-8 text-3xl font-semibold text-text-primary"><MoneyDisplay amount={data.receivables} /></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, data.receivables === 0 ? 0 : (data.receivables / Math.max(data.receivables, data.payables)) * 100)}%` }} /></div></Card><Card className="p-5"><div className="text-card-title font-semibold text-text-primary">Payables</div><div className="mt-1 text-dense text-text-muted">Outstanding supplier balances</div><div className="mt-8 text-3xl font-semibold text-text-primary"><MoneyDisplay amount={data.payables} /></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, data.payables === 0 ? 0 : (data.payables / Math.max(data.receivables, data.payables)) * 100)}%` }} /></div></Card></div>
    <Card className="p-5"><div className="text-card-title font-semibold text-text-primary">Period</div><div className="mt-1 text-dense text-text-muted">Current month financial summary</div><div className="mt-4 grid gap-3 text-secondary sm:grid-cols-3"><div><span className="text-text-muted">From</span><div className="font-medium text-text-primary">{monthStart()}</div></div><div><span className="text-text-muted">To</span><div className="font-medium text-text-primary">{today()}</div></div><div><span className="text-text-muted">Net position</span><div className="font-medium text-primary"><MoneyDisplay amount={data.netCashFlow} /></div></div></div></Card>
  </div>;
}
