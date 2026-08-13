"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { extractVideoId } from "@/lib/youtube";

interface AddSongEasterEggProps {
  addSong: (videoId: string, title: string, artist: string) => void;
}

export default function AddSongEasterEgg({ addSong }: AddSongEasterEggProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openModal = useCallback(() => {
    bufferRef.current = "";
    setVisible(true);
    setStatus("idle");
    setUrl("");
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setVisible(false), 12000);
  }, []);

  // Listen for A-D-D sequence & Ctrl/Cmd+Shift+A shortcut & custom event
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Shortcut: Ctrl+Shift+A or Cmd+Shift+A
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toUpperCase() === "A") {
        e.preventDefault();
        openModal();
        return;
      }

      // Don't process sequence while focused in input elements
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      // Only accept single printable characters (a-z, A-Z)
      if (e.key.length !== 1) return;

      const now = Date.now();
      // Reset buffer if more than 1.5s passed between keys
      if (now - lastKeyTimeRef.current > 1500) {
        bufferRef.current = "";
      }
      lastKeyTimeRef.current = now;

      bufferRef.current += e.key.toUpperCase();
      if (bufferRef.current.length > 3) {
        bufferRef.current = bufferRef.current.slice(-3);
      }

      if (bufferRef.current === "ADD") {
        openModal();
      }
    };

    const handleCustomOpen = () => openModal();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("open-add-song", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("open-add-song", handleCustomOpen);
    };
  }, [openModal]);

  // Focus input when visible
  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    setVisible(false);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const videoId = extractVideoId(url.trim());
      if (!videoId) {
        setStatus("error");
        return;
      }

      setStatus("loading");
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

      try {
        const res = await fetch(
          `/api/youtube/meta?url=${encodeURIComponent(url.trim())}`,
        );
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        const title = data.title || "Untitled";
        const artist = data.artist || "Unknown Artist";
        addSong(videoId, title, artist);
        setStatus("success");
        setTimeout(() => {
          setVisible(false);
          setStatus("idle");
        }, 1500);
      } catch {
        addSong(videoId, `Track ${videoId.slice(0, 6)}`, "YouTube");
        setStatus("success");
        setTimeout(() => {
          setVisible(false);
          setStatus("idle");
        }, 1500);
      }
    },
    [url, addSong],
  );

  if (!visible || !mounted) return null;

  return createPortal(
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-slide-down">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2.5 bg-black/90 backdrop-blur-2xl border border-white/20 rounded-full px-4 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
      >
        <span className="text-amber-400 text-xs font-mono font-bold tracking-widest bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
          + ADD SONG
        </span>
        <input
          ref={inputRef}
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setStatus("idle");
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            hideTimerRef.current = setTimeout(() => setVisible(false), 12000);
          }}
          onKeyDown={(e) => e.key === "Escape" && handleClose()}
          placeholder="Paste YouTube video URL..."
          className="bg-transparent text-white text-xs sm:text-sm font-outfit placeholder:text-white/35 outline-none w-56 sm:w-72"
        />
        {status === "idle" && (
          <button
            type="submit"
            className="text-xs font-mono font-bold text-black bg-amber-400 hover:bg-amber-300 transition-colors px-2.5 py-1 rounded-full shadow-sm"
          >
            Add
          </button>
        )}
        {status === "loading" && (
          <span className="text-xs font-mono text-amber-400 animate-pulse px-2">
            Loading...
          </span>
        )}
        {status === "success" && (
          <span className="text-xs font-mono text-emerald-400 font-bold px-2">
            ✓ Added!
          </span>
        )}
        {status === "error" && (
          <span className="text-xs font-mono text-red-400 px-2">Invalid URL</span>
        )}
        <button
          type="button"
          onClick={handleClose}
          className="text-xs text-white/40 hover:text-white transition-colors ml-1"
          title="Close (Esc)"
        >
          ✕
        </button>
      </form>
    </div>,
    document.body,
  );
}
