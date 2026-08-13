"use client";

import React from "react";
import { Sparkles, Plus } from "lucide-react";

export function HeaderTitleBadge() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("open-add-song"))}
      className="text-[11px] font-mono text-white/70 hover:text-amber-400 tracking-widest uppercase bg-black/40 hover:bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 hover:border-amber-400/40 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 group"
      title="Click to add a song or type 'ADD'"
    >
      <Sparkles size={12} className="text-amber-400/80 group-hover:text-amber-400 transition-colors" />
      <span>KOSHUR MUSIC</span>
      <Plus size={11} className="text-white/40 group-hover:text-amber-400 transition-colors" />
    </button>
  );
}
