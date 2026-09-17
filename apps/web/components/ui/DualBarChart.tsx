"use client";

import React, { useState } from "react";

export interface DualBarPoint {
  label: string;
  income: number;
  expenses: number;
}

interface DualBarChartProps {
  data: DualBarPoint[];
  height?: number;
  formatValue?: (v: number) => string;
}

export function DualBarChart({ data, height = 180, formatValue = (v) => v.toLocaleString() }: DualBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expenses]), 1);

  return (
    <div className="relative w-full select-none">
      {/* Gridlines (visual only) */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ bottom: 28, top: 0 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border-t border-dashed border-border w-full" />
        ))}
      </div>

      <div className="relative flex items-end justify-between gap-2 sm:gap-3 pb-7" style={{ height }}>
        {data.map((item, idx) => {
          const incomeH = Math.max(6, (item.income / maxVal) * (height - 36));
          const expenseH = Math.max(4, (item.expenses / maxVal) * (height - 36));
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              className="group relative flex flex-1 flex-col items-center gap-1 h-full justify-end"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute bottom-full mb-2 z-10 w-max rounded-[10px] border border-border bg-white px-3 py-2 shadow-dropdown text-left">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-primary">
                    <span className="h-2 w-2 rounded-sm bg-[#123B2A] inline-block" />
                    Income: {formatValue(item.income)}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary mt-0.5">
                    <span className="h-2 w-2 rounded-sm bg-[#8EE04E] inline-block" />
                    Expenses: {formatValue(item.expenses)}
                  </div>
                </div>
              )}

              <div className="flex items-end gap-1 sm:gap-1.5 h-full w-full justify-center">
                {/* Income bar */}
                <div
                  className="w-2.5 sm:w-4 rounded-t-[6px] transition-all duration-300"
                  style={{
                    height: incomeH,
                    background: isHovered ? "#1A5038" : "#123B2A",
                  }}
                />
                {/* Expense bar */}
                <div
                  className="w-2.5 sm:w-4 rounded-t-[6px] transition-all duration-300"
                  style={{
                    height: expenseH,
                    background: isHovered ? "#A5EF5E" : "#8EE04E",
                  }}
                />
              </div>
              <span className="absolute bottom-0 text-[9px] font-medium text-text-muted truncate max-w-[42px]">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
