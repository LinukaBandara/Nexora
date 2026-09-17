"use client";

import { useEffect, useState } from "react";
import { getNotifications, markNotificationRead, NotificationItem } from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { Toast } from "@/components/ui/Toast";

const PAGE_SIZE = 25;
export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [unreadOnly, setUnreadOnly] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [toast, setToast] = useState<string | null>(null);
  async function load() { setLoading(true); setError(null); try { const r = await getNotifications({ unreadOnly, page, pageSize: PAGE_SIZE }); setItems(r.items); setTotal(r.totalCount); } catch (e) { setError(e instanceof ApiError ? e.message : "Unable to load notifications."); } finally { setLoading(false); } }
  useEffect(() => { load(); }, [page, unreadOnly]);
  async function read(id: string) { try { await markNotificationRead(id); load(); } catch (e) { setToast(e instanceof ApiError ? e.message : "Unable to update notification."); } }
  return <div className="flex flex-col gap-5 sm:gap-6"><header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-page-title font-semibold tracking-tight text-text-primary">Notifications</div><div className="mt-1 text-secondary text-text-muted">Operational alerts and workflow events for your organization.</div></div><button onClick={() => { setUnreadOnly(v => !v); setPage(1); }} className={`rounded-control border px-4 py-2 text-secondary font-medium ${unreadOnly ? "border-primary bg-primary-soft text-primary" : "border-border bg-white text-text-secondary"}`}>{unreadOnly ? "Showing unread" : "Show unread only"}</button></header>{toast && <Toast message={toast} onDismiss={() => setToast(null)} />}<Card className="overflow-hidden">{loading ? <div className="flex flex-col gap-2 p-4">{[0,1,2,3,4].map(i => <div key={i} className="h-20 animate-pulse rounded-card bg-surface-secondary" />)}</div> : error ? <div className="p-8 text-center text-text-primary">{error}<button onClick={load} className="ml-2 text-primary font-medium">Retry</button></div> : items.length === 0 ? <div className="p-10 text-center text-secondary text-text-muted">No notifications to show.</div> : <div className="divide-y divide-border">{items.map(n => <div key={n.id} className={`flex gap-4 px-5 py-4 ${n.isRead ? "bg-white" : "bg-primary-soft/30"}`}><div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-primary" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><div className="font-medium text-text-primary">{n.title}</div><StatusBadge label={n.type} tone={n.isRead ? "neutral" : "info"} /></div><div className="mt-1 text-secondary text-text-secondary">{n.message}</div><div className="mt-2 text-dense text-text-muted">{new Date(n.createdAt).toLocaleString()}</div></div>{!n.isRead && <button onClick={() => read(n.id)} className="self-start text-dense font-medium text-primary">Mark read</button>}</div>)}</div>}{!loading && !error && <Pagination page={page} pageSize={PAGE_SIZE} totalCount={total} onPageChange={setPage} />}</Card></div>;
}
