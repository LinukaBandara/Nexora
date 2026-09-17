"use client";

import { useEffect, useState } from "react";
import { getSyncStatus, SyncStatus } from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function SyncPage() {
  const [data, setData] = useState<SyncStatus | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  async function load() { setLoading(true); setError(null); try { setData(await getSyncStatus()); } catch (e) { setError(e instanceof ApiError ? e.message : "Unable to load sync status."); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  if (loading) return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0,1,2,3].map(i => <div key={i} className="h-32 animate-pulse rounded-card bg-surface-secondary" />)}</div>;
  if (error || !data) return <Card className="p-6"><div className="font-medium text-text-primary">Unable to load Sync Center.</div><div className="mt-1 text-secondary text-text-muted">{error}</div><button onClick={load} className="mt-4 text-primary font-medium">Retry</button></Card>;
  return <div className="flex flex-col gap-5 sm:gap-6"><header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-page-title font-semibold tracking-tight text-text-primary">Sync Center</div><div className="mt-1 text-secondary text-text-muted">Monitor the cloud ↔ local synchronization pipeline.</div></div><button onClick={load} className="rounded-control border border-border bg-white px-4 py-2 text-secondary font-medium text-text-secondary">Refresh</button></header><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Pending events" value={data.pendingEvents} /><KpiCard label="Synced today" value={data.syncedToday} variant="dark" /><KpiCard label="Failed events" value={data.failedEvents} /><KpiCard label="Open conflicts" value={data.openConflicts} /></div><Card className="overflow-hidden"><div className="border-b border-border px-5 py-4"><div className="text-card-title font-semibold text-text-primary">Recent event stream</div><div className="mt-1 text-dense text-text-muted">Latest synchronization activity</div></div>{data.recentEvents.length === 0 ? <div className="p-10 text-center text-secondary text-text-muted">No synchronization events yet.</div> : <div className="divide-y divide-border">{data.recentEvents.map((e, i) => <div key={i} className="grid gap-2 px-5 py-3 sm:grid-cols-[1.2fr_1.4fr_0.8fr_1fr] sm:items-center"><div className="font-medium text-text-primary">{e.aggregateType}</div><div className="text-secondary text-text-secondary">{e.eventType}</div><div><StatusBadge label={e.outcome} tone={e.outcome === "Acknowledged" ? "success" : e.outcome === "Failed" ? "danger" : "warning"} /></div><div className="text-dense text-text-muted sm:text-right">{new Date(e.at).toLocaleString()}</div></div>)}</div>}</Card><Card className="p-5"><div className="text-card-title font-semibold text-text-primary">Last synchronized</div><div className="mt-2 text-secondary text-text-secondary">{data.lastSyncedAt ? new Date(data.lastSyncedAt).toLocaleString() : "No successful sync recorded yet."}</div></Card></div>;
}
