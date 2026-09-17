"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Plus, Search, RefreshCw } from "lucide-react";
import { MobileMenuButton } from "./Sidebar";

interface TopbarProps {
  breadcrumb?: string;
  userEmail?: string | null;
  onMenuClick?: () => void;
}

export function Topbar({ breadcrumb = "Overview", userEmail, onMenuClick }: TopbarProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const email = userEmail?.trim() || "Admin";
  const initials = email.slice(0, 2).toUpperCase();

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = searchValue.trim();
    router.push(value ? `/inventory?search=${encodeURIComponent(value)}` : "/inventory");
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-[#E4EAE6] bg-white px-3 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <MobileMenuButton onClick={onMenuClick ?? (() => {})} />
        <button type="button" onClick={() => setProfileOpen(false)} className="hidden items-center gap-2 rounded-xl border border-[#E3E9E5] bg-[#F9FAF9] px-3.5 py-1.5 text-left transition-colors hover:border-[#D0DBD3] sm:flex">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#768A7E]">Role</span>
            <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#142019]"><span>Executive Admin</span><ChevronDown size={14} className="text-[#65796E]" /></div>
          </div>
        </button>
        <div className="hidden h-6 w-px bg-[#E2E8E4] md:block" />
        <div className="hidden min-w-0 md:block"><div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#829589]">NEXORA ERP</div><div className="truncate text-xs font-semibold text-[#142019]">{breadcrumb}</div></div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input type="text" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Search NEXORA..." aria-label="Search NEXORA inventory" className="h-9 w-[128px] rounded-full border border-[#E3E9E5] bg-[#FAFCFA] pl-3 pr-9 text-[11px] text-[#142019] placeholder:text-[#88998E] focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15 sm:h-10 sm:w-52 sm:pl-4 md:w-64 lg:w-72" />
          <button type="submit" aria-label="Search" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#7F9387] transition hover:bg-[#EDF3EF] hover:text-[#142019]"><Search size={15} /></button>
        </form>
        <Link href="/sync" title="Sync Center" aria-label="Open Sync Center" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E4EAE6] text-[#617468] transition hover:bg-[#F2F5F3] hover:text-[#142019]"><RefreshCw size={15} /></Link>
        <Link href="/notifications" title="Notifications" aria-label="Open notifications" className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E4EAE6] text-[#617468] transition hover:bg-[#F2F5F3] hover:text-[#142019]"><Bell size={15} /><span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-[#8EE04E] ring-2 ring-white" /></Link>
        <Link href="/inventory" className="hidden h-9 items-center gap-1.5 rounded-full bg-[#123B2A] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#184F38] active:scale-[0.98] sm:inline-flex"><Plus size={14} strokeWidth={2.5} /><span>Add product</span></Link>
        <div className="relative">
          <button type="button" aria-label="Open account menu" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DCEDE3] text-[11px] font-bold text-[#123B2A] ring-1 ring-[#CCD8D0] transition hover:ring-2 hover:ring-[#AFC4B6]">{initials}</button>
          {profileOpen && <>
            <button type="button" aria-label="Close account menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setProfileOpen(false)} />
            <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-[#E1E8E3] bg-white p-2 shadow-[0_18px_50px_rgba(18,59,42,0.16)]">
              <div className="border-b border-[#EDF1EE] px-3 py-3"><p className="truncate text-xs font-bold text-[#142019]">{email}</p><p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#7A8C81]">Executive Administrator</p></div>
              <button type="button" onClick={handleSignOut} disabled={signingOut} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-[#B33B3B] transition hover:bg-[#FFF2F2] disabled:cursor-wait disabled:opacity-60"><LogOut size={15} />{signingOut ? "Signing out..." : "Sign out"}</button>
            </div>
          </>}
        </div>
      </div>
    </header>
  );
}
