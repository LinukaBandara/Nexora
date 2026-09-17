"use client";

import { useState } from "react";

export interface BarChartPoint {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartPoint[];
  formatValue?: (value: number) => string;
  height?: number;
  color?: string;
  accentColor?: string;
}

export function BarChart({
  data,
  formatValue = (v) => String(v),
  height = 160,
  color = "#1F7A4D",
  accentColor = "#8EE04E",
}: BarChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-text-muted" style={{ height }}>
        No data for this period.
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const barGap = 8;
  const width = 600;
  const paddingX = 16;
  const paddingTop = 16;
  const paddingBottom = 28;
  const availableWidth = width - paddingX * 2;
  const barWidth = Math.max(4, availableWidth / data.length - barGap);
  const chartHeight = height - paddingBottom - paddingTop;

  return (
    <div className="relative select-none">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        {/* Gridlines */}
        {[0.25, 0.5, 0.75, 1].map((r, i) => {
          const y = paddingTop + chartHeight * (1 - r);
          return (
            <line
              key={i}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="var(--color-border)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          );
        })}

        {data.map((d, i) => {
          const barHeightPx = Math.max(4, (d.value / max) * chartHeight);
          const x = paddingX + (i / data.length) * availableWidth + barGap / 2;
          const y = paddingTop + chartHeight - barHeightPx;
          const isHovered = hoverIndex === i;
          const isMax = d.value === max;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeightPx}
                rx={5}
                ry={5}
                fill={isHovered ? accentColor : isMax ? color : `${color}99`}
                className="transition-all duration-150"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                style={{ cursor: "pointer" }}
              />
              {/* Label */}
              <text
                x={x + barWidth / 2}
                y={height - 8}
                textAnchor="middle"
                fontSize="9"
                fill="var(--color-text-muted)"
                fontFamily="inherit"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoverIndex !== null && (() => {
        const d = data[hoverIndex];
        const i = hoverIndex;
        const x = paddingX + (i / data.length) * (width - paddingX * 2) + barGap / 2 + barWidth / 2;
        return (
          <div
            className="pointer-events-none absolute z-10 rounded-[10px] border border-border bg-white px-3 py-2 shadow-dropdown"
            style={{
              left: `${(x / width) * 100}%`,
              bottom: `${paddingBottom}px`,
              transform: "translate(-50%, -8px)",
            }}
          >
            <div className="text-xs font-bold text-text-primary">{formatValue(d.value)}</div>
            <div className="mt-0.5 text-[10px] text-text-muted">{d.label}</div>
          </div>
        );
      })()}
    </div>
  );
}
