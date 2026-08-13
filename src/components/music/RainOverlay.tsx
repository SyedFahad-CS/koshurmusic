"use client";

import React, { useEffect, useRef } from "react";

interface RainOverlayProps {
  isActive: boolean;
}

interface Drop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  width: number;
}

interface Splatter {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  vx: number;
  vy: number;
}

export function RainOverlay({ isActive }: RainOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const flashRef = useRef(0); // Lightning flash intensity (0 to 1)

  useEffect(() => {
    if (!isActive) return;

    const handleThunder = () => {
      flashRef.current = 0.35; // Trigger subtle 35% sky flash
    };

    window.addEventListener("rain-thunder-strike", handleThunder);

    const canvas = canvasRef.current;
    if (!canvas) return () => window.removeEventListener("rain-thunder-strike", handleThunder);

    const ctx = canvas.getContext("2d");
    if (!ctx) return () => window.removeEventListener("rain-thunder-strike", handleThunder);

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Create rain drops
    const dropCount = Math.floor(Math.min(width, 1400) / 9);
    const drops: Drop[] = Array.from({ length: dropCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 12 + Math.random() * 22,
      speed: 14 + Math.random() * 18,
      opacity: 0.15 + Math.random() * 0.35,
      width: 0.8 + Math.random() * 0.8,
    }));

    const splatters: Splatter[] = [];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render Lightning Sky Flash
      if (flashRef.current > 0.01) {
        ctx.fillStyle = `rgba(224, 242, 254, ${flashRef.current})`;
        ctx.fillRect(0, 0, width, height);
        flashRef.current *= 0.84; // Fast exponential fade out
      }

      // Draw Rain Drops
      ctx.lineCap = "round";

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        d.y += d.speed;
        d.x -= d.speed * 0.12; // slight wind slant

        if (d.y > height) {
          // Reset to top
          d.y = -d.length;
          d.x = Math.random() * (width + 100);

          // Random splash chance at bottom
          if (Math.random() > 0.6) {
            for (let s = 0; s < 2; s++) {
              splatters.push({
                x: d.x,
                y: height - 10,
                radius: 1 + Math.random() * 2,
                opacity: 0.4,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 3 - 1,
              });
            }
          }
        }

        const gradient = ctx.createLinearGradient(
          d.x,
          d.y,
          d.x - d.length * 0.12,
          d.y + d.length
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
        gradient.addColorStop(1, `rgba(186, 230, 253, ${d.opacity})`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = d.width;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.length * 0.12, d.y + d.length);
        ctx.stroke();
      }

      // Draw Splatters
      for (let i = splatters.length - 1; i >= 0; i--) {
        const s = splatters[i];
        s.x += s.vx;
        s.y += s.vy;
        s.opacity -= 0.03;

        if (s.opacity <= 0) {
          splatters.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `rgba(186, 230, 253, ${s.opacity})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-700 opacity-90"
      style={{ filter: "drop-shadow(0 0 2px rgba(186,230,253,0.3))" }}
    />
  );
}
