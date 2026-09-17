"use client";

import { useState } from "react";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function DonutChart({
  segments,
  size = 200,
  thickness = 38,
  centerLabel = "Total",
  centerValue,
}: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-text-muted" style={{ width: size, height: size }}>
        No data
      </div>
    );
  }

  let currentAngle = 0;
  const arcs = segments.map((seg, i) => {
    const sweep = (seg.value / total) * 360;
    const arc = {
      path: describeArc(cx, cy, r, currentAngle, currentAngle + sweep - 1),
      color: seg.color,
      label: seg.label,
      value: seg.value,
      index: i,
    };
    currentAngle += sweep;
    return arc;
  });

  const hovered = hoveredIndex !== null ? segments[hoveredIndex] : null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          {/* Background ring */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border)" strokeWidth={thickness} />

          {/* Segments */}
          {arcs.map((arc, i) => (
            <path
              key={i}
              d={arc.path}
              fill="none"
              stroke={arc.color}
              strokeWidth={hoveredIndex === i ? thickness + 5 : thickness}
              strokeLinecap="round"
              className="transition-all duration-200"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: "pointer" }}
            />
          ))}
        </svg>

        {/* Center text */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {hovered ? (
            <>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{hovered.label}</div>
              <div className="mt-0.5 text-xl font-bold text-text-primary">
                {Math.round((hovered.value / total) * 100)}%
              </div>
            </>
          ) : (
            <>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{centerLabel}</div>
              <div className="mt-0.5 text-xl font-bold text-text-primary">{centerValue ?? `${total}`}</div>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary cursor-pointer transition-opacity"
            style={{ opacity: hoveredIndex === null || hoveredIndex === i ? 1 : 0.4 }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span>{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
