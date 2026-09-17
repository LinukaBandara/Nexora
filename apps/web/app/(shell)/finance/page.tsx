"use client";

import { useEffect, useState } from "react";
import { getFinancialSummary, FinancialSummary } from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { MoneyDisplay } from "@/components/ui/MoneyDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ArrowDownRight, ArrowUpRight, CalendarDays, RefreshCw, Wallet } from "lucide-react";

function iso(d: Date) { return d.toISOString().slice(0, 10); }
function monthStart() { const d = new Date(); return iso(new Date(d.getFullYear(), d.getMonth(), 1)); }
function today() { return iso(new Date()); }

export default function FinancePage() {
  const [data, setData] = useState<FinancialSummary | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  async function load() { setLoading(true); setError(null); try { setData(await getFinancialSummary(monthStart(), today())); } catch (e) { setError(e instanceof ApiError ? e.message : "Unable to load finance data."); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  if (loading) return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0,1,2,3].map(i => <div key={i} className="h-32 animate-pulse rounded-card bg-surface-secondary" />)}</div>;
  if (error || !data) return <Card className="p-8"><div className="font-medium text-text-primary">Unable to load finance.</div><div className="mt-1 text-secondary text-text-muted">{error}</div><button onClick={load} className="mt-4 inline-flex items-center gap-2 font-medium text-primary"><RefreshCw className="h-4 w-4" />Retry</button></Card>;
  const totalPosition = Math.max(data.receivables, data.payables); const receivableWidth = data.receivables === 0 ? 0 : (data.receivables / totalPosition) * 100; const payableWidth = data.payables === 0 ? 0 : (data.payables / totalPosition) * 100;
  return <div className="flex flex-col gap-5 sm:gap-6">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-page-title font-semibold tracking-tight text-text-primary">Finance</div><div className="mt-1 max-w-2xl text-secondary text-text-muted">A clear view of cash flow, customer receivables and supplier payables.</div></div><button onClick={load} className="inline-flex w-fit items-center gap-2 rounded-control border border-border bg-white px-4 py-2 text-secondary font-medium text-text-secondary hover:bg-surface-secondary"><RefreshCw className="h-4 w-4" />Refresh</button></header>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Income" value={<MoneyDisplay amount={data.income} />} variant="dark" /><KpiCard label="Expenses" value={<MoneyDisplay amount={data.expenses} />} /><KpiCard label="Net cash flow" value={<MoneyDisplay amount={data.netCashFlow} />} changeDirection={data.netCashFlow >= 0 ? "up" : "down"} changeLabel={data.netCashFlow >= 0 ? "Positive" : "Negative"} /><KpiCard label="Receivables" value={<MoneyDisplay amount={data.receivables} />} /></div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><BalanceCard title="Receivables" description="Outstanding customer balances" amount={data.receivables} width={receivableWidth} icon={ArrowDownRight} /><BalanceCard title="Payables" description="Outstanding supplier balances" amount={data.payables} width={payableWidth} icon={ArrowUpRight} /></div>
    <Card className="p-5 sm:p-6"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary"><CalendarDays className="h-5 w-5" /></div><div><div className="text-card-title font-semibold text-text-primary">Reporting period</div><div className="mt-1 text-dense text-text-muted">Current month financial summary</div></div></div><div className="mt-6 grid gap-5 sm:grid-cols-3"><PeriodItem label="From" value={monthStart()} /><PeriodItem label="To" value={today()} /><PeriodItem label="Net position" value={<MoneyDisplay amount={data.netCashFlow} />} accent /></div></Card>
  </div>;
}
function BalanceCard({ title, description, amount, width, icon: Icon }: { title: string; description: string; amount: number; width: number; icon: typeof ArrowDownRight }) { return <Card className="p-5 sm:p-6"><div className="flex items-center justify-between"><div><div className="text-card-title font-semibold text-text-primary">{title}</div><div className="mt-1 text-dense text-text-muted">{description}</div></div><StatusBadge label="Live" tone="success" /></div><div className="mt-7 flex items-end justify-between gap-4"><div className="text-3xl font-semibold tracking-tight text-text-primary"><MoneyDisplay amount={amount} /></div><div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary"><Icon className="h-4 w-4" /></div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, width)}%` }} /></div></Card>; }
function PeriodItem({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) { return <div><div className="text-dense text-text-muted">{label}</div><div className={`mt-1 font-medium ${accent ? "text-primary" : "text-text-primary"}`}>{value}</div></div>; }
