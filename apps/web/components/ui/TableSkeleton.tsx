"use client";

import React from "react";

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full divide-y divide-[#EAEFEA]">
      <div className="flex h-11 items-center gap-4 bg-[#F8FAF8] px-6">
        <div className="h-3.5 w-24 animate-pulse rounded bg-[#E3E9E5]" />
        <div className="h-3.5 w-32 animate-pulse rounded bg-[#E3E9E5]" />
        <div className="ml-auto h-3.5 w-20 animate-pulse rounded bg-[#E3E9E5]" />
        <div className="h-3.5 w-16 animate-pulse rounded bg-[#E3E9E5]" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex h-16 items-center gap-4 px-6">
          <div className="h-4 w-40 animate-pulse rounded bg-[#EDF2EE]" />
          <div className="h-4 w-28 animate-pulse rounded bg-[#EDF2EE]" />
          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-[#EDF2EE]" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-[#EDF2EE]" />
        </div>
      ))}
    </div>
  );
}
