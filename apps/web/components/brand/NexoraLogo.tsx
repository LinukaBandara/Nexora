import React from "react";

type NexoraLogoProps = {
  compact?: boolean;
  dark?: boolean;
  showTagline?: boolean;
  className?: string;
};

export function NexoraLogo({ compact = false, dark = false, showTagline = false, className = "" }: NexoraLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        aria-hidden="true"
        className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] ${
          dark ? "bg-[#123B2A]" : "bg-[#0D2A1D]"
        } ${compact ? "h-9 w-9 rounded-[9px]" : "h-10 w-10"}`}
      >
        <span className="absolute left-[11px] top-[9px] h-[22px] w-[3px] rounded-full bg-[#8EE04E]" />
        <span className="absolute left-[18px] top-[9px] h-[22px] w-[3px] -rotate-[32deg] rounded-full bg-[#B9EACB]" />
        <span className="absolute left-[25px] top-[9px] h-[22px] w-[3px] rounded-full bg-[#8EE04E]" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <div className={`flex items-baseline gap-2 text-[17px] font-extrabold tracking-[-0.045em] ${dark ? "text-[#123B2A]" : "text-white"}`}>
            NEXORA
            <span className={`text-[8px] font-bold tracking-[0.16em] ${dark ? "text-[#5D7468]" : "text-[#9CC9AE]"}`}>ERP</span>
          </div>
          {showTagline && (
            <div className={`mt-0.5 text-[8px] font-semibold uppercase tracking-[0.2em] ${dark ? "text-[#71847A]" : "text-[#9CC0AD]"}`}>
              Business operating system
            </div>
          )}
        </div>
      )}
    </div>
  );
}
