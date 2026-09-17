"use client";

import React from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = FolderOpen,
  title = "No records found",
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0F5F2] text-[#406854]">
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <h3 className="mt-4 text-[15px] font-semibold text-[#142019]">{title}</h3>
      <p className="mt-1 max-w-sm text-[13px] text-[#6E7F75]">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
