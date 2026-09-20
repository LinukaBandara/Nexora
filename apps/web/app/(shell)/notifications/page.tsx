"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  getNotifications,
  markNotificationRead,
  NotificationItem,
} from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Toast } from "@/components/ui/Toast";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle,
  CreditCard,
  FileCheck,
  Package,
} from "lucide-react";
import clsx from "clsx";

const PAGE_SIZE = 25;

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [readingId, setReadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getNotifications({ unreadOnly, page, pageSize: PAGE_SIZE });
      setItems(res.items);
      setTotalCount(res.totalCount);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }



    }, [page, unreadOnly]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMarkRead(id: string) {
    setReadingId(id);
    try {
      await markNotificationRead(id);
      setToastMessage("Notification marked as read.");
      load();
    } catch (err) {
      setToastMessage(err instanceof ApiError ? err.message : "Unable to update notification.");
    } finally {
      setReadingId(null);
    }
  }

  const unreadCount = items.filter((n) => !n.isRead).length;

  function getNotificationIcon(type: string) {
    const t = type.toLowerCase();
    if (t.includes("lowstock") || t.includes("stock")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#D97706]">
          <AlertTriangle size={18} />
        </div>
      );
    }
    if (t.includes("approval")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5EC] text-[#1F7A4D]">
          <FileCheck size={18} />
        </div>
      );
    }
    if (t.includes("payment")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF7F1] text-[#123B2A]">
          <CreditCard size={18} />
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F4F1] text-[#4D6054]">
        <Bell size={18} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-7 pb-8">
      {/* Header */}
      <PageHeader
        breadcrumbs={["System", "Alerts"]}
        title="Notifications"
        description="Stay up to date with important system activity, approvals, inventory warnings and payment receipts."
      />

      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}

      {/* Main Notification Card */}
      <div className="overflow-hidden rounded-[18px] border border-[#E3E9E5] bg-white shadow-sm">
        {/* Filter Controls Bar */}
        <div className="flex flex-col gap-3 border-b border-[#EAEFEA] p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#142019]">Notification Center</h2>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#8EE04E]/25 px-2 py-0.5 text-[10px] font-bold text-[#0F2D1E]">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[12px] text-[#697B70]">
              Filter by read status or mark items as acknowledged.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 rounded-xl bg-[#F0F4F1] p-1 text-xs font-semibold text-[#54685C]">
            <button
              onClick={() => {
                setUnreadOnly(false);
                setPage(1);
              }}
              className={`rounded-lg px-3.5 py-1.5 transition-all ${
                !unreadOnly
                  ? "bg-white text-[#123B2A] shadow-sm"
                  : "hover:text-[#142019]"
              }`}
            >
              All Alerts
            </button>
            <button
              onClick={() => {
                setUnreadOnly(true);
                setPage(1);
              }}
              className={`rounded-lg px-3.5 py-1.5 transition-all ${
                unreadOnly
                  ? "bg-white text-[#123B2A] shadow-sm"
                  : "hover:text-[#142019]"
              }`}
            >
              Unread Only
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-2 p-5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-[#EDF2EE]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-6">
            <ErrorState message={error} onRetry={load} />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={unreadOnly ? "No unread notifications" : "No notifications yet"}
            description={
              unreadOnly
                ? "You are completely caught up! No unread operational notifications."
                : "Important system announcements and workflow alerts will appear here."
            }
          />
        ) : (
          <>
            <div className="divide-y divide-[#EAEFEA]">
              {items.map((n) => {
                return (
                  <div
                    key={n.id}
                    className={clsx(
                      "flex items-start gap-4 p-5 transition-colors",
                      n.isRead
                        ? "bg-white hover:bg-[#FAFCFA]"
                        : "bg-[#F3F9F5] hover:bg-[#EEF6F1]"
                    )}
                  >
                    {/* Unread indicator bar */}
                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={clsx(
                          "h-2 w-2 rounded-full",
                          n.isRead ? "bg-transparent" : "bg-[#1F7A4D]"
                        )}
                        aria-hidden="true"
                      />
                      {getNotificationIcon(n.type)}
                    </div>

                    {/* Notification content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#142019]">{n.title}</span>
                        <StatusBadge
                          label={n.type}
                          tone={n.isRead ? "neutral" : "info"}
                        />
                      </div>
                      <p className="mt-1 text-xs text-[#475A4E] leading-relaxed">
                        {n.message}
                      </p>
                      <div className="mt-2 text-[11px] font-medium text-[#7C8F83]">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>

                    {/* Action */}
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        disabled={readingId === n.id}
                        className="shrink-0 rounded-lg border border-[#CCD8D0] bg-white px-2.5 py-1 text-[11px] font-bold text-[#123B2A] shadow-sm hover:bg-[#EAF3EE] transition"
                      >
                        {readingId === n.id ? "Marking..." : "Mark as read"}
                      </button>
                    )}
                  </div>
                );
              })}
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
