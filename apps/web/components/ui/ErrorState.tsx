"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: string | null;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading this data. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#F5C2C2]/60 bg-[#FDF5F5] px-6 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FDE8E8] text-[#C84A4A]">
        <AlertTriangle size={20} />
      </div>
      <h3 className="mt-3 text-[15px] font-semibold text-[#142019]">{title}</h3>
      <p className="mt-1 max-w-md text-[13px] text-[#7A5050]">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-4 gap-1.5 border-[#E6B8B8] bg-white text-[13px]">
          <RotateCcw size={14} /> Retry
        </Button>
      )}
    </div>
  );
}
