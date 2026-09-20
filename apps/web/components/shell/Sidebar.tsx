"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Box, ChevronRight, CircleDollarSign, LayoutDashboard, RefreshCw, ShoppingCart, Truck, X, FileText, Building2 } from "lucide-react";
import clsx from "clsx";
import { NexoraLogo } from "@/components/brand/NexoraLogo";

interface NavItemConfig { label: string; href: string; icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>; group: "menu" | "operations" | "system"; permissionKey: string | null; badge?: number | string; }
const NAV_CONFIG: NavItemConfig[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, group: "menu", permissionKey: null },
  { label: "Customers", href: "/sales", icon: ShoppingCart, group: "menu", permissionKey: "sales" },
  { label: "Sales Orders", href: "/sales/orders", icon: FileText, group: "menu", permissionKey: "sales" },
  { label: "Inventory", href: "/inventory", icon: Box, group: "menu", permissionKey: "inventory" },
  { label: "Purchasing", href: "/purchasing", icon: Truck, group: "operations", permissionKey: "purchasing" },
  { label: "Finance", href: "/finance", icon: CircleDollarSign, group: "operations", permissionKey: "finance" },
  { label: "Notifications", href: "/notifications", icon: Bell, group: "system", permissionKey: null },
  { label: "Sync Center", href: "/sync", icon: RefreshCw, group: "system", permissionKey: "sync" },
];
const PERMISSION_ALIASES: Record<string, string[]> = { sales: ["sales.read", "sales.view", "sales.manage", "sales.approve"], inventory: ["inventory.read", "inventory.view", "inventory.manage"], purchasing: ["purchasing.read", "purchasing.view", "purchasing.manage", "purchasing.approve"], finance: ["finance.read", "finance.view", "finance.manage"], sync: ["system.sync.view", "sync.view", "sync.read"] };

interface SidebarProps { permissions: string[]; open?: boolean; onClose?: () => void; userEmail?: string | null; unreadCount?: number; }

export function Sidebar({ permissions, open = false, onClose, userEmail, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const perms = new Set(permissions.map((p) => p.toLowerCase()));
  const filteredItems = NAV_CONFIG.filter((item) => item.permissionKey === null || (PERMISSION_ALIASES[item.permissionKey] ?? []).some((p) => perms.has(p)));
  const menuItems = filteredItems.filter((i) => i.group === "menu");
  const operationItems = filteredItems.filter((i) => i.group === "operations");
  const systemItems = filteredItems.filter((i) => i.group === "system");
  const displayName = userEmail ? userEmail.split("@")[0] : "Admin";
  const initials = displayName.slice(0, 2).toUpperCase();

  const renderNavGroup = (title: string, items: NavItemConfig[]) => items.length === 0 ? null : (
    <div className="space-y-1">
      <div className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#78A88F]">{title}</div>
      {items.map((item) => {
        const isActive = item.href === "/sales" ? pathname === "/sales" : pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(`${item.href}/`));
        const Icon = item.icon;
        return <Link key={item.href} href={item.href} onClick={onClose} className={clsx("group relative flex w-full items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-[13px] font-medium transition-colors", isActive ? "bg-white text-[#123B2A] font-semibold shadow-sm" : "text-[#D3E5DB] hover:bg-white/[0.08] hover:text-white")}>
          {isActive && <span className="absolute -left-1 top-2 bottom-2 w-1.5 rounded-full bg-[#8EE04E]" />}
          <Icon size={18} strokeWidth={isActive ? 2.4 : 2} className={isActive ? "text-[#123B2A]" : "text-[#97BCAB] group-hover:text-white"} />
          <span className="flex-1 truncate">{item.label}</span>
          {item.label === "Notifications" && unreadCount > 0 && !isActive && <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#8EE04E] px-1.5 text-[10px] font-bold text-[#0F2A1E]">{unreadCount > 99 ? "99+" : unreadCount}</span>}
          {isActive && <ChevronRight size={14} className="text-[#123B2A]/70" />}
        </Link>;
      })}
    </div>
  );

  const sidebarContent = <aside className="flex h-full w-[260px] flex-col bg-[#123B2A] text-white select-none">
    <div className="flex items-center justify-between px-6 pb-4 pt-6">
      <Link href="/dashboard" onClick={onClose} aria-label="NEXORA dashboard" className="transition-opacity hover:opacity-90"><NexoraLogo showTagline /></Link>
      <button onClick={onClose} className="rounded-lg p-1.5 text-[#91B5A1] hover:bg-white/10 lg:hidden" aria-label="Close navigation"><X size={18} /></button>
    </div>
    <div className="px-5 py-2"><div className="flex items-center rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-xs text-[#D5E6DC]"><div className="flex items-center gap-2.5"><Building2 size={15} className="text-[#8EE04E]" /><div><div className="text-[9px] font-bold uppercase tracking-wider text-[#7EAC95]">Workspace</div><div className="font-semibold text-white">Main Organization</div></div></div></div>
    <nav className="flex-1 space-y-3 overflow-y-auto px-4 py-3">{renderNavGroup("Menu", menuItems)}{renderNavGroup("Operations", operationItems)}{renderNavGroup("General", systemItems)}</nav>
    <div className="border-t border-white/10 p-4"><div className="flex items-center gap-3 rounded-xl bg-white/[0.06] p-2.5"><div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#E5F5EC] text-xs font-bold text-[#123B2A]">{initials}<span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#8EE04E] ring-2 ring-[#123B2A]" /></div><div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold text-white capitalize">{displayName}</div><div className="truncate text-[10px] text-[#8CB49E]">{userEmail || "Executive Access"}</div></div></div><div className="mt-3 text-center text-[8px] font-medium uppercase tracking-[0.18em] text-[#6F9A85]">Powered by NEXORA · <a href="https://ark-ii.studio" target="_blank" rel="noreferrer" className="text-[#8CB49E] underline-offset-4 hover:text-white hover:underline">ARK II</a></div></div>
  </aside>;

  return <><div className="hidden lg:sticky lg:top-0 lg:z-40 lg:block lg:h-screen">{sidebarContent}</div>{open && <div className="fixed inset-0 z-[80] flex lg:hidden"><button aria-label="Close navigation" onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" /><div className="relative z-10 animate-content-in shadow-2xl">{sidebarContent}</div></div>}</>;
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) { return <button onClick={onClick} aria-label="Open navigation" className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#DCE4DE] bg-white text-[#123B2A] shadow-sm hover:bg-[#F3F6F4] lg:hidden"><span className="text-base font-semibold">☰</span></button>; }
