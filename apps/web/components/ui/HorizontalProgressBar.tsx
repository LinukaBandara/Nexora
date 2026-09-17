"use client";

import React from "react";

interface ProgressItem {
  label: string;
  value: number;
  max: number;
  color?: string;
}

interface HorizontalProgressBarProps {
  items: ProgressItem[];
}

export function HorizontalProgressBar({ items }: HorizontalProgressBarProps) {
  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const percentage = Math.min(100, Math.max(8, (item.value / item.max) * 100));
        return (
          <div key={idx} className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium text-[#4C6154]">
              <span>{item.label}</span>
              <span className="font-semibold text-[#142019] tabular-nums">{item.value}</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-[7px] bg-[#EEF4F0]">
              <div
                className="h-full rounded-[7px] bg-[#8EE04E] transition-all duration-500 ease-out"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: item.color || "#8EE04E",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
