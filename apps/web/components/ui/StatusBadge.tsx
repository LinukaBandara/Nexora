import clsx from "clsx";

type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

interface StatusBadgeProps {
  label: string;
  tone: StatusTone;
}

const toneClasses: Record<StatusTone, string> = {
  success: "text-success bg-success-bg",
  warning: "text-warning bg-warning-bg",
  danger: "text-danger bg-danger-bg",
  info: "text-info bg-info-bg",
  neutral: "text-text-secondary bg-surface-secondary",
};

// Every status in the app (Paid, Low Stock, Overdue, Conflict, ...) renders
// through this one component - color + text + a dot, never color alone.
// See docs/design/design-system.md, "Color discipline".
export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-dense font-medium",
        toneClasses[tone]
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}
