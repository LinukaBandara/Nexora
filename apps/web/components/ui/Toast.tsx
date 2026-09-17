"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

// One toast at a time, auto-dismissing - matches design-system.md
// section 65: "use toast notifications for successful short actions...
// do not overuse toasts." No queue/stacking yet since nothing needs it.
export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-card border border-border bg-surface px-4 py-3 text-body text-text-primary shadow-dialog">
      <CheckCircle2 size={16} className="text-success" />
      {message}
    </div>
  );
}
