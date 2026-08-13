"use client";

import React, { useState, useEffect, useRef } from "react";
import { CloudRain, Snowflake, Sun, Volume2, VolumeX } from "lucide-react";
import { rainSynth } from "@/lib/rainSound";
import { snowSynth } from "@/lib/snowSound";

export type WeatherMode = "clear" | "rain" | "snow";

interface WeatherModeButtonProps {
  onWeatherChange?: (mode: WeatherMode) => void;
}

export function WeatherModeButton({ onWeatherChange }: WeatherModeButtonProps) {
  const [weatherMode, setWeatherMode] = useState<WeatherMode>("clear");
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const cycleWeather = () => {
    let nextMode: WeatherMode = "clear";
    if (weatherMode === "clear") nextMode = "rain";
    else if (weatherMode === "rain") nextMode = "snow";
    else nextMode = "clear";

    setWeatherMode(nextMode);

    // Synchronize synthesizers (Only play sound if user explicitly enabled audio)
    if (nextMode === "rain") {
      snowSynth.stop();
      if (isSoundEnabled) rainSynth.start(volume);
      else rainSynth.stop();
    } else if (nextMode === "snow") {
      rainSynth.stop();
      if (isSoundEnabled) snowSynth.start(volume);
      else snowSynth.stop();
    } else {
      rainSynth.stop();
      snowSynth.stop();
      setShowVolumeSlider(false);
    }

    if (onWeatherChange) {
      onWeatherChange(nextMode);
    }
  };

  const toggleSound = () => {
    const nextSoundState = !isSoundEnabled;
    setIsSoundEnabled(nextSoundState);

    if (nextSoundState) {
      if (weatherMode === "rain") rainSynth.start(volume);
      if (weatherMode === "snow") snowSynth.start(volume);
    } else {
      rainSynth.stop();
      snowSynth.stop();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (weatherMode === "rain") rainSynth.setVolume(vol);
    if (weatherMode === "snow") snowSynth.setVolume(vol);
  };

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
        onClick={cycleWeather}
        className={`text-xs font-mono tracking-wider uppercase px-3 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 select-none shadow-sm ${
          weatherMode === "rain"
            ? "bg-cyan-950/80 text-cyan-300 border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
            : weatherMode === "snow"
            ? "bg-sky-950/80 text-sky-200 border-sky-300/50 shadow-[0_0_12px_rgba(186,230,253,0.4)]"
            : "bg-black/50 text-white/70 hover:text-cyan-300 border-white/10 hover:border-cyan-400/30 hover:bg-black/70"
        }`}
        title="Click to cycle weather (Clear / Rain / Snow)"
      >
        {weatherMode === "rain" && <CloudRain size={14} className="text-cyan-300 animate-bounce" />}
        {weatherMode === "snow" && <Snowflake size={14} className="text-sky-200 animate-spin" style={{ animationDuration: "8s" }} />}
        {weatherMode === "clear" && <Sun size={14} className="text-amber-400/80" />}

        <span>
          {weatherMode === "rain" && "RAIN MODE"}
          {weatherMode === "snow" && "SNOW MODE"}
          {weatherMode === "clear" && "WEATHER"}
        </span>
      </button>

      {/* Weather Volume Slider & Sound Toggle Trigger */}
      {weatherMode !== "clear" && (
        <button
          type="button"
          onClick={() => {
            if (!isSoundEnabled) {
              toggleSound();
            }
            setShowVolumeSlider(!showVolumeSlider);
          }}
          className={`ml-1 p-1.5 rounded-full border transition-colors cursor-pointer ${
            isSoundEnabled
              ? weatherMode === "rain"
                ? "text-cyan-300 bg-cyan-950/80 border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                : "text-sky-200 bg-sky-950/80 border-sky-300/50 shadow-[0_0_8px_rgba(186,230,253,0.4)]"
              : "text-white/40 bg-black/40 border-white/10 hover:text-white"
          }`}
          title={isSoundEnabled ? "Adjust Weather Ambience Volume" : "Enable Weather Ambience Sound"}
        >
          {isSoundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
        </button>
      )}

      {/* Weather Volume Popover */}
      {showVolumeSlider && weatherMode !== "clear" && (
        <div className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 z-50 bg-black/85 backdrop-blur-2xl border border-white/20 p-3 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.9)] flex flex-col gap-2.5 w-48 select-none animate-in fade-in zoom-in-95 duration-200">
          {/* Popover Header */}
          <div className="flex items-center justify-between text-[10px] font-mono tracking-wider">
            <div className="flex items-center gap-1.5 text-white/80">
              {weatherMode === "rain" && <CloudRain size={12} className="text-cyan-400" />}
              {weatherMode === "snow" && <Snowflake size={12} className="text-sky-300" />}
              <span className="uppercase font-bold tracking-widest">
                {weatherMode === "rain" ? "Rain Sound" : "Snow Wind"}
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 font-bold bg-white/10 px-1.5 py-0.5 rounded-md border border-white/10">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Custom Styled Slider Bar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const nextVol = volume === 0 ? 0.35 : 0;
                setVolume(nextVol);
                if (weatherMode === "rain") rainSynth.setVolume(nextVol);
                if (weatherMode === "snow") snowSynth.setVolume(nextVol);
              }}
              className="text-white/60 hover:text-white transition-colors cursor-pointer shrink-0"
              title={volume === 0 ? "Unmute" : "Mute"}
            >
              <Volume2 size={13} className={volume === 0 ? "opacity-30" : "text-cyan-300"} />
            </button>

            <div
              className="relative flex-1 h-2 bg-white/15 rounded-full cursor-pointer touch-none flex items-center"
              onPointerDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const updateVol = (clientX: number) => {
                  const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                  setVolume(pct);
                  if (weatherMode === "rain") rainSynth.setVolume(pct);
                  if (weatherMode === "snow") snowSynth.setVolume(pct);
                };
                updateVol(e.clientX);

                const handleMove = (moveEv: PointerEvent) => updateVol(moveEv.clientX);
                const handleUp = () => {
                  window.removeEventListener("pointermove", handleMove);
                  window.removeEventListener("pointerup", handleUp);
                };
                window.addEventListener("pointermove", handleMove);
                window.addEventListener("pointerup", handleUp);
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-sky-300 rounded-full relative"
                style={{ width: `${volume * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md border border-cyan-400 ring-2 ring-cyan-500/30" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
