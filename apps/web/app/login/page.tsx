"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { ArrowUpRight, Eye, EyeOff, LockKeyhole, Sparkles } from "lucide-react";

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
    <main className="min-h-screen bg-[#F3F5F2] text-[#142019]" style={{ fontFamily: "var(--font-family-primary)" }}>
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        {/* Brand side */}
        <section className="relative hidden overflow-hidden bg-white lg:flex lg:flex-col lg:justify-between lg:p-14 xl:p-20">
          <div className="pointer-events-none absolute right-[-140px] top-[-160px] h-[520px] w-[520px] rounded-full border border-[#123B2A]/[0.06]" />
          <div className="pointer-events-none absolute right-[-40px] top-[-60px] h-[330px] w-[330px] rounded-full border border-[#123B2A]/[0.05]" />
          <div className="pointer-events-none absolute bottom-[-220px] left-[-120px] h-[500px] w-[500px] rounded-full bg-[#EAF1EC]" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123B2A] text-white">
              <Sparkles size={18} />
            </div>
            <span className="text-[19px] font-bold tracking-[-0.03em]">NEXORA</span>
          </div>

          <div className="relative z-10 max-w-[620px] pb-6">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#6A7B70]">
              Workspace access
            </p>
            <h1 className="max-w-[590px] text-[clamp(46px,5.2vw,78px)] font-semibold leading-[0.96] tracking-[-0.065em] text-[#142019]">
              Everything your business needs, in one place.
            </h1>
            <p className="mt-7 max-w-[500px] text-[15px] leading-7 text-[#66776E]">
              Manage sales, inventory, purchasing and finance from a single workspace built around your day-to-day operations.
            </p>

            <div className="mt-10 flex flex-wrap gap-2">
              {[
                "Sales",
                "Inventory",
                "Purchasing",
                "Finance",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#DCE4DE] bg-[#F8FAF8] px-3.5 py-2 text-xs font-medium text-[#4E6155]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-[#E7ECE8] pt-5 text-[11px] text-[#7B8A81]">
            <span>Secure workspace</span>
            <span>© {new Date().getFullYear()} NEXORA</span>
          </div>
        </section>

        {/* Login side */}
        <section className="flex min-h-screen items-center justify-center bg-[#123B2A] px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-[430px]">
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#123B2A]">
                <Sparkles size={18} />
              </div>
              <span className="text-xl font-bold tracking-[-0.03em] text-white">NEXORA</span>
            </div>

            <div className="rounded-[26px] bg-white p-7 shadow-[0_30px_80px_rgba(0,0,0,0.18)] sm:p-9">
              <div className="mb-8">
                <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#EDF4EF] text-[#123B2A]">
                  <LockKeyhole size={16} />
                </div>
                <h2 className="text-[28px] font-semibold tracking-[-0.04em] text-[#142019]">Welcome back</h2>
                <p className="mt-1.5 text-sm leading-6 text-[#718077]">Sign in to continue to your workspace.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-xs font-medium text-[#4E6155]">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="h-12 w-full rounded-xl border border-[#D8E0DA] bg-[#FAFCFA] px-4 text-sm text-[#142019] outline-none transition placeholder:text-[#9AA79F] focus:border-[#1F7A4D] focus:bg-white focus:ring-4 focus:ring-[#1F7A4D]/10"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="login-password" className="text-xs font-medium text-[#4E6155]">
                      Password
                    </label>
                    <span className="text-[11px] text-[#98A49D]">Contact your administrator</span>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 w-full rounded-xl border border-[#D8E0DA] bg-[#FAFCFA] px-4 pr-11 text-sm text-[#142019] outline-none transition placeholder:text-[#9AA79F] focus:border-[#1F7A4D] focus:bg-white focus:ring-4 focus:ring-[#1F7A4D]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#84928A] transition hover:bg-[#EDF4EF] hover:text-[#123B2A]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-[#F1CACA] bg-[#FFF7F7] px-4 py-3 text-xs font-medium text-[#C84A4A]">
                    {error}
                  </div>
                )}

                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading}
                  className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#123B2A] text-sm font-semibold text-white transition hover:bg-[#184E37] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
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
                    <>
                      Continue to NEXORA
                      <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-7 border-t border-[#E7ECE8] pt-5">
                <div className="flex items-start gap-2.5">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#72B83D]" />
                  <div>
                    <p className="text-xs font-semibold text-[#35473D]">Demo environment available</p>
                    <p className="mt-1 text-[11px] leading-5 text-[#7B8981]">
                      If the backend is unavailable, NEXORA can open its offline demo workspace with sample ERP data.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-5 text-center text-[11px] text-white/50 lg:hidden">Secure workspace</p>
          </div>
        </section>
      </div>
    </main>
  );
}
