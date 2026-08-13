# 🎵 Koshur Music (کُشُر مِیوزِک)

> *A love letter to Kashmir's soundscape — presented as an interactive physical CD & vinyl player.*

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-amber?style=for-the-badge)](LICENSE)

**Koshur Music** is an aesthetic web-based music experience designed to showcase traditional and modern Kashmiri music. Built around the tactile nostalgia of physical media, users can select, drag, spin, and play CD vinyl discs from a curated collection or dynamically load any YouTube playlist.

---

## ✨ Features

- 📀 **Interactive CD & Vinyl Deck**: Realistic vinyl record aesthetics with dynamic disc art, rotating platter animations, drag-and-drop song loading, and animated soundwave scrubbers.
- 🎧 **YouTube Streaming Engine**: Seamlessly streams audio via YouTube's official IFrame Player API with real-time progress tracking, scrubbing, repeat, shuffle, and volume controls.
- 🔗 **Instant Playlist Ingestion**: Add any YouTube playlist or video URL by simply adding it to `MUSIC_SOURCES`—metadata (titles, artists, thumbnails) is fetched automatically via oEmbed & RSS APIs.
- 🪄 **Secret "A-D-D" Easter Egg**: Type `A-D-D`, press `Ctrl+Shift+A` (`Cmd+Shift+A`), or click the header badge to open an in-app song submission dialog.
- 👥 **Live Listener Presence**: Real-time heartbeat API (`/api/presence`) tracking concurrent listeners online.
- ⚡ **Responsive Glassmorphism Bento Dock**: Floating bottom player dock optimized for desktop and mobile viewports.
- 💔 **Interactive 404 "Broken Record"**: Custom error page featuring a physically split 2-piece broken vinyl record with interactive needle-scratch sound synthesis.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Styling**: Vanilla CSS Design System + Tailwind CSS v4
- **Icons**: [Lucide React](https://lucide.dev/)
- **Audio & Media**: YouTube IFrame API + Web Audio API (sound synthesis)
- **Language**: TypeScript

---

## 🚀 Getting Started

### Prerequisites

Ensure you have **Node.js 18.0** or higher installed on your system.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/SyedFahad-CS/koshurmusic.git
   cd koshurmusic
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to experience the player.

---

## 🎵 Adding Songs & Playlists

Adding new music to Koshur Music requires **zero manual data entry**. Simply paste raw YouTube video or playlist links:

Open [`src/data/songs.ts`](src/data/songs.ts) and add YouTube URLs to the `MUSIC_SOURCES` array:

```typescript
export const MUSIC_SOURCES: string[] = [
  "https://www.youtube.com/watch?v=5H-BJKdtT50",
  "https://www.youtube.com/playlist?list=PL64JoX5IBpa4vWEZgN5VDMseGNbxctTeA",
  "https://www.youtube.com/watch?v=rn9aNVsABvc",
];
```

The application automatically fetches metadata (track title, channel/artist name, high-resolution thumbnail) and builds procedural waveform signatures.

---

## 👨‍💻 Author & Attribution

Created with ❤️ by **Fahad Andrabi**.

- Website: [fahadandrabi.tech](https://fahadandrabi.tech)
- GitHub: [@SyedFahad-CS](https://github.com/SyedFahad-CS)

---

## ⚠️ Content Ownership & Contact / Removal Notice

All audio and video content streamed through **Koshur Music** is hosted on YouTube and embedded via YouTube's official IFrame Player API in accordance with YouTube Developer Terms of Service. All rights, intellectual property, and copyright belong strictly to their respective content creators, artists, and record labels.

**Notice to Rights Holders:**
If you own the copyright to any audio content or media featured in this project and have any questions, concerns, or wish to request content removal from the curated list, please contact me directly:

- **Contact / Portfolio**: [https://fahadandrabi.tech](https://fahadandrabi.tech)
- **GitHub Issues**: [Open an Issue](https://github.com/SyedFahad-CS/koshurmusic/issues)
