"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header
      data-testid="navbar"
      className="sticky top-0 z-50 backdrop-blur-2xl bg-[#050505]/60 border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" data-testid="nav-logo" className="flex items-center gap-3 group">
          <div className="w-8 h-8 border border-[#CCFF00] flex items-center justify-center">
            <div className="w-2 h-2 bg-[#CCFF00]" />
          </div>
          <span className="font-display font-black tracking-tighter text-lg uppercase">
            RouteWise
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-10 font-mono text-xs uppercase tracking-[0.2em] text-white/70">
          <a href="#how" data-testid="nav-how" className="hover:text-[#CCFF00] transition-colors">
            How
          </a>
          <a href="#drive" data-testid="nav-drive" className="hover:text-[#CCFF00] transition-colors">
            Drive
          </a>
          <a href="#cities" data-testid="nav-cities" className="hover:text-[#CCFF00] transition-colors">
            Cities
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/main"
                data-testid="nav-dashboard"
                className="font-mono text-xs uppercase tracking-[0.2em] text-white/70 hover:text-white px-3"
              >
                Launch App
              </Link>
              <button
                onClick={handleLogout}
                data-testid="nav-logout-btn"
                className="btn-secondary !py-2 !px-4 text-xs"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                data-testid="nav-signin-btn"
                className="font-mono text-xs uppercase tracking-[0.2em] text-white/70 hover:text-white px-3"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                data-testid="nav-signup-btn"
                className="btn-primary !py-2 !px-4 text-xs"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;
