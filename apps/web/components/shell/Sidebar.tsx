"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Box, Truck, Landmark, RefreshCw, Bell } from "lucide-react";
import clsx from "clsx";

interface NavItem { label: string; href: string; icon: React.ComponentType<{ size?: number; className?: string }>; permission: string | null; }

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null },
  { label: "Sales", href: "/sales", icon: ShoppingCart, permission: "sales.read" },
  { label: "Sales orders", href: "/sales/orders", icon: ShoppingCart, permission: "sales.read" },
  { label: "Inventory", href: "/inventory", icon: Box, permission: "inventory.read" },
  { label: "Purchasing", href: "/purchasing", icon: Truck, permission: "purchasing.read" },
  { label: "Finance", href: "/finance", icon: Landmark, permission: "finance.read" },
  { label: "Notifications", href: "/notifications", icon: Bell, permission: null },
  { label: "Sync Center", href: "/sync", icon: RefreshCw, permission: "system.sync.view" },
];

export function Sidebar({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const hasPermission = (p: string | null) => p === null || permissions.includes(p);
  return <aside className="sticky top-0 z-30 flex w-full flex-shrink-0 flex-col border-b border-sidebar-surface bg-sidebar-bg lg:h-screen lg:w-[238px] lg:border-b-0 lg:border-r">
    <div className="flex items-center px-4 py-4 lg:px-5 lg:py-5"><Link href="/dashboard" className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-control bg-primary text-sm font-bold text-white">N</div><div><div className="text-sm font-semibold tracking-wide text-white">NEXORA</div><div className="hidden text-[10px] uppercase tracking-[0.16em] text-sidebar-text-muted lg:block">Business OS</div></div></Link></div>
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:px-3 lg:pb-3">{NAV_ITEMS.filter(item => hasPermission(item.permission)).map(item => { const Icon = item.icon; const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(`${item.href}/`)); return <Link key={item.href} href={item.href} className={clsx("flex min-w-max items-center gap-2.5 rounded-control px-3 py-2.5 text-xs font-medium transition-colors", active ? "bg-sidebar-active text-sidebar-active-text" : "text-sidebar-text hover:bg-sidebar-surface hover:text-white")}><Icon size={16} /><span>{item.label}</span></Link>; })}</nav>
  </aside>;
}
