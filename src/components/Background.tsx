"use client";

import { useState } from "react";

export default function Background() {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <video
      data-bg
      className={`fixed inset-0 w-full h-full object-cover -z-10 pointer-events-none select-none ${
        videoFailed ? "hidden" : ""
      }`}
      src="/hero-desktop.mp4"
      poster="/koshurbackground.png"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      onError={() => setVideoFailed(true)}
      aria-hidden="true"
    />
  );
}