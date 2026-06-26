"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, MapPin, Zap, ShieldCheck, Wallet, Clock, Car } from "lucide-react";
import Navbar from "../components/Navbar";

const RouteGlobe = dynamic(() => import("../components/RouteGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-[520px] h-[520px] flex items-center justify-center text-white/30 font-mono text-xs uppercase tracking-[0.2em]">
      Loading globe…
    </div>
  ),
});

const CITY_LIST: string[] = [
  "NEW YORK",
  "LONDON",
  "TOKYO",
  "BERLIN",
  "PARIS",
  "SAN FRANCISCO",
  "SINGAPORE",
  "DUBAI",
  "SYDNEY",
  "MUMBAI",
  "SÃO PAULO",
  "MEXICO CITY",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden tech-grid">
        <div className="grain" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 sm:pt-24 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">
            <div className="lg:col-span-7 relative z-10">
              <div className="flex items-center gap-3 mb-8 reveal">
                <div className="pulse-dot" />
                <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#CCFF00]">
                  Live in 60+ cities · v2.4
                </span>
              </div>
              <h1
                data-testid="hero-title"
                className="font-display font-black uppercase leading-[0.85] tracking-tighter text-[16vw] sm:text-[12vw] lg:text-[8.2rem] reveal reveal-delay-1"
              >
                Route<span className="text-[#CCFF00]">Wise.</span>
              </h1>
              <p className="mt-8 max-w-xl text-base sm:text-lg text-white/60 reveal reveal-delay-2">
                Premium mobility, engineered with precision. Tap once. We move
                cities — one route at a time. No surge games. No guesswork.
                Just the wisest route, every ride.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4 reveal reveal-delay-3">
                <Link href="/signup" data-testid="hero-cta-primary" className="btn-primary">
                  Book a Ride <ArrowRight size={18} strokeWidth={2.5} />
                </Link>
                <Link href="/signin" data-testid="hero-cta-secondary" className="btn-secondary">
                  I have an account
                </Link>
              </div>

              <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg reveal reveal-delay-4">
                <div>
                  <div className="font-display font-black text-3xl">2.4M</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mt-1">
                    Daily Rides
                  </div>
                </div>
                <div>
                  <div className="font-display font-black text-3xl">4.96</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mt-1">
                    Driver Rating
                  </div>
                </div>
                <div>
                  <div className="font-display font-black text-3xl">
                    62<span className="text-[#CCFF00]">s</span>
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mt-1">
                    Avg Pickup
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex items-center justify-center relative">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-[#CCFF00]/10 blur-3xl" />
              </div>
              <RouteGlobe size={520} />
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section
        data-testid="cities-marquee"
        id="cities"
        className="py-10 border-y border-white/10 bg-[#080808] overflow-hidden"
      >
        <div className="marquee">
          {[0, 1].map((k) => (
            <div className="marquee-track" key={k}>
              {CITY_LIST.map((c) => (
                <div
                  key={`${k}-${c}`}
                  className="flex items-center gap-20 font-display font-black text-3xl sm:text-5xl uppercase whitespace-nowrap"
                >
                  <span className="text-white/80">{c}</span>
                  <span className="text-[#CCFF00] font-mono text-base">/</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS - BENTO */}
      <section id="how" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-6">
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.25em] text-[#CCFF00] mb-4">
                / How it works
              </div>
              <h2 className="font-display font-black text-4xl sm:text-5xl uppercase tracking-tighter leading-[0.9] max-w-2xl">
                Three taps. <br /> One ride. <br />
                <span className="text-[#CCFF00]">Zero friction.</span>
              </h2>
            </div>
            <p className="max-w-md text-white/60">
              Built for the impatient, the precise, and the people who refuse
              to wait. Booking a ride should never take longer than the trip
              itself.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 tech-card">
              <MapPin size={28} strokeWidth={1.5} className="text-[#CCFF00] mb-6" />
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3">
                01 / Pin
              </div>
              <h3 className="font-display font-bold text-2xl mb-3">Drop a Pin</h3>
              <p className="text-white/60">
                Tap, talk or paste. Our routing engine resolves your destination
                in under 400ms — even from a half-typed address.
              </p>
            </div>
            <div className="md:col-span-7 tech-card">
              <Zap size={28} strokeWidth={1.5} className="text-[#CCFF00] mb-6" />
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3">
                02 / Match
              </div>
              <h3 className="font-display font-bold text-2xl mb-3">Instant Match</h3>
              <p className="text-white/60 max-w-2xl">
                A live mesh of 200,000+ drivers. We pick the wisest route, the
                closest car, and the calmest driver — every time. No surge
                surprises, no hidden fees, no second guessing.
              </p>
            </div>
            <div className="md:col-span-4 tech-card">
              <ShieldCheck size={28} strokeWidth={1.5} className="text-[#CCFF00] mb-6" />
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3">
                03 / Ride
              </div>
              <h3 className="font-display font-bold text-2xl mb-3">Ride Safe</h3>
              <p className="text-white/60">
                End-to-end trip encryption. Verified drivers. Live trip
                sharing.
              </p>
            </div>
            <div className="md:col-span-4 tech-card">
              <Wallet size={28} strokeWidth={1.5} className="text-[#CCFF00] mb-6" />
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3">
                04 / Pay
              </div>
              <h3 className="font-display font-bold text-2xl mb-3">Zero-tap Pay</h3>
              <p className="text-white/60">
                Apple Pay, Google Pay, Crypto, Cash. Charged the moment your
                door closes.
              </p>
            </div>
            <div className="md:col-span-4 tech-card">
              <Clock size={28} strokeWidth={1.5} className="text-[#CCFF00] mb-6" />
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3">
                05 / Repeat
              </div>
              <h3 className="font-display font-bold text-2xl mb-3">Scheduled</h3>
              <p className="text-white/60">
                Book the 7:42 AM ride. We will too. RouteWise learns the
                rhythm of your week.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DRIVER PROMO */}
      <section id="drive" className="border-y border-white/10 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 sm:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-[4/5] overflow-hidden border border-white/10">
              <img
                src="https://images.unsplash.com/photo-1672783521773-4ad176cfa461"
                alt="White car at night"
                className="w-full h-full object-cover grayscale contrast-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#CCFF00]">
                  RW-01 · Night Shift
                </div>
                <Car size={20} strokeWidth={1.5} className="text-white/60" />
              </div>
            </div>

            <div>
              <div className="font-mono text-xs uppercase tracking-[0.25em] text-[#CCFF00] mb-6">
                / For Drivers
              </div>
              <h2 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-tighter leading-[0.9]">
                Drive with <br />
                RouteWise.
                <br />
                <span className="text-[#CCFF00]">Keep 100% of tips.</span>
              </h2>
              <p className="mt-8 text-white/60 max-w-md">
                Lowest take-rate in the industry. Daily cashouts. Real human
                support — not bots. We back our drivers because cities run on
                them.
              </p>
              <ul className="mt-10 space-y-3 font-mono text-xs uppercase tracking-[0.2em] text-white/70">
                <li className="flex items-center gap-4">
                  <span className="text-[#CCFF00]">→</span> 12% platform fee — capped
                </li>
                <li className="flex items-center gap-4">
                  <span className="text-[#CCFF00]">→</span> Same-day payouts
                </li>
                <li className="flex items-center gap-4">
                  <span className="text-[#CCFF00]">→</span> Health & vehicle insurance
                </li>
                <li className="flex items-center gap-4">
                  <span className="text-[#CCFF00]">→</span> Driver-elected route prefs
                </li>
              </ul>
              <Link href="/signup" data-testid="driver-cta" className="btn-primary mt-12">
                Start Driving <ArrowRight size={18} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="py-24 sm:py-32 tech-grid relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#CCFF00]/5 blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-[#CCFF00] mb-6">
            / Get Started
          </div>
          <h2 className="font-display font-black text-5xl sm:text-7xl lg:text-8xl uppercase tracking-tighter leading-[0.9]">
            Your city, <br />
            <span className="text-[#CCFF00]">routed wiser.</span>
          </h2>
          <p className="mt-8 max-w-xl mx-auto text-white/60">
            Join 4.2 million riders moving smarter every day. Free to download.
            Free to forget your last ride app.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup" data-testid="footer-cta-signup" className="btn-primary">
              Create Account <ArrowRight size={18} strokeWidth={2.5} />
            </Link>
            <Link href="/signin" data-testid="footer-cta-signin" className="btn-secondary">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 border border-[#CCFF00] flex items-center justify-center">
              <div className="w-2 h-2 bg-[#CCFF00]" />
            </div>
            <span className="font-display font-black tracking-tighter uppercase">
              RouteWise
            </span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
            © 2026 RouteWise · Built for cities
          </div>
        </div>
      </footer>
    </div>
  );
}
