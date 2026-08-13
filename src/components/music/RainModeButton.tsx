"use client";

import React, { useState, useEffect, useRef } from "react";
import { CloudRain, Volume2 } from "lucide-react";
import { rainSynth } from "@/lib/rainSound";

interface RainModeButtonProps {
  onToggleRain?: (active: boolean) => void;
}

export function RainModeButton({ onToggleRain }: RainModeButtonProps) {
  const [isRainActive, setIsRainActive] = useState(false);
  const [rainVolume, setRainVolume] = useState(0.35);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggleRain = () => {
    const nextState = !isRainActive;
    setIsRainActive(nextState);

    if (nextState) {
      rainSynth.start(rainVolume);
    } else {
      rainSynth.stop();
      setShowVolumeSlider(false);
    }

    if (onToggleRain) {
      onToggleRain(nextState);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setRainVolume(vol);
    rainSynth.setVolume(vol);
  };

  // Close volume popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowVolumeSlider(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleRain}
        className={`text-xs font-mono tracking-wider uppercase px-3 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 select-none shadow-sm ${
          isRainActive
            ? "bg-cyan-950/80 text-cyan-300 border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.4)] animate-pulse"
            : "bg-black/50 text-white/70 hover:text-cyan-300 border-white/10 hover:border-cyan-400/30 hover:bg-black/70"
        }`}
        title={isRainActive ? "Turn off rain mode" : "Turn on rain mode"}
      >
        <CloudRain
          size={14}
          className={isRainActive ? "text-cyan-300 animate-bounce" : "text-white/60"}
        />
        <span>{isRainActive ? "RAIN ON" : "RAIN MODE"}</span>
      </button>

      {/* Rain Volume Quick Adjustment Toggle */}
      {isRainActive && (
        <button
          type="button"
          onClick={() => setShowVolumeSlider(!showVolumeSlider)}
          className="ml-1 p-1.5 text-cyan-300 hover:text-white rounded-full bg-cyan-950/60 border border-cyan-400/30 transition-colors cursor-pointer"
          title="Adjust Rain Volume"
        >
          <Volume2 size={12} />
        </button>
      )}

      {/* Rain Volume Popover */}
      {showVolumeSlider && isRainActive && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-black/90 backdrop-blur-md border border-cyan-500/30 p-2.5 rounded-2xl shadow-xl flex flex-col items-center gap-1.5 w-32">
          <span className="text-[9px] font-mono text-cyan-300 uppercase tracking-widest">
            Rain Vol: {Math.round(rainVolume * 100)}%
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={rainVolume}
            onChange={handleVolumeChange}
            className="w-full h-1.5 bg-zinc-800 accent-cyan-400 rounded-lg cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}
