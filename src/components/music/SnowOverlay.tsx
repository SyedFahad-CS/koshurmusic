"use client";

import React, { useEffect, useRef } from "react";

interface SnowOverlayProps {
  isActive: boolean;
}

interface Flake {
  x: number;
  y: number;
  radius: number;
  speed: number;
  wind: number;
  opacity: number;
  oscillation: number;
  oscSpeed: number;
  rotation: number;
  rotSpeed: number;
  type: "powder" | "crystal" | "fluffy";
}

export function SnowOverlay({ isActive }: SnowOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Height map for bottom snowdrift accumulation
    const segments = 120;
    const snowDriftHeights = new Float32Array(segments);
    for (let s = 0; s < segments; s++) {
      snowDriftHeights[s] = 8 + Math.sin(s * 0.12) * 4;
    }
    const maxDriftHeight = 45; // Max accumulation height along the bottom

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);

    // Create 3 layers of realistic snowflakes
    const flakeCount = Math.floor(Math.min(width, 1600) / 6.5);
    const flakes: Flake[] = Array.from({ length: flakeCount }, () => {
      const rand = Math.random();
      let type: Flake["type"] = "powder";
      let radius = 1 + Math.random() * 1.5;
      let speed = 0.8 + Math.random() * 1.2;
      let opacity = 0.25 + Math.random() * 0.45;

      if (rand > 0.65 && rand <= 0.9) {
        type = "crystal";
        radius = 2.5 + Math.random() * 2;
        speed = 1.4 + Math.random() * 1.5;
        opacity = 0.65 + Math.random() * 0.3;
      } else if (rand > 0.9) {
        type = "fluffy";
        radius = 4 + Math.random() * 3.5;
        speed = 2 + Math.random() * 2;
        opacity = 0.8 + Math.random() * 0.2;
      }

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        speed,
        wind: (Math.random() - 0.5) * 0.35,
        opacity,
        oscillation: Math.random() * Math.PI * 2,
        oscSpeed: 0.008 + Math.random() * 0.018,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        type,
      };
    });

    // Draw a 6-armed crystal snowflake
    const drawCrystal = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      radius: number,
      opacity: number,
      rotation: number
    ) => {
      c.save();
      c.translate(x, y);
      c.rotate(rotation);
      c.strokeStyle = `rgba(240, 249, 255, ${opacity})`;
      c.lineWidth = 1;
      c.lineCap = "round";

      for (let i = 0; i < 6; i++) {
        c.rotate(Math.PI / 3);
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(0, radius);

        // Branching arms
        c.moveTo(0, radius * 0.5);
        c.lineTo(radius * 0.3, radius * 0.75);
        c.moveTo(0, radius * 0.5);
        c.lineTo(-radius * 0.3, radius * 0.75);

        c.stroke();
      }
      c.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        f.oscillation += f.oscSpeed;
        f.rotation += f.rotSpeed;

        // Mouse displacement effect
        const dx = f.x - mx;
        const dy = f.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 110) {
          const force = (110 - dist) / 110;
          f.x += (dx / dist) * force * 3.5;
          f.y += (dy / dist) * force * 3.5;
        }

        f.y += f.speed;
        f.x += Math.sin(f.oscillation) * (f.radius * 0.45) + f.wind;

        // Check snow accumulation at bottom
        const segIdx = Math.floor(
          Math.max(0, Math.min(width - 1, f.x)) / (width / (segments - 1))
        );
        const currentDriftH = snowDriftHeights[segIdx] || 0;

        if (f.y >= height - currentDriftH) {
          // Accumulate snow height at this point
          if (snowDriftHeights[segIdx] < maxDriftHeight) {
            const amount = 0.35 * (f.radius / 2);
            snowDriftHeights[segIdx] += amount;

            // Smooth neighbor snow accumulation
            if (segIdx > 0 && snowDriftHeights[segIdx - 1] < maxDriftHeight) {
              snowDriftHeights[segIdx - 1] += amount * 0.5;
            }
            if (
              segIdx < segments - 1 &&
              snowDriftHeights[segIdx + 1] < maxDriftHeight
            ) {
              snowDriftHeights[segIdx + 1] += amount * 0.5;
            }
            if (segIdx > 1 && snowDriftHeights[segIdx - 2] < maxDriftHeight) {
              snowDriftHeights[segIdx - 2] += amount * 0.25;
            }
            if (
              segIdx < segments - 2 &&
              snowDriftHeights[segIdx + 2] < maxDriftHeight
            ) {
              snowDriftHeights[segIdx + 2] += amount * 0.25;
            }
          }

          // Reset snowflake back to top
          f.y = -15;
          f.x = Math.random() * width;
        }

        if (f.type === "powder") {
          // Micro powder flake
          ctx.fillStyle = `rgba(240, 249, 255, ${f.opacity})`;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (f.type === "crystal") {
          // Detailed 6-arm crystal snowflake
          drawCrystal(ctx, f.x, f.y, f.radius * 2.2, f.opacity, f.rotation);
        } else {
          // Fluffy foreground snow with soft radial bokeh glow
          const radialGrad = ctx.createRadialGradient(
            f.x,
            f.y,
            0,
            f.x,
            f.y,
            f.radius * 2
          );
          radialGrad.addColorStop(0, `rgba(255, 255, 255, ${f.opacity})`);
          radialGrad.addColorStop(
            0.5,
            `rgba(224, 242, 254, ${f.opacity * 0.6})`
          );
          radialGrad.addColorStop(1, `rgba(224, 242, 254, 0)`);

          ctx.fillStyle = radialGrad;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.radius * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Accumulated Bottom Snow Drift Mound
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let i = 0; i < segments; i++) {
        const x = (i / (segments - 1)) * width;
        const h = snowDriftHeights[i];
        const y = height - h;

        if (i === 0) {
          ctx.lineTo(x, y);
        } else {
          const prevX = ((i - 1) / (segments - 1)) * width;
          const prevH = snowDriftHeights[i - 1];
          const prevY = height - prevH;
          const cpX = (prevX + x) / 2;
          ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
        }
      }

      ctx.lineTo(width, height);
      ctx.closePath();

      const driftGradient = ctx.createLinearGradient(
        0,
        height - maxDriftHeight,
        0,
        height
      );
      driftGradient.addColorStop(0, "rgba(240, 249, 255, 0.95)");
      driftGradient.addColorStop(0.3, "rgba(224, 242, 254, 0.85)");
      driftGradient.addColorStop(1, "rgba(186, 230, 253, 0.6)");

      ctx.fillStyle = driftGradient;
      ctx.fill();

      // Frosty top stroke line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-700 opacity-95"
      style={{ filter: "drop-shadow(0 0 6px rgba(224,242,254,0.5))" }}
    />
  );
}
