"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import AcidSquares from "@/components/effects/AcidSquares";
import { NexoraLogo } from "@/components/brand/NexoraLogo";

const MODULES = ["Sales", "Inventory", "Purchasing", "Finance"];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@nexora.local");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(null); setLoading(true);
    try { await login(email, password); router.push("/dashboard"); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#071C14]" style={{ fontFamily: "var(--font-family-primary)" }}>
      <div className="pointer-events-none fixed inset-0 z-0 h-[100svh] w-screen overflow-hidden">
        <AcidSquares color1="#071C14" color2="#185F3D" color3="#B9EACB" speed={0.16} density={8.5} glow={0.32} brightness={0.5} opacity={0.2} mouseInteraction />
        <div className="absolute inset-0 bg-[#071C14]/45" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(33,122,77,0.2),transparent_45%)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#061B13]/70 via-transparent to-[#0A3B27]/75" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#071C14] to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-[100svh] items-center justify-center px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <div className="w-full max-w-[470px]">
          <div className="mb-5 text-center sm:mb-6">
            <div className="mx-auto inline-flex rounded-[17px] p-1 ring-1 ring-white/10">
              <NexoraLogo showTagline />
            </div>
          </div>

          <section className="rounded-[24px] border border-white/70 bg-white/[0.97] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.32)] backdrop-blur-2xl sm:p-9">
            <div className="mb-7">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1F7A4D]"><span className="h-1.5 w-1.5 rounded-full bg-[#8EE04E]" /> Workspace access</div>
              <h1 className="text-[28px] font-semibold tracking-[-0.035em] text-[#142019] sm:text-[30px]">Welcome back.</h1>
              <p className="mt-2 text-sm leading-6 text-[#6B7B72]">Sign in to manage your business workspace.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div><label htmlFor="login-email" className="mb-2 block text-xs font-medium text-[#405248]">Work email</label><input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className="h-12 w-full rounded-xl border border-[#D6DFD9] bg-[#FAFCFB] px-4 text-sm text-[#142019] placeholder:text-[#9AA89F] outline-none transition focus:border-[#1F7A4D] focus:bg-white focus:ring-4 focus:ring-[#1F7A4D]/10" /></div>
              <div><div className="mb-2 flex items-center justify-between"><label htmlFor="login-password" className="block text-xs font-medium text-[#405248]">Password</label><span className="text-xs text-[#8A978F]">Forgot password?</span></div><div className="relative"><input id="login-password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-12 w-full rounded-xl border border-[#D6DFD9] bg-[#FAFCFB] px-4 pr-11 text-sm text-[#142019] placeholder:text-[#9AA89F] outline-none transition focus:border-[#1F7A4D] focus:bg-white focus:ring-4 focus:ring-[#1F7A4D]/10" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#87968C]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
              {error && <div className="rounded-xl border border-[#F1C5C5] bg-[#FFF7F7] px-4 py-3 text-xs font-medium text-[#BE4A4A]">{error}</div>}
              <button id="login-submit" type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#123B2A] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(18,59,42,0.18)] transition hover:bg-[#184E37] active:scale-[0.99] disabled:opacity-60">{loading ? "Signing in..." : <>Continue to workspace <ArrowRight size={15} /></>}</button>
            </form>

            <div className="mt-7 flex items-start gap-3 border-t border-[#E5EBE7] pt-5"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#1F7A4D]" /><p className="text-[11px] leading-5 text-[#78877F]">Your workspace session is protected. Demo mode activates automatically when the workspace API is unavailable.</p></div>
          </section>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] font-medium uppercase tracking-[0.12em] text-white/55">{MODULES.map((module) => <span key={module}>{module}</span>)}</div>
          <div className="mt-4 text-center text-[9px] font-medium uppercase tracking-[0.18em] text-white/35">
            Designed &amp; Developed by <a href="https://ark-ii.studio" target="_blank" rel="noreferrer" className="text-white/60 underline-offset-4 transition hover:text-white hover:underline">ARK II</a>
          </div>
        </div>
      </div>
    </main>
  );
}
