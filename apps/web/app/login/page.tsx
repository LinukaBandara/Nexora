"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ArrowRight, CheckCircle2, Lock, ShieldCheck, Sparkles, Eye, EyeOff } from "lucide-react";

const FEATURES = [
  "Real-time inventory levels and low-stock intelligence",
  "Permission-governed sales & purchase order approvals",
  "Comprehensive financial cash flow & receivables tracking",
  "Cloud-edge synchronization with conflict resolution",
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@nexora.local");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full" style={{ fontFamily: "var(--font-family-primary)" }}>
      {/* ── Left branding panel ── */}
      <div
        className="relative hidden w-[46%] flex-col justify-between overflow-hidden p-12 text-white lg:flex xl:p-16"
        style={{ background: "linear-gradient(150deg, #0E2E1E 0%, #123B2A 50%, #16492F 100%)" }}
      >
        {/* Decorative rings */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-[500px] w-[500px] rounded-full border border-white/[0.06]" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-[360px] w-[360px] rounded-full border border-white/[0.04]" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-[400px] w-[400px] rounded-full border border-white/[0.05]" />
        {/* Lime glow accent */}
        <div
          className="pointer-events-none absolute right-0 top-1/3 h-64 w-64 rounded-full opacity-10 blur-3xl"
          style={{ background: "#8EE04E" }}
        />

        {/* Brand logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-md">
            <Sparkles size={22} className="text-[#123B2A]" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
              NEXORA
              <span className="rounded-full bg-[#8EE04E]/20 px-2 py-0.5 text-[10px] font-semibold text-[#8EE04E]">
                ENTERPRISE
              </span>
            </div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[#8CB79F]">Business Operating System</div>
          </div>
        </div>

        {/* Value statement */}
        <div className="relative z-10 max-w-md space-y-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#8EE04E]/20 bg-[#8EE04E]/10 px-3 py-1 text-xs font-semibold text-[#8EE04E]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8EE04E]" />
              Unified ERP Platform
            </div>
            <h2 className="text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-[40px]">
              One Business.<br />One System.<br />
              <span className="text-[#8EE04E]">Total Control.</span>
            </h2>
          </div>

          <div className="space-y-2.5">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-xs text-[#D0E6DA] backdrop-blur-sm"
              >
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#8EE04E]" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-[12px] text-[#8CB79F]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-[#8EE04E]" />
            <span>Role-Based Access Control Active</span>
          </div>
          <span>v1.0 Commercial</span>
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#F6F9F6] px-6 py-12 sm:px-12 lg:px-14">
        <div className="w-full max-w-[420px] space-y-8">

          {/* Mobile logo */}
          <div className="flex flex-col items-center text-center lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#123B2A] shadow-md">
              <Sparkles size={22} className="text-[#8EE04E]" />
            </div>
            <h1 className="mt-3 text-xl font-bold tracking-tight text-[#142019]">NEXORA ERP</h1>
            <p className="mt-1 text-xs text-[#63756A]">One Business. One System. Total Control.</p>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-[26px] font-bold tracking-tight text-[#142019]">Sign in</h2>
            <p className="mt-1.5 text-sm text-[#66776E]">
              Enter your credentials to access your workspace.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#4E6155]"
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="h-11 w-full rounded-xl border border-[#D7DFDA] bg-white px-4 text-sm text-[#142019] placeholder:text-[#91A297] transition-all focus:border-[#1F7A4D] focus:outline-none focus:ring-2 focus:ring-[#1F7A4D]/15"
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-[#4E6155]"
                >
                  Password
                </label>
                <span className="cursor-not-allowed text-xs text-[#7A8E82]">Forgot password?</span>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-[#D7DFDA] bg-white px-4 pr-10 text-sm text-[#142019] placeholder:text-[#91A297] transition-all focus:border-[#1F7A4D] focus:outline-none focus:ring-2 focus:ring-[#1F7A4D]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#889B8E] hover:text-[#4E6155] transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-[#F5C2C2] bg-[#FDF5F5] px-4 py-3 text-xs font-medium text-[#C84A4A]">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#123B2A] text-sm font-semibold text-white shadow-sm transition hover:bg-[#184E37] active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <>Access Workspace <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Demo notice */}
          <div className="rounded-xl border border-[#E1E8E3] bg-white px-4 py-3.5 text-xs text-[#5D6F63] shadow-sm">
            <div className="flex items-center gap-1.5 font-semibold text-[#142019]">
              <span className="h-2 w-2 rounded-full bg-[#8EE04E]" />
              Offline & Demo Mode Ready
            </div>
            <div className="mt-1 text-[11px] text-[#718377] leading-relaxed">
              When the backend is unreachable, NEXORA automatically activates the offline demo environment with sample data.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
