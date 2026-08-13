"use client";

import React, {
  useRef,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import type { Song } from "@/data/songs";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import CDPlayer from "./CDPlayer";
import DiscCollection from "./DiscCollection";
import PlayerControls from "./PlayerControls";
import PlaylistPanel from "./PlaylistPanel";
import { DiscVisual } from "./DiscVisual";
import { playSnapSound, playEjectSound } from "@/lib/sound";

import AddSongEasterEgg from "./AddSongEasterEgg";

// Constant style object: React never rewrites the ghost's inline style on
// re-renders (same identity), so the ref-driven left/top writes survive.
const GHOST_STYLE: React.CSSProperties = {};

export default function MusicWidget() {
  const {
    songs,
    currentSong,
    currentIndex,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    containerRef,
    setCurrentIndex,
    setIsPlaying,
    play,
    playFromStart,
    togglePlay,
    next,
    prev,
    seek,
    eject,
    shuffle,
    repeatMode,
    durations,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    addSong,
  } = useYouTubePlayer();

  const [playlistOpen, setPlaylistOpen] = useState(false);

  // Drag and drop state
  const [draggedSong, setDraggedSong] = useState<Song | null>(null);
  const [dragSource, setDragSource] = useState<"collection" | "player" | null>(
    null,
  );
  const [dragRotation, setDragRotation] = useState(0);
  const [isOverPlayer, setIsOverPlayer] = useState(false);

  // Ghost position is ref-driven: the element follows the pointer via direct
  // DOM writes, so drag moves never re-render the widget tree.
  const ghostPosRef = useRef({ x: 0, y: 0 });
  const ghostElRef = useRef<HTMLDivElement | null>(null);

  // Client-only flag: renders the drag ghost only after mount
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const playerRef = useRef<HTMLDivElement | null>(null);

  const checkIfOverPlayer = useCallback((clientX: number, clientY: number) => {
    if (!playerRef.current) return false;
    const rect = playerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(clientX - centerX, clientY - centerY);
    const snapRadius = rect.width / 2 + 35;
    return distance <= snapRadius;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, song: Song, isFromPlayer: boolean = false) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;

      const startX = e.clientX;
      const startY = e.clientY;
      let hasMoved = false;

      let currentAngle = 0;
      if (isFromPlayer && e.currentTarget) {
        const discEl =
          (e.currentTarget as HTMLElement).querySelector(".cd-disc") ||
          (e.currentTarget as HTMLElement);
        if (discEl) {
          const computedStyle = window.getComputedStyle(discEl);
          const matrix = computedStyle.transform;
          if (matrix && matrix !== "none") {
            const values = matrix.split("(")[1].split(")")[0].split(",");
            const a = parseFloat(values[0]);
            const b = parseFloat(values[1]);
            let angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
            if (angle < 0) angle += 360;
            currentAngle = angle;
          }
        }
      }

      ghostPosRef.current = { x: e.clientX, y: e.clientY };

      const onPointerMove = (moveEvt: PointerEvent) => {
        if (
          !hasMoved &&
          Math.hypot(moveEvt.clientX - startX, moveEvt.clientY - startY) > 5
        ) {
          hasMoved = true;
          setDraggedSong(song);
          setDragSource(isFromPlayer ? "player" : "collection");
          setDragRotation(currentAngle);
        }

        if (hasMoved) {
          moveEvt.preventDefault();
          ghostPosRef.current = { x: moveEvt.clientX, y: moveEvt.clientY };
          const el = ghostElRef.current;
          if (el) {
            el.style.left = `${moveEvt.clientX}px`;
            el.style.top = `${moveEvt.clientY}px`;
          }
          const over = checkIfOverPlayer(moveEvt.clientX, moveEvt.clientY);
          setIsOverPlayer(over);
        }
      };

      const onPointerUp = (upEvt: PointerEvent) => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerCancel);

        const over = checkIfOverPlayer(upEvt.clientX, upEvt.clientY);
        const songIdx = songs.findIndex((s) => s.id === song.id);

        if (!hasMoved && songIdx !== -1) {
          // Pure Click / Tap detected: load and play immediately!
          playSnapSound();
          setCurrentIndex(songIdx);
          setIsPlaying(true);
        } else if (over && songIdx !== -1) {
          // Dragged and dropped onto turntable platter → load & play
          playSnapSound();
          setCurrentIndex(songIdx);
          setIsPlaying(true);
        } else if (isFromPlayer && hasMoved) {
          // Dragged off player → eject
          eject();
          playEjectSound();
        }

        setDraggedSong(null);
        setDragSource(null);
        setDragRotation(0);
        setIsOverPlayer(false);
      };

      // Touch scrolling / browser gesture stole the pointer (e.g. horizontal
      // swipe over the rack) → abort the drag without playing or ejecting.
      const onPointerCancel = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerCancel);
        setDraggedSong(null);
        setDragSource(null);
        setDragRotation(0);
        setIsOverPlayer(false);
      };

      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerCancel);
    },
    [checkIfOverPlayer, songs, setCurrentIndex, setIsPlaying, eject],
  );

  const handleSelectSong = useCallback(
    (songId: string) => {
      playSnapSound();
      play(songId);
    },
    [play],
  );

  // Stable callback so the memoized DiscCollection skips re-renders on
  // playback/drag state churn (only recreated when the drag handler changes).
  const handlePointerDownCollection = useCallback(
    (e: React.PointerEvent, song: Song) => handlePointerDown(e, song, false),
    [handlePointerDown],
  );

  // Ghost mounts at the current pointer position without a re-render:
  // callback ref writes position once at commit.
  const ghostRef = useCallback((el: HTMLDivElement | null) => {
    ghostElRef.current = el;
    if (el) {
      const { x, y } = ghostPosRef.current;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    }
  }, []);

  const handleEject = useCallback(() => {
    eject();
    playEjectSound();
  }, [eject]);

  const showDiscOnPlayer =
    currentSong &&
    !(dragSource === "player" && draggedSong?.id === currentSong.id);

  return (
    <div className="fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] sm:bottom-[max(2rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50 w-[94%] xs:w-[95%] sm:w-[96%] max-w-5xl bento-card-texture px-3 sm:px-5 py-2.5 sm:py-3 select-none rounded-3xl border border-white/20 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.85)] overflow-hidden">
      {/* Hidden YouTube IFrame Player (1x1 px, invisible, powers playback) */}
      <div
        ref={containerRef}
        className="absolute bottom-0 left-0 w-1 h-1 overflow-hidden opacity-[0.01] pointer-events-none"
      >
        <div id="yt-player-container" />
      </div>

      {/* Flow: Platter -> Controls -> Disc Rack */}
      {/* Mobile: stacked (controls row + full-width rack strip); sm+: single row */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-4 relative z-[2] w-full">
        <div className="flex items-center gap-2.5 xs:gap-2.5 sm:gap-4 w-full min-w-0">
          {/* Platter Deck on Far Left */}
          <CDPlayer
            playerRef={playerRef}
            isDropTarget={isOverPlayer}
            onPointerDownActiveDisc={
              currentSong
                ? (e) => handlePointerDown(e, currentSong, true)
                : undefined
            }
          >
            {showDiscOnPlayer && (
              <div className="cd-snap-in relative flex items-center justify-center">
                <DiscVisual
                  song={currentSong}
                  size={44}
                  isPlaying={isPlaying}
                  isOnPlayer={true}
                />
              </div>
            )}
          </CDPlayer>

          {/* Player Controls & Scrubber */}
          <PlayerControls
            currentSong={currentSong}
            isPlaying={isPlaying}
            progress={progress}
            duration={duration}
            volume={volume}
            isMuted={isMuted}
            onPlayPause={togglePlay}
            onPrev={prev}
            onNext={next}
            onEject={handleEject}
            onSeek={seek}
            onVolumeChange={setVolume}
            onToggleMute={toggleMute}
            onTogglePlaylist={() => setPlaylistOpen((prev) => !prev)}
            playlistOpen={playlistOpen}
          />
        </div>

        {/* Mini CD Selector Rack */}
        <DiscCollection
          songs={songs}
          activeSongId={currentSong ? currentSong.id : null}
          onPointerDownSong={handlePointerDownCollection}
          onSelectSong={handleSelectSong}
        />
      </div>

      {/* Playlist Drawer */}
      {playlistOpen &&
        createPortal(
          <PlaylistPanel
            songs={songs}
            currentIndex={currentIndex}
            isPlaying={isPlaying}
            durations={durations}
            repeatMode={repeatMode}
            shuffle={shuffle}
            onSelect={playFromStart}
            onToggleShuffle={toggleShuffle}
            onCycleRepeat={cycleRepeatMode}
            onClose={() => setPlaylistOpen(false)}
          />,
          document.body,
        )}

      {/* Floating Dragged Disc */}
      {isMounted &&
        draggedSong &&
        createPortal(
          <div
            ref={ghostRef}
            className="cd-dragging-ghost rounded-full overflow-hidden bg-transparent pointer-events-none"
            style={GHOST_STYLE}
          >
            <DiscVisual
              song={draggedSong}
              size={64}
              isPlaying={false}
              rotation={dragRotation}
            />
          </div>,
          document.body,
        )}
      {/* Easter Egg Add Song Overlay */}
      <AddSongEasterEgg addSong={addSong} />
    </div>
  );
}
