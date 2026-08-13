import type { Metadata } from "next";
import MusicWidget from "@/components/music/MusicWidget";
import { OnlineUsersBadge } from "@/components/music/OnlineUsersBadge";
import { HeaderTitleBadge } from "@/components/music/HeaderTitleBadge";
import "@/styles/music.css";

export const metadata: Metadata = {
  title: "Music | Koshur Music",
  description:
    "A collection of songs I love, presented as an interactive physical CD player.",
};

export default function MusicPage() {
  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 flex flex-col items-center relative pb-40 sm:pb-36">
      <div className="max-w-5xl mx-auto w-full flex flex-col flex-1">
        {/* Header */}
        <header className="pb-6 flex items-center justify-between flex-wrap gap-2">
          <OnlineUsersBadge />
          <HeaderTitleBadge />
        </header>

        {/* Hero Title Area — fills the space between header and dock,
            vertically centered so no dead gap sits in the middle */}
        <div className="text-center my-6 sm:my-16 space-y-3 sm:space-y-4 relative px-2 flex-1 flex flex-col items-center justify-center">
          {/* Dark vignette behind text for readability */}
          <div className="absolute inset-0 -inset-x-8 sm:-inset-x-16 -inset-y-8 sm:-inset-y-12 bg-black/30 rounded-3xl blur-3xl pointer-events-none" />
          <p className="relative text-[10px] sm:text-xs font-mono text-white/80 tracking-[0.3em] sm:tracking-[0.35em] uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
            from the valley
          </p>
          <h1
            className="relative font-fraunces italic font-medium text-4xl xs:text-5xl sm:text-6xl md:text-7xl text-white leading-[1.05] tracking-tight"
            style={{
              textShadow:
                "0 2px 12px rgba(0,0,0,0.7), 0 4px 32px rgba(0,0,0,0.5)",
            }}
          >
            Koshur Music
          </h1>
          <p
            className="relative text-xs sm:text-base font-outfit text-white/90 font-light max-w-xs sm:max-w-sm mx-auto leading-relaxed"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}
          >
            A love letter to Kashmir&apos;s soundscape.{" "}
            <br className="hidden sm:inline" />
            Pick a disc below and let it play.
          </p>
        </div>

        {/* Fixed Bottom Glass Dock Widget */}
        <MusicWidget />

        {/* Minimal Distraction-Free Bottom Corner Attribution */}
        <a
          href="https://fahadandrabi.tech"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-2.5 right-3 sm:right-4 z-40 text-[10px] font-mono text-white/35 hover:text-amber-400 transition-colors pointer-events-auto select-none px-2 py-0.5 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-sm border border-white/10 hover:border-amber-400/30 shadow-xs"
          title="Designed & Developed by Fahad Andrabi"
        >
          Fahad Andrabi
        </a>
      </div>
    </div>
  );
}
