"use client";

import React from "react";

export function HeaderTitleBadge() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("open-add-song"))}
      className="text-[11px] font-mono text-white/70 hover:text-amber-400 tracking-widest uppercase bg-black/40 hover:bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 hover:border-amber-400/40 shadow-sm transition-all cursor-pointer"
      title="Click to add a song or type 'ADD'"
    >
      KOSHUR MUSIC
    </button>
  );
}
