"use client";

import { useState } from "react";

interface LineChartPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineChartPoint[];
  formatValue?: (value: number) => string;
  height?: number;
}

// Intentionally hand-rolled SVG rather than a charting library dependency -
// this repo has never had `npm install` run against it, so every new
// dependency is unverified risk. A ~60-line chart covering line + hover
// tooltip + zero-data handling is small enough to trust without running it;
// swap for recharts/visx later if real interaction needs (zoom, legends,
// multi-series) outgrow this.
export function LineChart({ data, formatValue = (v) => String(v), height = 160 }: LineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-secondary text-text-muted" style={{ height }}>
        No data for this period.
      </div>
    );
  }

  const width = 600;
  const padding = 24;
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = data.length === 1 ? width / 2 : padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d.value - min) / range) * (height - padding * 2);
    return { x, y, ...d };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const zeroY = height - padding - ((0 - min) / range) * (height - padding * 2);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        <line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke="var(--color-border)" strokeWidth={1} />
        <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth={2} />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoverIndex === i ? 4 : 2.5}
            fill="var(--color-primary)"
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
            style={{ cursor: "pointer" }}
          />
        ))}
      </svg>
      {hoverIndex !== null && (
        <div className="pointer-events-none absolute rounded-control border border-border bg-surface px-2 py-1 text-dense shadow-dropdown"
          style={{
            left: `${(points[hoverIndex].x / width) * 100}%`,
            top: 0,
            transform: "translate(-50%, -110%)",
          }}
        >
          <div className="font-medium text-text-primary">{formatValue(points[hoverIndex].value)}</div>
          <div className="text-text-muted">{points[hoverIndex].label}</div>
        </div>
      )}
    </div>
  );
}
