"use client";

import React from "react";
import type { Song } from "@/data/songs";
import { getThumbnailUrl } from "@/lib/youtube";

interface DiscVisualProps {
  song: Song;
  size: number;
  isActive?: boolean;
  isPlaying?: boolean;
  isOnPlayer?: boolean;
  rotation?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function DiscVisual({
  song,
  size,
  isActive = false,
  isPlaying = false,
  isOnPlayer = false,
  rotation = 0,
  className = "",
  style = {},
}: DiscVisualProps) {
  const { disc } = song;
  const youtubeThumb = getThumbnailUrl(song.youtubeUrl, "maxres");

  // Manual coverImg wins; otherwise auto-pull the YouTube video thumbnail
  const activeCoverImg = disc.coverImg || youtubeThumb;

  const transformStyle = rotation
    ? { transform: `rotate(${rotation}deg)`, ...style }
    : style;

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Tight Circular Amber Halo Ring (Positioned Behind Disc) */}
      {isActive && (
        <div
          className="absolute rounded-full pointer-events-none z-0"
          style={{
            inset: -2.5,
            borderRadius: "50%",
            border: "2px solid rgba(245, 158, 11, 0.95)",
            boxShadow:
              "0 0 8px rgba(245, 158, 11, 0.6), inset 0 0 4px rgba(245, 158, 11, 0.3)",
          }}
        />
      )}

      {/* The CD Disc */}
      <div
        className={`cd-disc ${isPlaying ? "cd-spinning" : ""} ${isOnPlayer ? "touch-none" : ""} relative z-10 ${className}`}
        style={{
          width: size,
          height: size,
          background: disc.baseColor,
          ...transformStyle,
        }}
      >
        {/* Cover Artwork Image (Blurred Backdrop Aura + Focused Main Image) */}
        {activeCoverImg && (
          <div className="absolute inset-0 w-full h-full rounded-full overflow-hidden z-[1]">
            {/* Layer 1: Ambient blurred background to fill edge transition smoothly */}
            <img
              src={activeCoverImg}
              alt=""
              className="absolute inset-0 w-full h-full object-cover filter blur-[8px] scale-125 opacity-70 pointer-events-none"
            />
            {/* Layer 2: Main artwork zoomed past YouTube's hardcoded pillarbox side bars */}
            <img
              src={activeCoverImg}
              alt={song.title}
              className="absolute inset-0 w-full h-full object-cover object-[center_35%] scale-[1.35] pointer-events-none z-10"
            />
          </div>
        )}

        {/* Clear plastic hub ring & center spindle hole */}
        <div className="cd-disc-center z-20">
          <div
            className={`cd-disc-hole ${isOnPlayer ? "cd-disc-hole-on-player" : ""}`}
          />
        </div>
      </div>
    </div>
  );
}
