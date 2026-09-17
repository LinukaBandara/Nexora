"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/nexora-api";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Three soft blurred orbs drifting independently - pure CSS, no
          images, no JS animation loop. This is what makes the login
          screen feel "alive" instead of a static card on a flat
          background - see LoginPage's <style> block below for the
          keyframes, defined locally since they're only used here. */}
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />
      <div className="orb orb-3" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-sm animate-panel-in rounded-card border border-white/20 bg-surface p-8 shadow-panel-glow">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-control bg-primary text-card-title font-bold text-white shadow-glow-sm">
            N
          </div>
          <div className="text-section-title font-semibold text-text-primary">NEXORA</div>
          <div className="mt-1 text-secondary text-text-muted">One Business. One System. Total Control.</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-secondary font-medium text-text-secondary">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-input border border-border px-3 py-2 text-body transition-shadow duration-base focus:border-primary focus:outline-none focus:shadow-glow-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-secondary font-medium text-text-secondary">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-input border border-border px-3 py-2 text-body transition-shadow duration-base focus:border-primary focus:outline-none focus:shadow-glow-sm"
            />
          </div>

          {error && (
            <div className="rounded-input bg-danger-bg px-3 py-2 text-secondary text-danger">{error}</div>
          )}

          <Button type="submit" disabled={loading} className="mt-2 w-full justify-center">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>

      <style jsx>{`
        .orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(60px);
          opacity: 0.55;
          pointer-events: none;
        }
        .orb-1 {
          width: 420px;
          height: 420px;
          background: var(--color-primary);
          top: -120px;
          left: -100px;
          animation: orb-float-1 14s ease-in-out infinite;
        }
        .orb-2 {
          width: 360px;
          height: 360px;
          background: var(--color-page-gradient-start);
          bottom: -140px;
          right: -80px;
          animation: orb-float-2 18s ease-in-out infinite;
        }
        .orb-3 {
          width: 260px;
          height: 260px;
          background: var(--color-primary-hover);
          bottom: 10%;
          left: 8%;
          animation: orb-float-3 22s ease-in-out infinite;
        }
        @keyframes orb-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, 30px) scale(1.08); }
        }
        @keyframes orb-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, -40px) scale(1.05); }
        }
        @keyframes orb-float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -25px) scale(1.1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .orb { animation: none; }
        }
      `}</style>
    </div>
  );
}
