"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { getMe, MeResult } from "@/lib/nexora-api";

const BREADCRUMBS: Record<string, string> = {
  "/dashboard": "Overview",
  "/inventory": "Inventory / Products",
  "/sales": "Sales / Customers",
  "/sales/orders": "Sales / Orders",
  "/purchasing": "Purchasing",
  "/finance": "Finance / Overview",
  "/finance/invoices": "Finance / Invoices",
  "/sync": "System / Sync Center",
  "/notifications": "Notifications",
};

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<MeResult | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    getMe()
      .then(setMe)
      .catch(() => router.push("/login"))
      .finally(() => setChecked(true));
  }, [router]);

  if (!checked || !me) {
    return <div className="flex min-h-screen items-center justify-center bg-white text-secondary text-text-muted">Loading NEXORA...</div>;
  }

  return (
    <div className="min-h-screen bg-white lg:flex">
      <Sidebar permissions={me.permissions} />
      <div className="min-w-0 flex-1 bg-background">
        <Topbar breadcrumb={BREADCRUMBS[pathname ?? ""] ?? "NEXORA"} userEmail={me.email} />
        <main key={pathname} className="min-h-[calc(100vh-68px)] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto w-full max-w-[1440px] animate-content-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
