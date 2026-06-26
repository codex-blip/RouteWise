"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const RouteGlobe = dynamic(() => import("./RouteGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-[480px] h-[480px] flex items-center justify-center text-white/30 font-mono text-xs uppercase tracking-[0.2em]">
      Loading globe…
    </div>
  ),
});

interface AuthLayoutProps {
  side?: "left" | "right";
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AuthLayout = ({ side = "right", title, subtitle, children, footer }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen w-full bg-[#050505] text-white flex flex-col lg:flex-row">
      {/* Visual side */}
      <div
        className={`relative lg:w-1/2 min-h-[300px] lg:min-h-screen tech-grid overflow-hidden border-white/10 ${
          side === "left" ? "lg:order-1 lg:border-r" : "lg:order-2 lg:border-l"
        }`}
      >
        <div className="grain" />
        <div className="absolute top-6 left-6 lg:top-10 lg:left-10 z-10">
          <Link href="/" data-testid="auth-back-home" className="flex items-center gap-3 group">
            <div className="w-8 h-8 border border-[#CCFF00] flex items-center justify-center">
              <div className="w-2 h-2 bg-[#CCFF00]" />
            </div>
            <span className="font-display font-black tracking-tighter uppercase">
              RouteWise
            </span>
          </Link>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <RouteGlobe size={480} />
        </div>

        <div className="absolute bottom-6 left-6 right-6 lg:bottom-10 lg:left-10 lg:right-10 flex items-end justify-between text-[10px] font-mono uppercase tracking-[0.25em] text-white/40">
          <span>RW · Auth Terminal</span>
          <span className="text-[#CCFF00]">/ Secure</span>
        </div>
      </div>

      {/* Form side */}
      <div className={`lg:w-1/2 flex items-center justify-center px-6 py-16 ${side === "left" ? "lg:order-2" : "lg:order-1"}`}>
        <div className="w-full max-w-md">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-[#CCFF00] mb-6">
            / Welcome back
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl uppercase tracking-tighter leading-[0.9]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-white/60">{subtitle}</p>
          )}
          <div className="mt-10">{children}</div>
          {footer && <div className="mt-8">{footer}</div>}
        </div>
      </div>
    </div>
  );
};
export default AuthLayout;
