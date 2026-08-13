export interface Doodle {
  type:
    | "spiral"
    | "star"
    | "heart"
    | "mushroom"
    | "moon"
    | "sun"
    | "crown"
    | "lightning"
    | "cloud"
    | "wave"
    | "line"
    | "dot"
    | "squiggle"
    | "circle"
    | "diamond"
    | "bunny"
    | "peace"
    | "smiley"
    | "sparkle";
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  size: number;
  rotation?: number;
  color?: string;
}

export interface DiscArt {
  baseColor: string;
  accentColor: string;
  gradient?: string;
  coverImg?: string;
  coverScale?: number;
  doodles: Doodle[];
  handwrittenText?: string;
  handwrittenPosition?:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "center-top"
    | "center-bottom";
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  youtubeUrl: string;
  duration: number;
  disc: DiscArt;
  waveformPeaks: number[];
}

// ─── Music Sources ───────────────────────────────────────────
// Simply paste any YouTube playlist URLs/IDs or video URLs/IDs here.
// Metadata (titles, artists, thumbnails) is automatically fetched!
export const MUSIC_SOURCES: string[] = [
  "https://www.youtube.com/watch?v=5H-BJKdtT50",
  "https://www.youtube.com/playlist?list=PL64JoX5IBpa4vWEZgN5VDMseGNbxctTeA",
  "https://www.youtube.com/watch?v=rn9aNVsABvc",
  "https://www.youtube.com/watch?v=0e4ZuNvcXqM",
  "https://www.youtube.com/watch?v=EL-hMaWoLlk&list=RDEM8mb3_s6nix7KFi10dSph0Q&start_radio=1&rv=iGoE8Pi-Rfo",

  // Add more YouTube playlist URLs or video URLs below:
  // "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
];

// Disc label colors, cycled across the playlist tracks.
export const DISC_PALETTE: { baseColor: string; accentColor: string }[] = [
  { baseColor: "#06b6d4", accentColor: "#0891b2" },
  { baseColor: "#f59e0b", accentColor: "#d97706" },
  { baseColor: "#8b5cf6", accentColor: "#7c3aed" },
  { baseColor: "#ec4899", accentColor: "#db2777" },
  { baseColor: "#10b981", accentColor: "#059669" },
  { baseColor: "#f43f5e", accentColor: "#e11d48" },
];
