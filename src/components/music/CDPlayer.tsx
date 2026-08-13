"use client";

import React from "react";

interface CDPlayerProps {
  children?: React.ReactNode;
  isDropTarget?: boolean;
  onPointerDownActiveDisc?: (e: React.PointerEvent) => void;
  playerRef?: React.Ref<HTMLDivElement>;
}

export default function CDPlayer({
  children,
  isDropTarget = false,
  onPointerDownActiveDisc,
  playerRef,
}: CDPlayerProps) {
  return (
    <div
      ref={playerRef}
      className={`cd-player-body w-[48px] h-[48px] xs:w-[56px] xs:h-[56px] sm:w-[68px] sm:h-[68px] shrink-0 flex items-center justify-center p-0.5 ${
        isDropTarget ? "is-drop-target" : ""
      }`}
    >
      {/* Recessed Circular CD Dish Tray */}
      <div className="cd-player-recess aspect-square flex items-center justify-center relative">
        {/* Loaded Disc OR Empty Silver Spindle Hub Tray */}
        {children ? (
          <div
            onPointerDown={onPointerDownActiveDisc}
            className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing z-10 rounded-full bg-transparent overflow-hidden"
            title="Drag disc off player to eject, or click play/pause controls"
          >
            {children}
          </div>
        ) : (
          /* Empty Spindle mechanism & target invite visible when no CD is loaded */
          <div className="cd-player-spindle pointer-events-none flex items-center justify-center relative w-full h-full">
            <div className="absolute inset-1 rounded-full border border-dashed border-amber-400/30 animate-pulse" />
            <div className="cd-spindle-hub">
              <div className="cd-spindle-pin" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}