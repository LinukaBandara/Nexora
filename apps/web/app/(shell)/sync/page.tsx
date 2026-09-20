"use client";

import React, { useEffect, useState } from "react";
import { getSyncStatus, SyncStatus } from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Database,
  Radio,
  RefreshCw,
  Server,
  Zap,
} from "lucide-react";

export default function SyncPage() {
  const [data, setData] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setData(await getSyncStatus());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load sync status.");
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-[16px] bg-[#E8EDE9]" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-[18px] bg-[#E8EDE9]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-6 pb-8">
        <PageHeader
          breadcrumbs={["System", "Pipeline"]}
          title="Sync Center"
          description="Monitor synchronization and integration health."
        />
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  function getOutcomeTone(outcome: string): "success" | "warning" | "danger" | "neutral" {
    const o = outcome.toLowerCase();
    if (o === "synced" || o === "acknowledged" || o === "success") return "success";
    if (o === "conflict") return "warning";
    if (o === "failed" || o === "error") return "danger";
    return "neutral";
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-7 pb-8">
      {/* Header */}
      <PageHeader
        breadcrumbs={["System", "Integration"]}
        title="Sync Center"
        description="Monitor cloud-to-edge synchronization, stream pipelines and conflict resolution health."
        actions={
          <button
            onClick={load}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#D7DFDA] bg-white px-3.5 text-xs font-semibold text-[#142019] shadow-sm hover:bg-[#F2F5F3] transition"
          >
            <RefreshCw size={13} />
            <span>Force Sync Check</span>
          </button>
        }
      />

      {/* KPI Cards Row (Pending, Synced Today, Failed Events, Open Conflicts) */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Pending Events"
          value={data.pendingEvents.toLocaleString()}
          detail={data.pendingEvents > 0 ? "Queued in outbound buffer" : "Queue fully flushed"}
          changeLabel={data.pendingEvents > 0 ? "In flight" : "Idle"}
          changeDirection="flat"
        />
        <KpiCard
          label="Synced Today"
          value={data.syncedToday.toLocaleString()}
          variant="dark"
          tag="Stream Active"
          changeLabel="Sync activity"
          changeDirection="up"
        />
        <KpiCard
          label="Failed Events"
          value={data.failedEvents.toLocaleString()}
          detail={data.failedEvents > 0 ? "Retries scheduled" : "Zero errors registered"}
          changeLabel={data.failedEvents > 0 ? "Requires attention" : "Zero errors"}
          changeDirection={data.failedEvents > 0 ? "down" : "up"}
        />
        <KpiCard
          label="Open Conflicts"
          value={data.openConflicts.toLocaleString()}
          detail={data.openConflicts > 0 ? "Manual resolution advised" : "Deterministic sync"}
          changeLabel={data.openConflicts > 0 ? "Conflict flagged" : "Clean state"}
          changeDirection={data.openConflicts > 0 ? "down" : "up"}
        />
      </section>

      {/* Pipeline Status Summary Card */}
      <div className="rounded-[18px] border border-[#E3E9E5] bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#EAEFEA] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5ED] text-[#1F7A4D]">
              <Radio size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#142019]">Pipeline Health Status</h2>
                <StatusBadge label="Sync monitor" tone="neutral" />
              </div>
              <p className="mt-0.5 text-[12px] text-[#697B70]">
                Continuous event-driven replication across local edge and central cloud.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-[#F0F4F1] px-3.5 py-2 text-xs text-[#4F6255]">
            <Clock size={14} className="text-[#1F7A4D]" />
            <span>
              Last Sync:{" "}
              <strong className="text-[#142019]">
                {data.lastSyncedAt
                  ? new Date(data.lastSyncedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "Never"}
              </strong>
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#E3E9E5] bg-[#FAFCFA] p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#54675C]">
              <Database size={15} className="text-[#1F7A4D]" />
              <span>Event Queue</span>
            </div>
            <div className="mt-1 text-sm font-bold text-[#142019]">Durable event queue</div>
            <div className="mt-0.5 text-[11px] text-[#7A8C81]">Queued changes tracked for replication</div>
          </div>
          <div className="rounded-xl border border-[#E3E9E5] bg-[#FAFCFA] p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#54675C]">
              <Server size={15} className="text-[#1F7A4D]" />
              <span>Conflict Handling</span>
            </div>
            <div className="mt-1 text-sm font-bold text-[#142019]">Conflict-aware</div>
            <div className="mt-0.5 text-[11px] text-[#7A8C81]">Conflicts surfaced for controlled resolution</div>
          </div>
          <div className="rounded-xl border border-[#E3E9E5] bg-[#FAFCFA] p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#54675C]">
              <Zap size={15} className="text-[#1F7A4D]" />
              <span>Operating Mode</span>
            </div>
            <div className="mt-1 text-sm font-bold text-[#142019]">Hybrid Ready</div>
            <div className="mt-0.5 text-[11px] text-[#7A8C81]">Designed for local and cloud operation</div>
          </div>
        </div>
      </div>

      {/* Recent Sync Events Stream Table */}
      <div className="overflow-hidden rounded-[18px] border border-[#E3E9E5] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#EAEFEA] px-6 py-4">
          <div>
            <h2 className="text-sm font-bold text-[#142019]">Recent Synchronization Stream</h2>
            <p className="mt-0.5 text-[12px] text-[#697B70]">
              Chronological log of replicated domain entities and outcome statuses.
            </p>
          </div>
          <span className="rounded-full bg-[#EBF4EE] px-2.5 py-1 text-[10px] font-bold text-[#1F7A4D]">
            {data.recentEvents.length} events logged
          </span>
        </div>

        {data.recentEvents.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No sync events"
            description="Replication events between local edge and central cloud will be recorded here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-xs">
              <thead>
                <tr className="border-b border-[#EAEFEA] bg-[#F9FAF9] text-[10px] font-bold uppercase tracking-[0.12em] text-[#6D8174]">
                  <th className="px-6 py-3.5 text-left">Aggregate / Entity</th>
                  <th className="px-6 py-3.5 text-left">Event Type</th>
                  <th className="px-6 py-3.5 text-left">Outcome Status</th>
                  <th className="px-6 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFEA]">
                {data.recentEvents.map((evt, idx) => (
                  <tr
                    key={idx}
                    className="transition-colors hover:bg-[#F9FAF9]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5 font-bold text-[#142019]">
                        <span className="h-2 w-2 rounded-full bg-[#1F7A4D]" />
                        <span>{evt.aggregateType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-[#4F6256]">
                      {evt.eventType}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        label={evt.outcome}
                        tone={getOutcomeTone(evt.outcome)}
                      />
                    </td>
                    <td className="px-6 py-4 text-right text-[#697D70]">
                      {new Date(evt.at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
