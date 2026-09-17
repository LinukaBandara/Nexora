"use client";
import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { MobileMenuButton } from "./Sidebar";

type TopbarProps = { breadcrumb?: string; userEmail?: string | null; onMenuClick?: () => void };
export function Topbar({ breadcrumb, userEmail, onMenuClick }: TopbarProps) {
  const email = userEmail?.trim() || "User";
  const initials = email.slice(0, 2).toUpperCase();
  return <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[#E4EAE6] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
    <div className="flex min-w-0 items-center gap-3"><MobileMenuButton onClick={onMenuClick ?? (() => {})}/><div className="hidden h-8 w-px bg-[#DCE4DF] sm:block"/><div className="min-w-0"><div className="truncate text-[10px] font-semibold uppercase tracking-[.15em] text-[#87938D]">NEXORA</div><div className="truncate text-sm font-semibold text-[#142019]">{breadcrumb || "Overview"}</div></div></div>
    <div className="flex items-center gap-2"><button className="hidden h-9 w-9 items-center justify-center rounded-[10px] text-[#65736B] hover:bg-[#F2F5F3] sm:flex"><Search size={17}/></button><Link href="/notifications" className="relative flex h-9 w-9 items-center justify-center rounded-[10px] text-[#65736B] hover:bg-[#F2F5F3]"><Bell size={17}/><span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-[#1F7A4D] ring-2 ring-white"/></Link><div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#DDEDE4] text-[10px] font-bold text-[#123B2A]">{initials}</div></div>
  </header>;
}
