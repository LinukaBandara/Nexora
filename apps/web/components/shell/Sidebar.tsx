"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Box, ChevronRight, CircleDollarSign, LayoutDashboard, RefreshCw, ShoppingCart, Truck, X } from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  ["Dashboard", "/dashboard", LayoutDashboard, null], ["Sales", "/sales", ShoppingCart, "sales"], ["Sales orders", "/sales/orders", ShoppingCart, "sales"], ["Inventory", "/inventory", Box, "inventory"], ["Purchasing", "/purchasing", Truck, "purchasing"], ["Finance", "/finance", CircleDollarSign, "finance"], ["Notifications", "/notifications", Bell, null], ["Sync Center", "/sync", RefreshCw, "sync"],
] as const;
const ALIASES: Record<string, string[]> = { sales: ["sales.read", "sales.view", "sales.manage", "sales.approve"], inventory: ["inventory.read", "inventory.view", "inventory.manage"], purchasing: ["purchasing.read", "purchasing.view", "purchasing.manage", "purchasing.approve"], finance: ["finance.read", "finance.view", "finance.manage"], sync: ["system.sync.view", "sync.view", "sync.read"] };

type Props = { permissions: string[]; open?: boolean; onClose?: () => void };
export function Sidebar({ permissions, open = false, onClose }: Props) {
  const pathname = usePathname();
  const perms = new Set(permissions.map((p) => p.toLowerCase()));
  const items = NAV_ITEMS.filter((item) => item[3] === null || (ALIASES[item[3]] ?? []).some((p) => perms.has(p)));
  const content = <aside className="flex h-full w-[276px] flex-col bg-[#123B2A] text-white shadow-2xl lg:w-[252px]">
    <div className="flex items-center justify-between px-6 py-7"><Link href="/dashboard" onClick={onClose} className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-extrabold text-[#123B2A]">N</div><div><div className="text-[15px] font-bold tracking-[.08em]">NEXORA</div><div className="text-[9px] uppercase tracking-[.2em] text-[#91B4A0]">Business OS</div></div></Link><button onClick={onClose} className="rounded-lg p-2 text-[#9BB9A8] hover:bg-white/10 lg:hidden"><X size={18}/></button></div>
    <div className="px-5 pb-4"><div className="rounded-xl border border-white/10 bg-white/[.055] px-3 py-3"><div className="text-[9px] font-bold uppercase tracking-[.18em] text-[#7FAE95]">Workspace</div><div className="mt-1 flex justify-between text-xs font-semibold">Primary business <ChevronRight size={13}/></div></div></div>
    <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-5"><div className="px-2 pb-2 text-[9px] font-bold uppercase tracking-[.18em] text-[#7FAE95]">Navigation</div>{items.map(([label, href, Icon]) => { const active = pathname === href || (href !== "/dashboard" && pathname?.startsWith(`${href}/`)); return <Link key={href} href={href} onClick={onClose} className={clsx("flex w-full items-center gap-3 rounded-[11px] px-3.5 py-3 text-xs font-semibold", active ? "bg-white text-[#123B2A]" : "text-[#CFE1D6] hover:bg-white/[.075] hover:text-white")}><Icon size={17} strokeWidth={active ? 2.4 : 2}/><span>{label}</span>{active && <ChevronRight size={14} className="ml-auto"/>}</Link>; })}</nav>
    <div className="border-t border-white/10 p-4"><div className="flex items-center gap-3 rounded-xl bg-white/[.055] px-3 py-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DCEDE4] text-[10px] font-bold text-[#123B2A]">NX</div><div><div className="text-[11px] font-semibold">NEXORA Workspace</div><div className="text-[9px] text-[#91B4A0]">ERP Administration</div></div></div></div>
  </aside>;
  return <><div className="hidden lg:sticky lg:top-0 lg:z-40 lg:block lg:h-screen">{content}</div>{open && <div className="fixed inset-0 z-[80] flex lg:hidden"><button aria-label="Close navigation" onClick={onClose} className="absolute inset-0 bg-black/45"/>{content}</div>}</>;
}
export function MobileMenuButton({ onClick }: { onClick: () => void }) { return <button onClick={onClick} aria-label="Open navigation" className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#123B2A] text-white shadow-sm lg:hidden"><span className="text-lg">☰</span></button>; }
