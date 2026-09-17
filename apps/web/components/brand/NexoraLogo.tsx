import React from "react";

type NexoraLogoProps = {
  compact?: boolean;
  dark?: boolean;
  showTagline?: boolean;
  className?: string;
};

export function NexoraLogo({ compact = false, dark = false, showTagline = false, className = "" }: NexoraLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        aria-hidden="true"
        className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-[12px] border ${
          dark
            ? "border-[#D7E8DE] bg-[#123B2A] shadow-[0_8px_24px_rgba(18,59,42,0.16)]"
            : "border-white/20 bg-white/10 shadow-[0_10px_28px_rgba(0,0,0,0.16)] backdrop-blur-xl"
        } ${compact ? "h-9 w-9 rounded-[10px]" : "h-11 w-11"}`}
      >
        <span className={`absolute h-[2px] w-6 rotate-[35deg] rounded-full ${dark ? "bg-[#8EE04E]" : "bg-[#8EE04E]"}`} />
        <span className={`absolute h-[2px] w-6 -rotate-[35deg] rounded-full ${dark ? "bg-[#B9EACB]" : "bg-[#B9EACB]"}`} />
        <span className={`relative z-10 text-[11px] font-black tracking-[-0.08em] ${dark ? "text-white" : "text-white"}`}>NX</span>
      </div>
      {!compact && (
        <div className="min-w-0">
          <div className={`flex items-center gap-1.5 text-[16px] font-extrabold tracking-[-0.03em] ${dark ? "text-[#123B2A]" : "text-white"}`}>
            NEXORA
            <span className="rounded-full bg-[#8EE04E] px-1.5 py-0.5 text-[8px] font-black tracking-[0.08em] text-[#0F2A1E]">ERP</span>
          </div>
          {showTagline && (
            <div className={`mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] ${dark ? "text-[#6D8175]" : "text-[#A8C8B6]"}`}>
              Business operating system
            </div>
          )}
        </div>
      )}
    </div>
  );
}
