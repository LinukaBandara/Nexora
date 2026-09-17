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
  "/finance": "Finance",
  "/sync": "System / Sync Center",
  "/audit": "System / Audit Logs",
  "/notifications": "Notifications",
};

// Middleware (see middleware.ts) is now the primary auth gate - an
// unauthenticated request never reaches this component. This client-side
// check still exists for a narrower reason: populating the sidebar's
// permission list, which requires the actual /auth/me response, not just
// knowing a cookie is present.
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
    return <div className="flex min-h-screen items-center justify-center text-text-muted">Loading...</div>;
  }

  return (
    <div className="flex h-screen items-center justify-center p-8 md:p-12">
      {/* One rounded container holding both the dark sidebar and the light
          content panel, floating on the animated green gradient body
          background. Padding bumped up from the first pass (20px -> 32-48px)
          because the margin was nearly invisible at normal viewport sizes -
          see the screenshot review this was fixed from. overflow-hidden
          clips both the sidebar's dark corner and the content's light
          corner to the same outer radius. */}
      <div className="animate-panel-in flex h-full w-full overflow-hidden rounded-container shadow-panel-glow">
        <Sidebar permissions={me.permissions} />
        <div className="flex flex-1 flex-col bg-background">
          <Topbar breadcrumb={BREADCRUMBS[pathname ?? ""] ?? "NEXORA"} userEmail={me.email} />
          {/* key={pathname} forces a fresh mount per route, which re-triggers
              the fade-in animation on every navigation - a small but real
              "alive" touch rather than pages just snapping into place. */}
          <main key={pathname} className="animate-content-in flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
