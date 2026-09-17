"use client";

type TopbarProps = {
  breadcrumb?: string;
  userEmail?: string | null;
};

export function Topbar({ breadcrumb, userEmail }: TopbarProps) {
  const safeEmail = userEmail?.trim() || "User";
  const initials = safeEmail
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-[var(--topbar-height)] flex-shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex min-w-0 items-center gap-3">
        {breadcrumb && (
          <span className="truncate text-sm text-muted-foreground">
            {breadcrumb}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initials}
        </div>
      </div>
    </header>
  );
}