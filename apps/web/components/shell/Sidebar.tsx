"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Box,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  RefreshCw,
  ShoppingCart,
  Truck,
} from "lucide-react";
import clsx from "clsx";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  permission: string | null;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null },
  { label: "Sales", href: "/sales", icon: ShoppingCart, permission: "sales" },
  { label: "Sales orders", href: "/sales/orders", icon: ShoppingCart, permission: "sales" },
  { label: "Inventory", href: "/inventory", icon: Box, permission: "inventory" },
  { label: "Purchasing", href: "/purchasing", icon: Truck, permission: "purchasing" },
  { label: "Finance", href: "/finance", icon: CircleDollarSign, permission: "finance" },
  { label: "Notifications", href: "/notifications", icon: Bell, permission: null },
  { label: "Sync Center", href: "/sync", icon: RefreshCw, permission: "sync" },
];

const PERMISSION_ALIASES: Record<string, string[]> = {
  sales: ["sales.read", "sales.view", "sales.manage", "sales.approve"],
  inventory: ["inventory.read", "inventory.view", "inventory.manage"],
  purchasing: ["purchasing.read", "purchasing.view", "purchasing.manage", "purchasing.approve"],
  finance: ["finance.read", "finance.view", "finance.manage"],
  sync: ["system.sync.view", "sync.view", "sync.read"],
};

export function Sidebar({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const normalized = new Set(permissions.map((permission) => permission.toLowerCase()));
  const hasPermission = (key: string | null) =>
    key === null || (PERMISSION_ALIASES[key] ?? []).some((permission) => normalized.has(permission));

  return (
    <aside className="sticky top-0 z-40 flex h-auto w-full shrink-0 flex-col border-b border-[#28513e] bg-[#123B2A] text-white lg:h-screen lg:w-[252px] lg:border-b-0 lg:border-r lg:border-[#28513e]">
      <div className="flex items-center justify-between px-5 py-5 lg:px-6 lg:py-7">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white text-[15px] font-extrabold text-[#123B2A] shadow-sm">N</div>
          <div>
            <div className="text-[15px] font-bold tracking-[0.08em] text-white">NEXORA</div>
            <div className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.2em] text-[#9BC0AA]">Business OS</div>
          </div>
        </Link>
      </div>

      <div className="hidden px-5 pb-3 lg:block">
        <div className="rounded-[12px] border border-white/10 bg-white/[0.055] px-3 py-2.5">
          <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#91B4A0]">Workspace</div>
          <div className="mt-1 flex items-center justify-between text-[12px] font-medium text-white">
            <span>Primary business</span><ChevronRight size={13} className="text-[#91B4A0]" />
          </div>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:px-4 lg:pb-5">
        <div className="hidden px-2 pb-2 pt-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#7FAE95] lg:block">Workspace</div>
        {NAV_ITEMS.filter((item) => hasPermission(item.permission)).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "group flex min-w-max items-center gap-3 rounded-[11px] px-3.5 py-3 text-[12px] font-semibold transition-all lg:w-full",
                active
                  ? "bg-white text-[#123B2A] shadow-[0_4px_14px_rgba(0,0,0,0.10)]"
                  : "text-[#CFE1D6] hover:bg-white/[0.075] hover:text-white"
              )}
            >
              <Icon size={17} strokeWidth={active ? 2.4 : 2} className="shrink-0" />
              <span>{item.label}</span>
              {active && <ChevronRight size={14} className="ml-auto hidden lg:block" />}
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-white/10 p-4 lg:block">
        <div className="flex items-center gap-3 rounded-[12px] bg-white/[0.055] px-3 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DCEDE4] text-[10px] font-bold text-[#123B2A]">NX</div>
          <div className="min-w-0">
            <div className="truncate text-[11px] font-semibold text-white">NEXORA Workspace</div>
            <div className="text-[9px] text-[#91B4A0]">ERP Administration</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
