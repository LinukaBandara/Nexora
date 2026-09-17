"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, Plus, Search, RefreshCw } from "lucide-react";
import { MobileMenuButton } from "./Sidebar";

interface TopbarProps {
  breadcrumb?: string;
  userEmail?: string | null;
  onMenuClick?: () => void;
}

export function Topbar({ breadcrumb = "Overview", userEmail, onMenuClick }: TopbarProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const email = userEmail?.trim() || "Admin";
  const initials = email.slice(0, 2).toUpperCase();

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchValue.trim()) return;
    router.push(`/inventory?search=${encodeURIComponent(searchValue.trim())}`);
  }

  return (
    <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-[#E4EAE6] bg-white px-4 sm:px-6 lg:px-8">
      {/* Left section: Mobile menu + Workspace dropdown selector */}
      <div className="flex items-center gap-3">
        <MobileMenuButton onClick={onMenuClick ?? (() => {})} />

        {/* Workspace dropdown selector matching reference */}
        <div className="flex items-center gap-2 rounded-xl border border-[#E3E9E5] bg-[#F9FAF9] px-3.5 py-1.5 transition-colors hover:border-[#D0DBD3]">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#768A7E]">
              Role
            </span>
            <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#142019]">
              <span>Executive Admin</span>
              <ChevronDown size={14} className="text-[#65796E]" />
            </div>
          </div>
        </div>

        <div className="hidden h-6 w-px bg-[#E2E8E4] md:block" />

        <div className="hidden min-w-0 md:block">
          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#829589]">
            NEXORA ERP
          </div>
          <div className="truncate text-xs font-semibold text-[#142019]">{breadcrumb}</div>
        </div>
      </div>

      {/* Right section: Search bar + Notification + Quick Action + Avatar */}
      <div className="flex items-center gap-3">
        {/* Search input with rounded-full pill styling from reference */}
        <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search anything in NEXORA..."
            className="h-10 w-52 rounded-full border border-[#E3E9E5] bg-[#FAFCFA] pl-4 pr-9 text-xs text-[#142019] placeholder:text-[#88998E] focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15 md:w-64 lg:w-72 transition-all"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7F9387] hover:text-[#142019]"
          >
            <Search size={15} />
          </button>
        </form>

        {/* Sync Status Button */}
        <Link
          href="/sync"
          title="Sync Center"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4EAE6] text-[#617468] hover:bg-[#F2F5F3] hover:text-[#142019] transition"
        >
          <RefreshCw size={15} />
        </Link>

        {/* Notification Bell with indicator */}
        <Link
          href="/notifications"
          title="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#E4EAE6] text-[#617468] hover:bg-[#F2F5F3] hover:text-[#142019] transition"
        >
          <Bell size={15} />
          <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-[#8EE04E] ring-2 ring-white" />
        </Link>

        {/* Quick Action Button matching reference "+ Add new product" */}
        <Link
          href="/inventory"
          className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-full bg-[#123B2A] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#184F38] transition active:scale-[0.98]"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>New action</span>
        </Link>

        {/* User avatar */}
        <div
          title={email}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DCEDE3] text-[11px] font-bold text-[#123B2A] ring-1 ring-[#CCD8D0]"
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
