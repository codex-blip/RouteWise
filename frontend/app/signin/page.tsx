"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import AuthLayout from "../../components/AuthLayout";
import { useSignIn } from "@clerk/nextjs/legacy";

export default function SignInPage() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError("");
    setLoading(true);

    try {
      const res = await signIn.create({
        identifier: email,
        password,
      });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        router.push("/main");
      } else {
        setError(`Sign in status: ${res.status}`);
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      side="left"
      title={<>Sign in.<br /><span className="text-[#CCFF00]">Move smarter.</span></>}
      subtitle="Welcome back to RouteWise. Pick up where you left off."
      footer={
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-white/50">
          New here?{" "}
          <Link href="/signup" data-testid="link-to-signup" className="text-[#CCFF00] hover:underline">
            Create account →
          </Link>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6" data-testid="signin-form">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
            Email
          </label>
          <input
            data-testid="signin-email-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@routewise.com"
            className="swiss-input"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
            Password
          </label>
          <input
            data-testid="signin-password-input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="swiss-input"
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div
            data-testid="signin-error"
            className="font-mono text-xs uppercase tracking-[0.15em] text-red-400 border border-red-400/30 px-4 py-3"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          data-testid="signin-submit-btn"
          disabled={loading}
          className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Signing in…
            </>
          ) : (
            <>
              Sign In <ArrowRight size={18} strokeWidth={2.5} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
