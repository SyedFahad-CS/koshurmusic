"use client";

import React from "react";
import { Shuffle, Repeat, Repeat1, X, ListMusic } from "lucide-react";
import type { Song } from "@/data/songs";

interface PlaylistPanelProps {
  songs: Song[];
  currentIndex: number | null;
  isPlaying: boolean;
  durations: Record<string, number>;
  repeatMode: "all" | "one" | "off";
  shuffle: boolean;
  onSelect: (idx: number) => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function PlaylistPanel({
  songs,
  currentIndex,
  isPlaying,
  durations,
  repeatMode,
  shuffle,
  onSelect,
  onToggleShuffle,
  onCycleRepeat,
  onClose,
}: PlaylistPanelProps) {
  const [isClosing, setIsClosing] = React.useState(false);

  const handleSmoothClose = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 220);
  }, [onClose]);

  // Listen for Escape key to close the playlist drawer smoothly
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSmoothClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSmoothClose]);

  return (
    <div
      className={`fixed bottom-[calc(10.5rem+env(safe-area-inset-bottom))] sm:bottom-[calc(9rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[60] w-[94%] max-w-5xl rounded-2xl bg-black/75 backdrop-blur-2xl border border-white/15 shadow-[0_30px_70px_rgba(0,0,0,0.85)] overflow-hidden transition-all duration-200 ease-out transform ${
        isClosing
          ? "opacity-0 translate-y-6 scale-95 pointer-events-none"
          : "opacity-100 translate-y-0 scale-100"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
        <span className="text-[10px] font-mono text-white/50 tracking-[0.2em] uppercase flex items-center gap-1.5">
          <ListMusic size={12} strokeWidth={1.5} />
          Playlist
          <span className="text-white/25">({songs.length})</span>
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleShuffle}
            title="Shuffle"
            aria-label="Shuffle"
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
              shuffle
                ? "bg-amber-400/20 text-amber-400"
                : "text-white/40 hover:text-white/80 hover:bg-white/10"
            }`}
          >
            <Shuffle size={12} strokeWidth={1.75} />
          </button>
          <button
            onClick={onCycleRepeat}
            title={`Repeat: ${repeatMode}`}
            aria-label="Repeat mode"
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
              repeatMode !== "off"
                ? "bg-amber-400/20 text-amber-400"
                : "text-white/40 hover:text-white/80 hover:bg-white/10"
            }`}
          >
            {repeatMode === "one" ? (
              <Repeat1 size={12} strokeWidth={1.75} />
            ) : (
              <Repeat size={12} strokeWidth={1.75} />
            )}
          </button>
          <button
            onClick={handleSmoothClose}
            title="Close playlist"
            aria-label="Close playlist"
            className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
          >
            <X size={12} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Track list */}
      <div className="max-h-[38vh] overflow-y-auto py-1 playlist-scroll">
        {songs.map((song, idx) => {
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={song.id}
              onClick={() => {
                onSelect(idx);
                handleSmoothClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors group ${
                isCurrent
                  ? "bg-amber-400/10"
                  : "hover:bg-white/5"
              }`}
            >
              {/* Indicator / index */}
              <span className="w-5 shrink-0 flex items-center justify-center">
                {isCurrent && isPlaying ? (
                  <span className="flex items-end gap-[2px] h-3" aria-hidden>
                    <span className="w-[2px] bg-amber-400 rounded-full animate-eq-bar" style={{ animationDelay: "0ms" }} />
                    <span className="w-[2px] bg-amber-400 rounded-full animate-eq-bar" style={{ animationDelay: "150ms" }} />
                    <span className="w-[2px] bg-amber-400 rounded-full animate-eq-bar" style={{ animationDelay: "300ms" }} />
                  </span>
                ) : (
                  <span
                    className={`text-[10px] font-mono ${
                      isCurrent ? "text-amber-400" : "text-white/30"
                    }`}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                )}
              </span>

              <span className="flex-1 min-w-0">
                <span
                  className={`block text-xs font-headline font-semibold truncate ${
                    isCurrent ? "text-amber-400" : "text-white/85 group-hover:text-white"
                  }`}
                >
                  {song.title || `Track ${idx + 1}`}
                </span>
                <span className="block text-[10px] font-outfit text-white/40 truncate">
                  {song.artist || "Koshur Music"}
                </span>
              </span>

              <span className="text-[10px] font-mono text-white/35 shrink-0">
                {formatTime(durations[song.id] || song.duration)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}