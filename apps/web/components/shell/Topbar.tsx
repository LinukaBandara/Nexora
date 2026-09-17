"use client";

import { Bell, Search } from "lucide-react";
import Link from "next/link";

type TopbarProps = {
  breadcrumb?: string;
  userEmail?: string | null;
};

export function Topbar({ breadcrumb, userEmail }: TopbarProps) {
  const safeEmail = userEmail?.trim() || "User";
  const initials = safeEmail.slice(0, 2).toUpperCase();
  const section = breadcrumb?.split("/")[0]?.trim() || "Overview";

  return (
    <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-[#E4EAE6] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <div className="hidden h-8 w-px bg-[#DCE4DF] sm:block" />
        <div className="min-w-0">
          <div className="truncate text-[11px] font-medium uppercase tracking-[0.13em] text-[#87938D]">NEXORA / {section}</div>
          <div className="mt-0.5 truncate text-[14px] font-semibold text-[#142019]">{breadcrumb || "Overview"}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button aria-label="Search" className="hidden h-9 w-9 items-center justify-center rounded-[10px] text-[#65736B] transition hover:bg-[#F2F5F3] hover:text-[#123B2A] sm:flex">
          <Search size={17} />
        </button>
        <Link href="/notifications" aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-[10px] text-[#65736B] transition hover:bg-[#F2F5F3] hover:text-[#123B2A]">
          <Bell size={17} />
          <span className="absolute right-[8px] top-[7px] h-1.5 w-1.5 rounded-full bg-[#1F7A4D] ring-2 ring-white" />
        </Link>
        <div className="ml-1 h-7 w-px bg-[#E4EAE6]" />
        <div className="flex items-center gap-2.5 pl-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DDEDE4] text-[10px] font-bold text-[#123B2A]">{initials}</div>
          <div className="hidden max-w-[150px] sm:block">
            <div className="truncate text-[11px] font-semibold text-[#142019]">{safeEmail}</div>
            <div className="text-[9px] uppercase tracking-[0.12em] text-[#87938D]">Administrator</div>
          </div>
        </div>
      </div>
    </header>
  );
}
