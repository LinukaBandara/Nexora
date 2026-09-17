"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, Box, Truck, Landmark, FileText,
  RefreshCw, History, Bell, Settings,
} from "lucide-react";
import clsx from "clsx";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  permission: string | null;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null },
  { label: "Sales", href: "/sales", icon: ShoppingCart, permission: "sales.read" },
  { label: "Sales orders", href: "/sales/orders", icon: ShoppingCart, permission: "sales.read" },
  { label: "Inventory", href: "/inventory", icon: Box, permission: "inventory.read" },
  { label: "Purchasing", href: "/purchasing", icon: Truck, permission: "purchasing.read" },
  { label: "Finance", href: "/finance", icon: Landmark, permission: "finance.read" },
  { label: "Invoices", href: "/finance/invoices", icon: FileText, permission: "finance.read" },
  { label: "Notifications", href: "/notifications", icon: Bell, permission: null },
  { label: "Sync Center", href: "/sync", icon: RefreshCw, permission: "system.sync.view" },
  { label: "Audit Logs", href: "/audit", icon: History, permission: "system.audit.view" },
];

// Dark sidebar matching the reference design - a flat item list (no
// section labels) with a solid green pill for the active item, rather
// than the earlier restrained-enterprise version's subtle left-border
// indicator. See docs/design/design-system.md for the full rationale
// behind this redesign.
export function Sidebar({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const hasPermission = (p: string | null) => p === null || permissions.includes(p);

  return (
    <aside className="flex w-[240px] flex-shrink-0 flex-col gap-1 bg-sidebar-bg p-4">
      <div className="mb-4 flex items-center gap-2 px-2 py-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-control bg-primary text-dense font-bold text-sidebar-active-text shadow-glow-sm">
          N
        </div>
        <span className="text-card-title font-semibold text-white">NEXORA</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.filter((item) => hasPermission(item.permission)).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-button px-3 py-2.5 text-body transition-all duration-base",
                isActive
                  ? "bg-sidebar-active font-medium text-sidebar-active-text shadow-glow-sm"
                  : "text-sidebar-text hover:bg-sidebar-surface"
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-white/10 pt-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-button px-3 py-2.5 text-body text-sidebar-text hover:bg-sidebar-surface"
        >
          <Settings size={16} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
