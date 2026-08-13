"use client";

import React from "react";
import type { Song } from "@/data/songs";
import { DiscVisual } from "./DiscVisual";

interface SongDiscProps {
  song: Song;
  isActive: boolean;
  onPointerDown: (e: React.PointerEvent, song: Song) => void;
  onClick: (song: Song) => void;
  size?: number;
  isCenter?: boolean;
}

export default function SongDisc({
  song,
  isActive,
  onPointerDown,
  onClick,
  size = 90,
  isCenter = false,
}: SongDiscProps) {
  if (isActive) {
    // Slotted empty tray outline when CD is loaded on turntable
    return (
      <div className="flex flex-col items-center justify-center p-1 select-none">
        <div
          className="cd-slot-empty cursor-pointer hover:border-amber-400/50 transition-colors"
          style={{ width: `${size}px`, height: `${size}px` }}
          onClick={() => onClick(song)}
          title={`Click to eject or drag ${song.title} off player`}
        >
          <div className="w-4 h-4 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-1 select-none">
      {/* Disc Visual */}
      <div
        onPointerDown={(e) => onPointerDown(e, song)}
        onClick={() => onClick(song)}
        className={`cd-hover-lift rounded-full cursor-grab active:cursor-grabbing touch-none inline-block transition-all ${
          isCenter
            ? "shadow-[0_15px_30px_-5px_rgba(0,0,0,0.6)] ring-2 ring-amber-400/50"
            : ""
        }`}
        role="button"
        tabIndex={0}
        aria-label={`Play ${song.title} by ${song.artist}`}
      >
        <DiscVisual song={song} size={size} />
      </div>
    </div>
  );
}