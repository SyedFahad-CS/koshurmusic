"use client";

import React, { useState, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  DiscAlbum,
  Disc,
  Volume2,
  Volume1,
  VolumeX,
  ListMusic,
  ArrowUpRight,
} from "lucide-react";
import type { Song } from "@/data/songs";
import { playButtonClickSound } from "@/lib/sound";

interface PlayerControlsProps {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onEject: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onTogglePlaylist: () => void;
  playlistOpen: boolean;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const DEFAULT_WAVEFORM = [
  12, 14, 16, 20, 22, 25, 24, 26, 22, 18, 14, 16, 20, 25, 27, 26, 22, 18, 14,
  10,
];

/** Shared pointer-drag logic for the seek & volume sliders (omnidirectional). */
function useSlider(
  onChange: (ratio: number) => void,
  disabled: boolean = false,
) {
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      setIsDragging(true);

      const container = e.currentTarget;

      const update = (clientX: number) => {
        const rect = container.getBoundingClientRect();
        const ratio = Math.max(
          0,
          Math.min(1, (clientX - rect.left) / rect.width),
        );
        onChange(ratio);
      };

      update(e.clientX);

      const onPointerMove = (moveEvt: PointerEvent) => {
        moveEvt.preventDefault();
        update(moveEvt.clientX);
      };

      const onPointerUp = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        setIsDragging(false);
      };

      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("pointerup", onPointerUp);
    },
    [onChange, disabled],
  );

  return { isDragging, handlePointerDown };
}

function ControlButton({
  onClick,
  label,
  title,
  disabled = false,
  className = "",
  children,
}: {
  onClick: () => void;
  label: string;
  title?: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={label}
      className={`w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white/70 hover:text-white border border-white/10 transition-all flex items-center justify-center ${className}`}
    >
      {children}
    </button>
  );
}

export default function PlayerControls({
  currentSong,
  isPlaying,
  progress,
  duration,
  volume,
  isMuted,
  onPlayPause,
  onPrev,
  onNext,
  onEject,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onTogglePlaylist,
  playlistOpen,
}: PlayerControlsProps) {
  const [dragSeekTime, setDragSeekTime] = useState<number | null>(null);

  const seekSlider = useSlider((ratio) => {
    const targetTime = ratio * duration;
    setDragSeekTime(targetTime);
    onSeek(targetTime);
  }, !currentSong || !duration);

  const displayProgress = currentSong
    ? seekSlider.isDragging && dragSeekTime !== null
      ? dragSeekTime
      : progress
    : 0;
  const displayDuration = currentSong
    ? duration > 0
      ? duration
      : currentSong.duration || 0
    : 0;

  const activeRatio =
    displayDuration > 0 ? displayProgress / displayDuration : 0;

  // Generate a deterministic, organic-looking waveform from the song ID
  // 3 envelope profiles so each song feels distinct
  const waveform = React.useMemo(() => {
    const BAR_COUNT = 56;
    if (!currentSong) {
      return Array.from({ length: BAR_COUNT }, () => 0.18);
    }
    // Deterministic seed from song id
    let seed = 0;
    for (let i = 0; i < currentSong.id.length; i++) {
      seed = ((seed << 5) - seed + currentSong.id.charCodeAt(i)) | 0;
    }
    const rand = () => {
      seed = (seed * 16807 + 0) % 2147483647;
      return (seed & 0x7fffffff) / 0x7fffffff;
    };

    // Pick one of 3 envelope shapes based on hash
    const profile = Math.abs(seed) % 3;
    const envelope = (t: number): number => {
      switch (profile) {
        case 0:
          // "Ballad" — slow build, gentle peak around 60%, soft fade
          return (Math.sin(t * Math.PI * 0.85) ** 0.7) * 0.7 + 0.3;
        case 1:
          // "Banger" — loud throughout with twin peaks and a dip in the middle
          return (0.6 + 0.4 * Math.sin(t * Math.PI * 2)) * (0.85 + 0.15 * Math.sin(t * Math.PI));
        case 2:
        default:
          // "Classic" — symmetric bell curve, strong middle
          return Math.sin(t * Math.PI) * 0.65 + 0.35;
      }
    };

    const bars: number[] = [];
    let prev = 0.3 + rand() * 0.15;
    for (let i = 0; i < BAR_COUNT; i++) {
      const t = i / (BAR_COUNT - 1);
      const env = envelope(t);
      const jitter = (rand() - 0.5) * 0.55;
      let val = prev + jitter;
      val = Math.max(0.12, Math.min(1, val));
      val *= env;
      bars.push(val);
      prev = val * 0.65 + prev * 0.35;
    }
    return bars;
  }, [currentSong]);

  const volumeSlider = useSlider(onVolumeChange);
  const effectiveVolume = isMuted ? 0 : volume;

  return (
    <div className="flex-1 flex items-center justify-between gap-2 sm:gap-4 min-w-0 px-0.5 sm:px-1">
      {/* Track Title, Artist & Waveform Scrubber */}
      <div className="flex-1 flex flex-col justify-center min-w-0 py-0.5">
        {/* Top Row: Track Title & Live Timestamp */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-headline font-bold text-white tracking-tight leading-tight truncate max-w-[120px] xs:max-w-[140px] sm:max-w-[210px]">
              {currentSong && currentSong.title
                ? currentSong.title
                : "No Disc Loaded"}
            </h3>
            {currentSong && currentSong.youtubeUrl && (
              <a
                href={currentSong.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-amber-400 transition-colors inline-flex items-center shrink-0 p-0.5"
                title="Open in YouTube"
                aria-label="Open in YouTube"
              >
                <ArrowUpRight size={11} strokeWidth={2} />
              </a>
            )}
          </div>
          <span className="text-[9px] sm:text-[11px] font-mono text-white/50 font-medium shrink-0 hidden min-[400px]:inline">
            {currentSong
              ? `${formatTime(displayProgress)} / ${formatTime(displayDuration)}`
              : "--:-- / --:--"}
          </span>
        </div>

        {/* Middle Row: Artist Subtitle */}
        <p className="text-[10px] sm:text-[11px] font-outfit text-white/60 truncate mt-0.5 mb-1 sm:mb-1.5 leading-none max-w-[150px] xs:max-w-[160px] sm:max-w-[240px]">
          {currentSong && currentSong.artist
            ? currentSong.artist
            : "Select or drag a CD"}
        </p>

        {/* Bottom Row: Waveform Scrubber */}
        <div
          className={`relative w-full flex items-end gap-[1px] h-4 sm:h-5 select-none group cursor-pointer ${
            !currentSong ? "opacity-30 pointer-events-none" : ""
          }`}
          onPointerDown={seekSlider.handlePointerDown}
          title="Drag to seek"
        >
          {(() => {
            const activeBarIdx = currentSong && displayDuration > 0
              ? Math.floor(activeRatio * (waveform.length - 1))
              : -1;

            return waveform.map((height, idx) => {
              const isPlayed = idx <= activeBarIdx;
              const isCurrent = idx === activeBarIdx;

              return (
                <div
                  key={idx}
                  className={`flex-1 min-w-[1px] sm:min-w-[1.5px] max-w-[3px] rounded-[1px] transition-colors duration-100 ${
                    isCurrent
                      ? "bg-amber-300 shadow-[0_0_4px_rgba(245,158,11,0.6)]"
                      : isPlayed
                        ? "bg-amber-400"
                        : "bg-white/20 group-hover:bg-white/30"
                  }`}
                  style={{ height: `${Math.round(2 + height * 15)}px` }}
                />
              );
            });
          })()}
        </div>
      </div>

      {/* Media Controls (Prev, Big White Play/Pause, Next, Volume, Eject) */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <button
          onClick={() => {
            playButtonClickSound();
            onPrev();
          }}
          disabled={!currentSong}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors flex items-center justify-center disabled:opacity-20"
          aria-label="Previous track"
        >
          <SkipBack size={16} strokeWidth={2.2} />
        </button>

        {/* Primary Play/Pause Button */}
        <button
          onClick={() => {
            playButtonClickSound();
            onPlayPause();
          }}
          disabled={!currentSong}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-400 text-black hover:bg-amber-300 hover:scale-105 active:scale-95 disabled:opacity-20 shadow-[0_0_20px_rgba(245,158,11,0.55)] transition-all flex items-center justify-center font-bold shrink-0"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause size={18} strokeWidth={2.4} fill="currentColor" />
          ) : (
            <Play size={18} strokeWidth={2.4} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        <button
          onClick={() => {
            playButtonClickSound();
            onNext();
          }}
          disabled={!currentSong}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors flex items-center justify-center disabled:opacity-20"
          aria-label="Next track"
        >
          <SkipForward size={16} strokeWidth={2.2} />
        </button>

        {/* Volume, Eject & Playlist Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3.5 border-l border-white/15">
          <button
            onClick={() => {
              playButtonClickSound();
              onEject();
            }}
            disabled={!currentSong}
            className="hidden xs:flex w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors items-center justify-center disabled:opacity-20"
            title="Eject CD"
          >
            <DiscAlbum size={16} strokeWidth={2} />
          </button>

          <div className="flex items-center gap-1.5 group/vol">
            <button
              onClick={() => {
                playButtonClickSound();
                onToggleMute();
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors flex items-center justify-center"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={16} strokeWidth={2} />
              ) : volume <= 0.5 ? (
                <Volume1 size={16} strokeWidth={2} />
              ) : (
                <Volume2 size={16} strokeWidth={2} />
              )}
            </button>

            <div
              className="hidden sm:flex relative w-10 sm:w-12 h-1.5 bg-white/20 rounded-full cursor-pointer select-none overflow-visible items-center group-hover/vol:w-14 transition-all duration-200"
              onPointerDown={volumeSlider.handlePointerDown}
            >
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${effectiveVolume * 100}%` }}
              />
            </div>
          </div>

          {/* Playlist Toggle */}
          <button
            onClick={() => {
              playButtonClickSound();
              onTogglePlaylist();
            }}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors ${
              playlistOpen
                ? "bg-amber-400/20 text-amber-400"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
            title="Playlist"
            aria-label="Playlist"
          >
            <ListMusic size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
