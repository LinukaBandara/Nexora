"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

interface PageHeaderProps {
  breadcrumbs?: string[];
  title: string;
  description?: string;
  actions?: React.ReactNode;
  dateBadge?: React.ReactNode;
}

export function PageHeader({
  breadcrumbs,
  title,
  description,
  actions,
  dateBadge,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-[#E3E9E5] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight size={12} className="text-[#8BA596]" />}
                <span className={idx === breadcrumbs.length - 1 ? "text-text-primary" : ""}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="mt-1.5 text-[26px] font-bold tracking-[-0.03em] text-[#142019] sm:text-[30px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-[13px] text-[#65766D] max-w-2xl">{description}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
        {dateBadge}
        {actions}
      </div>
    </header>
  );
}
