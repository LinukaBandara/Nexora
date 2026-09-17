import clsx from "clsx";

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  changeLabel?: string;
  changeDirection?: "up" | "down" | "flat";
  /** "dark" matches the reference's black stat card (e.g. "Air Pollution
   * Level"); "light" matches its white stat cards. Not a status/severity
   * tone - purely visual, chosen per-card the way the reference alternates
   * one dark card with several light ones on the same dashboard. */
  variant?: "light" | "dark";
  /** A tiny inline bar sparkline, matching the reference's mini bar-chart
   * accents inside each stat card. Purely decorative trend indication -
   * not a substitute for the real LineChart used for the actual revenue
   * trend elsewhere on the dashboard. */
  sparkline?: number[];
}

const changeColor = {
  up: "text-success",
  down: "text-danger",
  flat: "text-text-muted",
};

function Sparkline({ values, dark }: { values: number[]; dark: boolean }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5" style={{ height: 24 }}>
      {values.map((v, i) => (
        <div
          key={i}
          className={dark ? "bg-primary" : "bg-primary/70"}
          style={{ width: 3, height: `${Math.max(8, (v / max) * 100)}%`, borderRadius: 2 }}
        />
      ))}
    </div>
  );
}

// Every KPI shows what it means, not a bare number - label, value, and
// (where meaningful) a comparison. See docs/design/design-system.md.
export function KpiCard({ label, value, changeLabel, changeDirection, variant = "light", sparkline }: KpiCardProps) {
  const dark = variant === "dark";

  return (
    <div
      className={clsx(
        "rounded-card p-4",
        dark ? "bg-dark-card-bg" : "border border-border bg-surface shadow-card"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={clsx("text-dense", dark ? "text-dark-card-muted" : "text-text-muted")}>{label}</div>
          <div className={clsx("mt-1 text-card-title font-semibold tabular-nums", dark ? "text-dark-card-text" : "text-text-primary")}>
            {value}
          </div>
        </div>
        {sparkline && <Sparkline values={sparkline} dark={dark} />}
      </div>
      {changeLabel && changeDirection && (
        <div className={clsx("mt-2 text-secondary font-medium", dark ? "text-dark-card-muted" : changeColor[changeDirection])}>
          {changeDirection === "up" ? "↑" : changeDirection === "down" ? "↓" : "–"} {changeLabel}
        </div>
      )}
    </div>
  );
}
