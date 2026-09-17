"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import AcidSquares from "@/components/effects/AcidSquares";

const MODULES = ["Sales", "Inventory", "Purchasing", "Finance"];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@nexora.local");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  async function handleSubmit(e) { e.preventDefault(); setError(null); setLoading(true); try { await login(email,password); router.push("/dashboard"); } catch (err) { setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again."); } finally { setLoading(false); } }
  return <div className="flex min-h-screen w-full bg-[#F6F9F6]" style={{fontFamily:"var(--font-family-primary)"}}>
    <section className="relative hidden min-h-screen w-[53%] overflow-hidden bg-[#0B2A1D] lg:block">
      <AcidSquares color1="#071C14" color2="#185F3D" color3="#B9EACB" detail="medium" speed={0.24} waveDepth={0.65} zoom={1.15} density={8.5} glow={0.82} exposure={2700} spread={0.3} brightness={0.82} opacity={0.78} mouseInteraction mouseStrength={0.07} mouseRadius={0.3} grain grainIntensity={0.018}/>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#062016]/40 via-transparent to-[#0A3B27]/55" />
      <div className="relative z-10 flex min-h-screen flex-col justify-between p-12 xl:p-16">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-sm font-bold text-white backdrop-blur-md">NX</div><div><div className="text-xl font-bold tracking-tight text-white">NEXORA</div><div className="text-[10px] uppercase tracking-[0.24em] text-[#A8C8B6]">Business workspace</div></div></div>
        <div className="max-w-xl"><p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-[#9DDBB5]">Operations, connected</p><h1 className="max-w-lg text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-white xl:text-6xl">Everything your business needs, in one place.</h1><p className="mt-6 max-w-md text-sm leading-6 text-[#C2D8CB]">Keep sales, stock, purchasing and finance moving together without adding another layer of complexity.</p><div className="mt-8 flex flex-wrap gap-2">{MODULES.map(m=><span key={m} className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-sm">{m}</span>)}</div></div>
        <div className="flex items-center gap-2 text-xs text-[#A8C8B6]"><ShieldCheck size={15}/><span>Secure workspace access</span></div>
      </div>
    </section>
    <section className="flex flex-1 items-center justify-center px-6 py-12 sm:px-12 lg:px-16"><div className="w-full max-w-[390px]">
      <div className="mb-9 lg:hidden"><div className="text-xl font-bold tracking-tight text-[#123B2A]">NEXORA</div><div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[#718278]">Business workspace</div></div>
      <div className="mb-8"><h2 className="text-[28px] font-semibold tracking-[-0.025em] text-[#142019]">Welcome back.</h2><p className="mt-2 text-sm text-[#6B7B72]">Sign in to continue to your workspace.</p></div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div><label htmlFor="login-email" className="mb-2 block text-xs font-medium text-[#405248]">Email</label><input id="login-email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@company.com" className="h-12 w-full rounded-lg border border-[#D6DFD9] bg-white px-4 text-sm text-[#142019] placeholder:text-[#9AA89F] outline-none transition focus:border-[#1F7A4D] focus:ring-2 focus:ring-[#1F7A4D]/10"/></div>
        <div><div className="mb-2 flex items-center justify-between"><label htmlFor="login-password" className="block text-xs font-medium text-[#405248]">Password</label><span className="text-xs text-[#8A978F]">Forgot password?</span></div><div className="relative"><input id="login-password" type={showPassword?"text":"password"} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="h-12 w-full rounded-lg border border-[#D6DFD9] bg-white px-4 pr-11 text-sm text-[#142019] placeholder:text-[#9AA89F] outline-none transition focus:border-[#1F7A4D] focus:ring-2 focus:ring-[#1F7A4D]/10"/><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#87968C]" aria-label={showPassword?"Hide password":"Show password"}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></div>
        {error&&<div className="rounded-lg border border-[#F1C5C5] bg-[#FFF7F7] px-4 py-3 text-xs font-medium text-[#BE4A4A]">{error}</div>}
        <button id="login-submit" type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#123B2A] text-sm font-semibold text-white shadow-sm transition hover:bg-[#184E37] active:scale-[0.99] disabled:opacity-60">{loading?"Signing in...":<>Continue <ArrowRight size={15}/></>}</button>
      </form><div className="mt-7 border-t border-[#E1E7E3] pt-5 text-[11px] leading-5 text-[#78877F]">Demo mode activates automatically when the workspace API is unavailable.</div>
    </div></section>
  </div>;
}
