"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { Home, Play } from "lucide-react";
import { playButtonClickSound } from "@/lib/sound";

/* ============================================================
   "The Scratched Record" — a 404 turntable scene.
   The needle keeps dropping into a groove that isn't there.
   Click the record to scratch it. It will never play.
   ============================================================ */

function playScratchSound() {
  try {
    const Ctx =
      window.AudioContext ||
      (
        window as unknown as {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    // Harsh static burst — the sound of a needle in a dead groove
    const frames = Math.floor(ctx.sampleRate * 0.18);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 2500;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(now);
  } catch {
    // ignore
  }
}

export default function NotFound() {
  const discRef = useRef<HTMLDivElement | null>(null);

  const scratchIt = () => {
    playScratchSound();
    const el = discRef.current;
    if (!el) return;
    el.classList.remove("nf-scratching");
    // Re-trigger the violent skip animation
    void el.offsetWidth;
    el.classList.add("nf-scratching");
    setTimeout(() => el.classList.remove("nf-scratching"), 600);
  };

  return (
    <div className="h-screen h-[100vh] h-[100dvh] w-full py-4 px-4 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Warm vignette behind the scene for readability */}
      <div className="absolute inset-0 bg-black/35 pointer-events-none" />
      <div className="absolute top-1/4 -translate-y-1/2 w-[70vw] max-w-3xl h-[50vh] bg-black/40 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-xl w-full">
        {/* Mono eyebrow */}
        <p className="text-[10px] sm:text-xs font-mono text-amber-400/90 tracking-[0.35em] uppercase mb-4 sm:mb-6">
          404 · track not found
        </p>

        {/* ===== Broken Record Scene (No background case or platter rim) ===== */}
        <div className="relative w-[220px] h-[220px] xs:w-[240px] xs:h-[240px] sm:w-[280px] sm:h-[280px] mb-6 sm:mb-8 flex items-center justify-center">
          {/* Single Clean Tonearm Assembly */}
          <div className="absolute -top-3 -right-3 z-30 pointer-events-none nf-needle-bob">
            <div className="relative w-[125px] sm:w-[150px] h-[75px] flex items-start justify-end">
              {/* Tonearm Base Counterweight & Pivot Mount */}
              <div className="absolute top-0 right-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-zinc-300 via-zinc-500 to-zinc-800 border border-white/40 shadow-lg flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-400 shadow-inner" />
              </div>

              {/* Curved / Angled Metallic Tonearm Tube */}
              <div className="absolute top-3 right-3 origin-top-right rotate-[-26deg] sm:rotate-[-24deg] flex items-center">
                {/* Arm Bar */}
                <div className="w-[90px] sm:w-[110px] h-[3px] rounded-full bg-gradient-to-r from-zinc-400 via-white to-zinc-300 shadow-md" />
                {/* Cartridge Headshell & Stylus Needle */}
                <div className="relative flex items-center">
                  <div className="w-3 sm:w-3.5 h-2 bg-zinc-800 rounded-xs border border-zinc-600 shadow-md flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-amber-400/80" />
                  </div>
                  {/* Stylus Needle Drop Point */}
                  <div className="absolute top-1.5 left-1 w-1 h-2.5 rounded-b-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,1)]" />
                </div>
              </div>
            </div>
          </div>

          {/* The Broken Record Container (No background platter case) */}
          <div
            ref={discRef}
            onClick={scratchIt}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                scratchIt();
              }
            }}
            title="click to scratch the broken record"
            aria-label="A broken record physically split into two separated pieces."
            className="nf-record w-full h-full cursor-pointer select-none will-change-transform relative z-10"
          >
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full drop-shadow-2xl overflow-visible"
              >
                <defs>
                  {/* Left Half Clip Path */}
                  <clipPath id="leftHalfClip">
                    <path d="M0,0 L97,0 L90,36 L104,64 L88,96 L106,132 L86,168 L97,200 L0,200 Z" />
                  </clipPath>

                  {/* Right Half Clip Path */}
                  <clipPath id="rightHalfClip">
                    <path d="M200,0 L103,0 L96,36 L110,64 L94,96 L112,132 L92,168 L103,200 L200,200 Z" />
                  </clipPath>

                  {/* Vinyl Radial Texture */}
                  <radialGradient id="vinylBodyGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#14141d" />
                    <stop offset="35%" stopColor="#1a1a26" />
                    <stop offset="75%" stopColor="#0f0f17" />
                    <stop offset="100%" stopColor="#1e1e2d" />
                  </radialGradient>

                  <radialGradient id="labelGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#1a1a2b" />
                    <stop offset="100%" stopColor="#10101b" />
                  </radialGradient>
                </defs>

                {/* Platter Center Spindle Mechanism (visible through the gap between halves) */}
                <circle cx="100" cy="100" r="14" fill="#181824" stroke="#3f3f56" strokeWidth="1.5" />
                <circle cx="100" cy="100" r="5" fill="#f59e0b" />

                {/* LEFT BROKEN HALF (Shifted Left & Rotated) */}
                <g transform="translate(-4, -1.5) rotate(-2 100 100)" clipPath="url(#leftHalfClip)">
                  {/* Vinyl Disc Outer Body */}
                  <circle cx="100" cy="100" r="92" fill="url(#vinylBodyGrad)" stroke="#3f3f56" strokeWidth="1.5" />
                  
                  {/* Groove Circles */}
                  <circle cx="100" cy="100" r="82" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1" strokeDasharray="4 2" />
                  <circle cx="100" cy="100" r="68" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />
                  <circle cx="100" cy="100" r="54" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1" strokeDasharray="6 3" />
                  <circle cx="100" cy="100" r="40" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />
                  
                  {/* Center Label Hub */}
                  <circle cx="100" cy="100" r="32" fill="url(#labelGrad)" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1" />
                  <text x="100" y="88" textAnchor="middle" fill="#ffffff" fillOpacity="0.55" fontSize="7.5" fontFamily="monospace" letterSpacing="2.5">KOSHUR</text>
                  <text x="100" y="102" textAnchor="middle" fill="#f59e0b" fontSize="6.5" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">SIDE B — BROKEN</text>
                  <text x="100" y="115" textAnchor="middle" fill="#ffffff" fillOpacity="0.55" fontSize="7.5" fontFamily="monospace" letterSpacing="2.5">MUSIC</text>
                  
                  {/* Center Spindle Hole */}
                  <circle cx="100" cy="100" r="6.5" fill="#f59e0b" stroke="#fef08a" strokeWidth="0.8" strokeOpacity="0.6" />
                  
                  {/* Fracture Glow Outline */}
                  <path d="M97,0 L90,36 L104,64 L88,96 L106,132 L86,168 L97,200" stroke="#f59e0b" strokeWidth="2.2" strokeOpacity="0.9" fill="none" />
                </g>

                {/* RIGHT BROKEN HALF (Shifted Right & Rotated) */}
                <g transform="translate(4, 1.5) rotate(2 100 100)" clipPath="url(#rightHalfClip)">
                  {/* Vinyl Disc Outer Body */}
                  <circle cx="100" cy="100" r="92" fill="url(#vinylBodyGrad)" stroke="#3f3f56" strokeWidth="1.5" />
                  
                  {/* Groove Circles */}
                  <circle cx="100" cy="100" r="82" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1" strokeDasharray="4 2" />
                  <circle cx="100" cy="100" r="68" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />
                  <circle cx="100" cy="100" r="54" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1" strokeDasharray="6 3" />
                  <circle cx="100" cy="100" r="40" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />
                  
                  {/* Center Label Hub */}
                  <circle cx="100" cy="100" r="32" fill="url(#labelGrad)" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1" />
                  <text x="100" y="88" textAnchor="middle" fill="#ffffff" fillOpacity="0.55" fontSize="7.5" fontFamily="monospace" letterSpacing="2.5">KOSHUR</text>
                  <text x="100" y="102" textAnchor="middle" fill="#f59e0b" fontSize="6.5" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">SIDE B — BROKEN</text>
                  <text x="100" y="115" textAnchor="middle" fill="#ffffff" fillOpacity="0.55" fontSize="7.5" fontFamily="monospace" letterSpacing="2.5">MUSIC</text>
                  
                  {/* Center Spindle Hole */}
                  <circle cx="100" cy="100" r="6.5" fill="#f59e0b" stroke="#fef08a" strokeWidth="0.8" strokeOpacity="0.6" />
                  
                  {/* Fracture Glow Outline */}
                  <path d="M103,0 L96,36 L110,64 L94,96 L112,132 L92,168 L103,200" stroke="#f59e0b" strokeWidth="2.2" strokeOpacity="0.9" fill="none" />
                </g>

                {/* Branching Stress Fractures */}
                <path d="M90,36 L74,44 M110,64 L126,72 M88,96 L70,104 M112,132 L128,138" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1" fill="none" />
              </svg>
            </div>
          </div>

        {/* ===== Copy ===== */}
        <h1 className="font-fraunces italic font-medium text-4xl xs:text-5xl sm:text-6xl leading-[1.05] tracking-tight text-white" style={{ textShadow: "0 2px 14px rgba(0,0,0,0.8), 0 4px 40px rgba(0,0,0,0.55)" }}>
          This groove
          <br />
          doesn&apos;t exist.
        </h1>
        <p className="mt-5 text-xs sm:text-base font-outfit font-light text-white/85 max-w-sm mx-auto leading-relaxed" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}>
          The needle searched every track on the rack — whatever you were
          after never made it onto this record.
        </p>

        {/* ===== Action ===== */}
        <Link
          href="/"
          onClick={playButtonClickSound}
          className="mt-8 sm:mt-10 group inline-flex items-center gap-3 rounded-full bg-amber-400 text-black font-headline font-bold text-sm sm:text-base px-6 sm:px-7 py-3 hover:bg-amber-300 hover:scale-[1.03] active:scale-95 transition-all shadow-[0_0_28px_rgba(245,158,11,0.5)]"
        >
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black/15">
            <Home size={13} strokeWidth={2} className="group-hover:-translate-y-[1px] transition-transform" />
          </span>
          Back to the music
        </Link>

        {/* ===== Mono footer detail ===== */}
        <p className="mt-8 sm:mt-10 text-[9px] sm:text-[10px] font-mono text-white/40 tracking-[0.2em] uppercase">
          played 0 times · scratched beyond repair · still love it
        </p>
      </div>

      <style jsx global>{`
        /* ---- Record spin with an endless skip ---- */
        @keyframes nf-record-spin {
          0%   { transform: rotate(0deg); }
          74%  { transform: rotate(266deg); }
          77%  { transform: rotate(273deg); }
          79%  { transform: rotate(264deg); }
          81%  { transform: rotate(273deg); }
          100% { transform: rotate(360deg); }
        }
        .nf-record {
          animation: nf-record-spin 4.2s linear infinite;
          animation-timing-function: linear;
        }
        .nf-record:hover .nf-grooves {
          opacity: 0.85;
        }

        @keyframes nf-record-scratch {
          0%   { transform: rotate(var(--nf-start, 0deg)); }
          20%  { transform: rotate(calc(var(--nf-start, 0deg) + 9deg)); }
          45%  { transform: rotate(calc(var(--nf-start, 0deg) - 7deg)); }
          100% { transform: rotate(calc(var(--nf-start, 0deg) + 360deg)); }
        }
        .nf-scratching {
          animation: nf-record-spin 0.55s cubic-bezier(0.34, 1.2, 0.64, 1) !important;
        }

        /* ---- Grooves (repeating radial) ---- */
        .nf-grooves {
          background: repeating-radial-gradient(
            circle at center,
            rgba(90, 92, 110, 0.55) 0px,
            rgba(90, 92, 110, 0.55) 1px,
            rgba(22, 22, 32, 0.9) 2px,
            rgba(22, 22, 32, 0.9) 4px
          );
          opacity: 0.7;
          transition: opacity 0.2s ease;
        }
        .nf-grooves::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(
            from 45deg,
            rgba(255,255,255,0) 0deg,
            rgba(255,255,255,0.14) 40deg,
            rgba(255,255,255,0) 90deg,
            rgba(255,255,255,0.1) 140deg,
            rgba(255,255,255,0) 190deg,
            rgba(255,255,255,0.12) 250deg,
            rgba(255,255,255,0) 310deg,
            rgba(255,255,255,0) 360deg
          );
          mix-blend-mode: screen;
          pointer-events: none;
        }

        /* ---- Needle bobs in the dead groove ---- */
        @keyframes nf-needle-bob {
          0%, 100% { transform: rotate(0deg); }
          76%      { transform: rotate(1.6deg); }
          79%      { transform: rotate(-1.2deg); }
          82%      { transform: rotate(0.8deg); }
          84%      { transform: rotate(0deg); }
        }
        .nf-needle-bob {
          animation: nf-needle-bob 4.2s ease-in-out infinite;
        }

        /* ---- Respect reduced motion: freeze the scene ---- */
        @media (prefers-reduced-motion: reduce) {
          .nf-record,
          .nf-needle-bob {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}