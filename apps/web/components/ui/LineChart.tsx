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
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

function catmullRomPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function LineChart({
  data,
  formatValue = (v) => String(v),
  height = 160,
  color = "#1F7A4D",
  gradientFrom = "rgba(31,122,77,0.18)",
  gradientTo = "rgba(31,122,77,0)",
}: LineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-secondary text-text-muted" style={{ height }}>
        No data for this period.
      </div>
    );
  }

  const width = 600;
  const paddingX = 28;
  const paddingY = 20;
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = data.length === 1 ? width / 2 : paddingX + (i / (data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((d.value - min) / range) * (height - paddingY * 2);
    return { x, y, ...d };
  });

  const smoothPath = catmullRomPath(points);
  const areaPath = smoothPath + ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  // Gridlines
  const gridLines = [0.25, 0.5, 0.75].map((ratio) => ({
    y: height - paddingY - ratio * (height - paddingY * 2),
    value: min + ratio * range,
  }));

  const gradientId = `lg-${color.replace("#", "")}`;

  return (
    <div className="relative select-none">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} overflow="visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {gridLines.map((g, i) => (
          <line
            key={i}
            x1={paddingX}
            y1={g.y}
            x2={width - paddingX}
            y2={g.y}
            stroke="var(--color-border)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Line */}
        <path d={smoothPath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Data point hit areas + dots */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={16}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              style={{ cursor: "pointer" }}
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={hoverIndex === i ? 5 : 3}
              fill={color}
              stroke="white"
              strokeWidth={hoverIndex === i ? 2 : 1.5}
              className="transition-all duration-150"
              pointerEvents="none"
            />
          </g>
        ))}

        {/* Hover vertical line */}
        {hoverIndex !== null && (
          <line
            x1={points[hoverIndex].x}
            y1={paddingY}
            x2={points[hoverIndex].x}
            y2={height - paddingY}
            stroke={color}
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.4}
            pointerEvents="none"
          />
        )}
      </svg>

      {/* Tooltip */}
      {hoverIndex !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-[10px] border border-border bg-white px-3 py-2 shadow-dropdown"
          style={{
            left: `${(points[hoverIndex].x / width) * 100}%`,
            top: 0,
            transform: "translate(-50%, -115%)",
          }}
        >
          <div className="text-xs font-bold text-text-primary">{formatValue(points[hoverIndex].value)}</div>
          <div className="mt-0.5 text-[10px] text-text-muted">{points[hoverIndex].label}</div>
        </div>
      )}
    </div>
  );
}
