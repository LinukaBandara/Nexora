import React from "react";
import clsx from "clsx";
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react";

export interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  detail?: string;
  changeLabel?: string;
  changeDirection?: "up" | "down" | "flat";
  variant?: "light" | "dark";
  tag?: string;
  date?: string;
  sparkline?: number[];
  icon?: React.ReactNode;
  onOptionsClick?: () => void;
  className?: string;
}

function Sparkline({ values, dark }: { values: number[]; dark: boolean }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-8 items-end gap-1" aria-hidden="true">
      {values.slice(-12).map((value, index) => (
        <span
          key={index}
          className={clsx("w-1.5 rounded-full transition-all", dark ? "bg-[#8EE04E]" : "bg-primary/70")}
          style={{ height: `${Math.max(20, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  detail,
  changeLabel,
  changeDirection,
  variant = "light",
  tag,
  date,
  sparkline,
  icon,
  onOptionsClick,
  className,
}: KpiCardProps) {
  const dark = variant === "dark";

  if (dark) {
    return (
      <div
        className={clsx(
          "relative flex min-h-[140px] flex-col justify-between overflow-hidden rounded-[16px] bg-[#123B2A] p-5 text-white shadow-sm transition-all hover:shadow-md",
          className
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8EE04E]" />
              {tag ?? "Live"}
            </span>
            {date && <span className="text-[11px] text-[#A6C5B4]">{date}</span>}
          </div>
          {onOptionsClick && (
            <button
              onClick={onOptionsClick}
              aria-label="Options"
              className="text-[#9CBCA9] hover:text-white"
            >
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>

        <div className="mt-3 min-w-0">
          <div className="text-[12px] font-medium text-[#C1D9CB]">{label}</div>
          <div className="mt-1 truncate text-2xl font-bold tracking-tight text-white sm:text-[28px]">
            {value}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          {changeLabel && (
            <div className="flex items-center gap-1 text-[12px] font-medium text-[#8EE04E]">
              <ArrowUpRight size={14} />
              <span>{changeLabel}</span>
            </div>
          )}
          {detail && !changeLabel && (
            <div className="text-[11px] text-[#A6C5B4]">{detail}</div>
          )}
          {sparkline && sparkline.length > 0 && <Sparkline values={sparkline} dark={true} />}
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "flex min-h-[140px] flex-col justify-between rounded-[16px] border border-[#E3E9E5] bg-white p-5 shadow-sm transition-all hover:border-[#D0DBD3] hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-semibold text-[#5A6D62]">{label}</span>
        <div className="flex items-center gap-1">
          {icon}
          {onOptionsClick && (
            <button
              onClick={onOptionsClick}
              aria-label="Options"
              className="rounded-lg p-1 text-[#9BB1A4] hover:bg-[#F2F5F3] hover:text-[#142019]"
            >
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-2.5 min-w-0">
        <div className="truncate text-2xl font-bold tracking-tight text-[#142019] sm:text-[28px]">
          {value}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        {changeLabel ? (
          <div
            className={clsx(
              "flex items-center gap-1 text-[12px] font-semibold",
              changeDirection === "up"
                ? "text-[#1F7A4D]"
                : changeDirection === "down"
                ? "text-[#C84A4A]"
                : "text-[#6B7E73]"
            )}
          >
            {changeDirection === "up" ? (
              <ArrowUpRight size={14} />
            ) : changeDirection === "down" ? (
              <ArrowDownRight size={14} />
            ) : null}
            <span>{changeLabel}</span>
          </div>
        ) : detail ? (
          <div className="text-[11px] font-medium text-[#7C8F84]">{detail}</div>
        ) : (
          <span />
        )}
        {sparkline && sparkline.length > 0 && <Sparkline values={sparkline} dark={false} />}
      </div>
    </div>
  );
}
