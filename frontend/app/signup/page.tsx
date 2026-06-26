"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import AuthLayout from "../../components/AuthLayout";
import { useSignUp } from "@clerk/nextjs/legacy";

export default function SignUpPage() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  
  const [pendingVerification, setPendingVerification] = useState<boolean>(false);
  const [code, setCode] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);

    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName: name.split(" ")[0] || name,
        lastName: name.split(" ").slice(1).join(" ") || "",
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError("");
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.push("/main");
      } else {
        setError(`Verification status: ${completeSignUp.status}`);
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <AuthLayout
        side="right"
        title={<>Verify<br /><span className="text-[#CCFF00]">your email.</span></>}
        subtitle={`We sent a verification code to ${email}.`}
      >
        <form onSubmit={onVerify} className="space-y-6" data-testid="verification-form">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
              Verification Code
            </label>
            <input
              data-testid="verification-code-input"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="swiss-input"
            />
          </div>

          {error && (
            <div className="font-mono text-xs uppercase tracking-[0.15em] text-red-400 border border-red-400/30 px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Verifying…</>
            ) : (
              <><span className="mr-2">Verify Code</span> <ArrowRight size={18} strokeWidth={2.5} /></>
            )}
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      side="right"
      title={<>Create<br /><span className="text-[#CCFF00]">your route.</span></>}
      subtitle="Join 4.2M riders. No surge games. No second-guessing."
      footer={
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-white/50">
          Already have an account?{" "}
          <Link href="/signin" data-testid="link-to-signin" className="text-[#CCFF00] hover:underline">
            Sign in →
          </Link>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6" data-testid="signup-form">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
            Name
          </label>
          <input
            data-testid="signup-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Doe"
            className="swiss-input"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
            Email
          </label>
          <input
            data-testid="signup-email-input"
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
            data-testid="signup-password-input"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="swiss-input"
            autoComplete="new-password"
          />
        </div>

        {error && (
          <div
            data-testid="signup-error"
            className="font-mono text-xs uppercase tracking-[0.15em] text-red-400 border border-red-400/30 px-4 py-3"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          data-testid="signup-submit-btn"
          disabled={loading}
          className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Creating account…
            </>
          ) : (
            <>
              Create Account <ArrowRight size={18} strokeWidth={2.5} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
