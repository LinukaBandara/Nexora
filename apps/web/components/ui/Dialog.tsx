"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface DialogProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

// One modal implementation for the whole app - every future "create X"
// form should use this rather than a new one-off overlay. Closes on
// Escape and on backdrop click, per the accessible-dialogs requirement
// in docs/design/design-system.md.
export function Dialog({ title, onClose, children }: DialogProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-dialog border border-border bg-surface p-6 shadow-dialog"
      >
        <div className="mb-4 flex items-center justify-between">
          <div id="dialog-title" className="text-card-title font-semibold text-text-primary">
            {title}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-text-muted hover:text-text-primary">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
