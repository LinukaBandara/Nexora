"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { NexoraLogo } from "@/components/brand/NexoraLogo";
import { getMe, MeResult } from "@/lib/nexora-api";

const BREADCRUMBS: Record<string, string> = { "/dashboard": "Overview", "/inventory": "Inventory / Products", "/sales": "Sales / Customers", "/sales/orders": "Sales / Orders", "/purchasing": "Purchasing", "/finance": "Finance / Overview", "/sync": "System / Sync Center", "/notifications": "Notifications" };

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter(); const pathname = usePathname(); const [me, setMe] = useState<MeResult | null>(null); const [checked, setChecked] = useState(false); const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => { getMe().then(setMe).catch(() => router.push("/login")).finally(() => setChecked(true)); }, [router]);
  if (!checked || !me) return <div className="flex min-h-screen items-center justify-center bg-[#F5F7F5]"><div className="flex flex-col items-center gap-3"><NexoraLogo dark showTagline /><div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#7A8C81]">Loading workspace</div></div></div>;
  return (
    <div className="min-h-screen bg-[#F5F7F5] lg:flex">
      <Sidebar permissions={me.permissions} open={menuOpen} onClose={() => setMenuOpen(false)} userEmail={me.email} />
      <div className="min-w-0 flex-1">
        <Topbar breadcrumb={BREADCRUMBS[pathname ?? ""] ?? "NEXORA"} userEmail={me.email} onMenuClick={() => setMenuOpen(true)} />
        <main key={pathname} className="min-h-[calc(100vh-70px)] px-4 py-6 sm:px-6 lg:px-8 lg:py-7"><div className="mx-auto w-full max-w-[1440px] animate-content-in">{children}</div></main>
      </div>
    </div>
  );
}
