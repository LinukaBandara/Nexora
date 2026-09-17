import clsx from "clsx";

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  changeLabel?: string;
  changeDirection?: "up" | "down" | "flat";
  variant?: "light" | "dark";
  sparkline?: number[];
}

const changeColor = { up: "text-success", down: "text-danger", flat: "text-text-muted" };

function Sparkline({ values, dark }: { values: number[]; dark: boolean }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-8 items-end gap-1" aria-hidden="true">
      {values.slice(-12).map((value, index) => (
        <span
          key={index}
          className={clsx("w-1.5 rounded-full", dark ? "bg-primary" : "bg-primary/65")}
          style={{ height: `${Math.max(18, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function KpiCard({ label, value, changeLabel, changeDirection, variant = "light", sparkline }: KpiCardProps) {
  const dark = variant === "dark";
  return (
    <div className={clsx("min-w-0 rounded-card p-4 sm:p-5", dark ? "bg-dark-card-bg" : "border border-border bg-surface shadow-card")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className={clsx("text-dense uppercase tracking-wide", dark ? "text-dark-card-text-muted" : "text-text-muted")}>{label}</div>
          <div className={clsx("mt-2 truncate text-xl font-semibold tabular-nums sm:text-2xl", dark ? "text-dark-card-text" : "text-text-primary")}>{value}</div>
        </div>
        {sparkline && sparkline.length > 0 && <Sparkline values={sparkline} dark={dark} />}
      </div>
      {changeLabel && changeDirection && (
        <div className={clsx("mt-3 text-secondary font-medium", dark ? "text-dark-card-text-muted" : changeColor[changeDirection])}>
          {changeDirection === "up" ? "↑" : changeDirection === "down" ? "↓" : "–"} {changeLabel}
        </div>
      )}
    </div>
  );
}
