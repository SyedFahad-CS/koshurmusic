"use client";

import React, { memo } from "react";
import type { Song } from "@/data/songs";
import { DiscVisual } from "./DiscVisual";

interface DiscCollectionProps {
  songs: Song[];
  activeSongId: string | null;
  onPointerDownSong: (e: React.PointerEvent, song: Song) => void;
  onSelectSong: (songId: string) => void;
}

export default memo(function DiscCollection({
  songs,
  activeSongId,
  onPointerDownSong,
  onSelectSong,
}: DiscCollectionProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto sm:shrink-0 pt-1.5 sm:pt-0 sm:pl-4 pr-1 sm:pr-6 border-t border-white/10 sm:border-t-0 sm:border-l">
      <div className="flex items-center gap-3 xs:gap-3.5 sm:gap-4 overflow-x-auto py-2.5 sm:py-4 px-2 sm:px-3 max-w-none sm:max-w-[340px] scrollbar-none touch-pan-x snap-x snap-proximity">
        {songs.map((song) => {
          const isActive = song.id === activeSongId;

          return (
            <div
              key={song.id}
              onClick={() => onSelectSong(song.id)}
              onPointerDown={(e) => onPointerDownSong(e, song)}
              className={`relative cursor-grab active:cursor-grabbing shrink-0 transition-all rounded-full m-0.5 snap-start ${
                isActive
                  ? "scale-105 sm:scale-110 opacity-100 z-10"
                  : "opacity-65 hover:opacity-100 hover:scale-105"
              }`}
              title={`Play ${song.title || "Track"}`}
            >
              <DiscVisual song={song} size={38} isActive={isActive} />
            </div>
          );
        })}
      </div>
    </div>
  );
});
