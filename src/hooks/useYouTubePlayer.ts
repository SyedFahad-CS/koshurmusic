"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Song } from "@/data/songs";
import { MUSIC_SOURCES, DISC_PALETTE } from "@/data/songs";
import { extractVideoId, extractPlaylistId } from "@/lib/youtube";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface YTPlayer {
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  destroy: () => void;
}

let apiLoading = false;
let apiLoaded = false;
let playerCreated = false;

function loadYouTubeAPI(): Promise<void> {
  if (apiLoaded) return Promise.resolve();
  if (apiLoading) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (apiLoaded) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    });
  }

  apiLoading = true;
  return new Promise((resolve) => {
    (window as any).onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      resolve();
    };

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
}

const YT_STATE = {
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
};

// Silent AudioContext keep-alive: a zero-gain looping buffer marks this tab
// as "actively playing audio", which stops Android/Chrome from suspending it
// when the screen locks or the user switches apps. Best-effort — iOS Safari
// still suspends the tab shortly after lock (no web workaround exists).
export function useYouTubePlayer() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"all" | "one" | "off">("all");
  const [durations, setDurations] = useState<Record<string, number>>({});

  // Per-song playback memory (maps song.id to last saved timestamp in seconds)
  const songProgressMap = useRef<Record<string, number>>({});
  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentSongRef = useRef<Song | null>(null);
  const currentIndexRef = useRef<number | null>(null);
  const isPlayingRef = useRef(true);
  const songsRef = useRef<Song[]>([]);
  songsRef.current = songs;
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingVideoRef = useRef<string | null>(null);
  const pendingPlayRef = useRef(false);
  const loadedVideoRef = useRef<string | null>(null);
  const shuffleRef = useRef(shuffle);
  shuffleRef.current = shuffle;
  const repeatModeRef = useRef(repeatMode);
  repeatModeRef.current = repeatMode;
  const userInteractedRef = useRef(false);
  const isChangingVideoRef = useRef(false);

  const currentSong =
    currentIndex !== null && songs[currentIndex] ? songs[currentIndex] : songs[0];
  currentSongRef.current = currentSong;
  currentIndexRef.current = currentIndex;

  // Un-mute and start audio playback on the user's first document interaction to bypass browser autoplay restrictions
  useEffect(() => {
    const unlockAudio = () => {
      userInteractedRef.current = true;
      const player = playerRef.current;
      if (player) {
        try {
          player.unMute();
          player.setVolume(Math.round(volume * 100));
          player.playVideo();
          isPlayingRef.current = true;
          setIsPlaying(true);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("click", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("click", unlockAudio);
    };
  }, [volume]);

  // Load all music sources (playlists + individual videos/URLs)
  useEffect(() => {
    let cancelled = false;

    const trackToSong = (
      track: { id: string; title: string; artist: string; thumbnail: string },
      idx: number,
    ): Song => {
      const palette = DISC_PALETTE[idx % DISC_PALETTE.length];
      return {
        id: track.id,
        title: track.title,
        artist: track.artist,
        youtubeUrl: `https://www.youtube.com/watch?v=${track.id}`,
        duration: 0,
        disc: {
          baseColor: palette.baseColor,
          accentColor: palette.accentColor,
          coverImg: track.thumbnail,
          doodles: [],
        },
        waveformPeaks: [],
      };
    };

    const promises = MUSIC_SOURCES.map((source) => {
      const playlistId = extractPlaylistId(source);
      if (playlistId) {
        return fetch(`/api/youtube/playlist?list=${playlistId}`)
          .then((res) => res.json())
          .then(
            (data: {
              tracks?: { id: string; title: string; artist: string; thumbnail: string }[];
            }) => data.tracks ?? [],
          )
          .catch(() => [] as { id: string; title: string; artist: string; thumbnail: string }[]);
      }

      const videoId = extractVideoId(source);
      if (videoId) {
        const fullUrl = source.startsWith("http")
          ? source
          : `https://www.youtube.com/watch?v=${videoId}`;
        return fetch(`/api/youtube/meta?url=${encodeURIComponent(fullUrl)}`)
          .then((res) => res.json())
          .then((data: { title?: string; artist?: string; thumbnail?: string }) => [
            {
              id: videoId,
              title: data.title || `Track ${videoId.slice(0, 6)}`,
              artist: data.artist || "YouTube Artist",
              thumbnail:
                data.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            },
          ])
          .catch(() => [
            {
              id: videoId,
              title: `Track ${videoId.slice(0, 6)}`,
              artist: "YouTube",
              thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            },
          ]);
      }

      return Promise.resolve([]);
    });

    Promise.all(promises).then((results) => {
      if (cancelled) return;
      const allTracks = results.flat();
      // Deduplicate by video ID
      const seen = new Set<string>();
      const unique = allTracks.filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
      if (unique.length) {
        setSongs(unique.map((t, i) => trackToSong(t, i)));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Add a song dynamically (used by the easter egg)
  const addSong = useCallback((videoId: string, title: string, artist: string) => {
    setSongs((prev) => {
      if (prev.some((s) => s.id === videoId)) return prev; // already exists
      const palette = DISC_PALETTE[prev.length % DISC_PALETTE.length];
      const newSong: Song = {
        id: videoId,
        title,
        artist,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        duration: 0,
        disc: {
          baseColor: palette.baseColor,
          accentColor: palette.accentColor,
          coverImg: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          doodles: [],
        },
        waveformPeaks: [],
      };
      return [...prev, newSong];
    });
  }, []);

  // Initialize YouTube IFrame player
  useEffect(() => {
    loadYouTubeAPI().then(() => {
      if (!containerRef.current || playerCreated) return;
      playerCreated = true;

      const player = new (window as any).YT.Player("yt-player-container", {
        height: "0",
        width: "0",
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
        },
        events: {
          onReady: () => {
            playerRef.current = player as YTPlayer;
            playerRef.current.setVolume(Math.round(volume * 100));

            // A track was selected before the player finished booting
            const videoId =
              pendingVideoRef.current ??
              (() => {
                const s = songsRef.current[0];
                return s ? extractVideoId(s.youtubeUrl) : null;
              })();

            if (videoId) {
              pendingVideoRef.current = null;
              loadedVideoRef.current = videoId;
              player.loadVideoById(videoId);
            }

            if (pendingPlayRef.current) {
              pendingPlayRef.current = false;
              player.playVideo();
            }

            // If the browser blocked the autoplay attempt, reflect reality:
            // flip the UI to paused unless playback is actually ongoing.
            const autoplayCheck = setInterval(() => {
              if (userInteractedRef.current) {
                clearInterval(autoplayCheck);
                return;
              }
              const state = playerRef.current?.getPlayerState();
              if (state === YT_STATE.PLAYING) {
                clearInterval(autoplayCheck);
              } else if (
                state === YT_STATE.PAUSED ||
                state === YT_STATE.CUED ||
                state === YT_STATE.ENDED
              ) {
                isPlayingRef.current = false;
                setIsPlaying(false);
                clearInterval(autoplayCheck);
              }
            }, 250);
            setTimeout(() => {
              clearInterval(autoplayCheck);
              const state = playerRef.current?.getPlayerState();
              if (state !== YT_STATE.PLAYING) {
                isPlayingRef.current = false;
                setIsPlaying(false);
              }
            }, 8000);
          },
          onStateChange: (event: { data: number }) => {
            if (event.data === YT_STATE.PLAYING) {
              isChangingVideoRef.current = false;
              isPlayingRef.current = true;
              setIsPlaying(true);
            } else if (event.data === YT_STATE.PAUSED) {
              if (isChangingVideoRef.current || isPlayingRef.current) {
                try {
                  playerRef.current?.playVideo();
                } catch {
                  // ignore
                }
              } else {
                isPlayingRef.current = false;
                setIsPlaying(false);
              }
            } else if (
              event.data === YT_STATE.CUED ||
              event.data === YT_STATE.BUFFERING
            ) {
              if (isPlayingRef.current && playerRef.current) {
                try {
                  playerRef.current.playVideo();
                } catch {
                  // ignore
                }
              }
            } else if (event.data === YT_STATE.ENDED) {
              // Auto-advance like a real CD player, honoring repeat/shuffle
              if (currentSongRef.current) {
                songProgressMap.current[currentSongRef.current.id] = 0;
              }
              const from = currentIndexRef.current;

              if (repeatModeRef.current === "one") {
                playerRef.current?.seekTo(0, true);
                playerRef.current?.playVideo();
                return;
              }

              const target = pickNextIndexRef.current(from);
              if (target === null) {
                isPlayingRef.current = false;
                setIsPlaying(false);
                setCurrentIndex(null);
                return;
              }
              setCurrentIndex(target);
              setIsPlaying(true);
            }
          },
          onError: () => {
            // A track the owner blocked for embedding: skip to the next one
            setCurrentIndex((prev) =>
              prev !== null ? (prev + 1) % songs.length : 0,
            );
            setIsPlaying(true);
          },
        },
      });
    });

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll current time while playing
  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        const player = playerRef.current;
        if (!player) return;
        const time = player.getCurrentTime();
        const dur = player.getDuration();
        setProgress(time);
        if (dur > 0) {
          setDuration(dur);
          if (currentSongRef.current) {
            setDurations((prev) =>
              prev[currentSongRef.current!.id] === dur
                ? prev
                : { ...prev, [currentSongRef.current!.id]: dur },
            );
          }
        }
        if (currentSongRef.current) {
          songProgressMap.current[currentSongRef.current.id] = time;
        }
      }, 250);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying]);

  // Sync YouTube source & restore midway playback position when active song changes
  useEffect(() => {
    const player = playerRef.current;
    if (!currentSong) {
      if (player) player.pauseVideo();
      setIsPlaying(false);
      isPlayingRef.current = false;
      setProgress(0);
      setDuration(0);
      return;
    }

    const videoId = extractVideoId(currentSong.youtubeUrl);
    if (!videoId) return;

    if (!player) {
      // Player still booting: queue the track for when onReady fires
      pendingVideoRef.current = videoId;
      pendingPlayRef.current = true;
      return;
    }

    if (loadedVideoRef.current !== videoId) {
      loadedVideoRef.current = videoId;
      player.loadVideoById(videoId);
    }

    if (isPlayingRef.current) {
      player.playVideo();
    }

    const savedTime = songProgressMap.current[currentSong.id] || 0;

    // Restore saved position once the new video is ready
    const attempts = 20;
    let tries = 0;
    const restoreInterval = setInterval(() => {
      tries += 1;
      if (player.getDuration() > 0) {
        if (savedTime > 0 && savedTime < player.getDuration()) {
          player.seekTo(savedTime, true);
          setProgress(savedTime);
        }
        setDuration(player.getDuration());
        clearInterval(restoreInterval);
      } else if (tries >= attempts) {
        clearInterval(restoreInterval);
      }
    }, 200);
  }, [currentIndex, songs, currentSong]);

  // Sync play/pause with the YouTube player
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !currentSong) return;

    if (isPlaying) {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, [isPlaying, currentSong]);

  // Sync volume & mute
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    player.setVolume(Math.round((isMuted ? 0 : volume) * 100));
  }, [volume, isMuted]);

  const playIndex = useCallback((idx: number) => {
    userInteractedRef.current = true;
    isChangingVideoRef.current = true;
    isPlayingRef.current = true;
    setCurrentIndex(idx);
    setIsPlaying(true);

    const targetSong = songsRef.current[idx];
    if (targetSong && playerRef.current) {
      const videoId = extractVideoId(targetSong.youtubeUrl);
      if (videoId) {
        loadedVideoRef.current = videoId;
        try {
          playerRef.current.unMute();
          playerRef.current.loadVideoById(videoId);
          playerRef.current.playVideo();
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const play = useCallback(
    (songId: string) => {
      const idx = songs.findIndex((s) => s.id === songId);
      if (idx === -1) return;
      playIndex(idx);
    },
    [songs, playIndex],
  );

  // Select a track from the playlist: always play immediately, from the start,
  // regardless of the player's previous state or saved position.
  const playFromStart = useCallback((idx: number) => {
    const targetSong = songsRef.current[idx];
    if (!targetSong) return;
    userInteractedRef.current = true;
    songProgressMap.current[targetSong.id] = 0;
    isChangingVideoRef.current = true;
    isPlayingRef.current = true;
    setCurrentIndex(idx);
    setIsPlaying(true);

    const player = playerRef.current;
    if (!player) return;
    const videoId = extractVideoId(targetSong.youtubeUrl);
    if (!videoId) return;

    if (loadedVideoRef.current !== videoId) {
      loadedVideoRef.current = videoId;
      try {
        player.unMute();
        player.loadVideoById(videoId);
      } catch {
        // ignore
      }
    } else {
      try {
        player.seekTo(0, true);
      } catch {
        // ignore
      }
    }
    try {
      player.playVideo();
    } catch {
      // ignore
    }
  }, []);

  // Next index honoring shuffle + repeat; null = stop (repeat off, at end)
  const pickNextIndex = useCallback((fromIdx: number | null): number | null => {
    const total = songs.length;
    if (!total) return null;
    if (shuffleRef.current) {
      const others = Array.from({ length: total }, (_, i) => i).filter(
        (i) => i !== fromIdx,
      );
      return others[Math.floor(Math.random() * others.length)] ?? 0;
    }
    if (fromIdx === null) return 0;
    if (fromIdx + 1 >= total) {
      return repeatModeRef.current === "off" ? null : 0;
    }
    return fromIdx + 1;
  }, [songs.length]);

  const pickNextIndexRef = useRef(pickNextIndex);
  pickNextIndexRef.current = pickNextIndex;

  const togglePlay = useCallback(() => {
    if (!currentSong) {
      playIndex(0);
      return;
    }
    userInteractedRef.current = true;
    setIsPlaying((prev) => {
      const nextState = !prev;
      isPlayingRef.current = nextState;
      if (playerRef.current) {
        if (nextState) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      }
      return nextState;
    });
  }, [currentSong, playIndex]);

  const next = useCallback(() => {
    if (!songs.length) return;
    userInteractedRef.current = true;
    const from = currentIndexRef.current;
    const target = pickNextIndex(from);
    if (target === null) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setCurrentIndex(null);
      return;
    }
    isPlayingRef.current = true;
    setCurrentIndex(target);
    setIsPlaying(true);
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
  }, [songs.length, pickNextIndex]);

  const prev = useCallback(() => {
    if (!songs.length) return;
    userInteractedRef.current = true;
    const from = currentIndexRef.current;
    const target =
      from === null
        ? songs.length - 1
        : shuffleRef.current
          ? pickNextIndex(from)
          : (from - 1 + songs.length) % songs.length;
    if (target === null) return;
    isPlayingRef.current = true;
    setCurrentIndex(target);
    setIsPlaying(true);
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
  }, [songs.length, pickNextIndex]);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => !prev);
  }, []);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) =>
      prev === "all" ? "one" : prev === "one" ? "off" : "all",
    );
  }, []);

  const seek = useCallback(
    (time: number) => {
      const player = playerRef.current;
      if (!player || !currentSong) return;
      player.seekTo(time, true);
      setProgress(time);
      songProgressMap.current[currentSong.id] = time;
    },
    [currentSong],
  );

  const eject = useCallback(() => {
    if (playerRef.current && currentSongRef.current) {
      songProgressMap.current[currentSongRef.current.id] =
        playerRef.current.getCurrentTime();
    }
    pendingVideoRef.current = null;
    pendingPlayRef.current = false;
    setCurrentIndex(null);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
  }, []);

  const handleVolumeChange = useCallback(
    (vol: number) => {
      setVolume(vol);
      if (vol > 0 && isMuted) {
        setIsMuted(false);
      }
    },
    [isMuted],
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return {
    songs,
    currentSong,
    currentIndex,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    shuffle,
    repeatMode,
    durations,
    containerRef,
    setCurrentIndex,
    setIsPlaying,
    play,
    playIndex,
    playFromStart,
    togglePlay,
    next,
    prev,
    seek,
    eject,
    toggleShuffle,
    cycleRepeatMode,
    setVolume: handleVolumeChange,
    toggleMute,
    addSong,
  };
}