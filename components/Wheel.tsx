"use client";

import { useEffect, useRef } from "react";
import type { Entry } from "@/lib/types";

const COLORS = ["#C6FF3D", "#131313", "#FF3D8A", "#0A0A0A"];

interface WheelProps {
  entries: Entry[];
  rotation: number; // grados acumulados, controlado por el padre
  size?: number; // resolución interna del canvas (no el tamaño visual)
  className?: string; // controla el tamaño visual, ej. "w-[260px] lg:w-[320px]"
}

export default function Wheel({ entries, rotation, size = 380, className = "w-[280px] sm:w-[320px] lg:w-[340px]" }: WheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const r = size / 2;
    ctx.clearRect(0, 0, size, size);

    if (entries.length === 0) {
      ctx.fillStyle = "#1a1a17";
      ctx.beginPath();
      ctx.arc(r, r, r - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#555";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("sin participantes", r, r);
      return;
    }

    const segAngle = (Math.PI * 2) / entries.length;
    const showLabels = entries.length <= 110;
    const labelFontSize =
      entries.length > 90 ? 5 : entries.length > 60 ? 6 : entries.length > 40 ? 7 : entries.length > 24 ? 8 : entries.length > 12 ? 9 : 10;

    entries.forEach((en, i) => {
      const start = i * segAngle;
      const end = start + segAngle;
      ctx.beginPath();
      ctx.moveTo(r, r);
      ctx.arc(r, r, r - 4, start, end);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "#0A0A0A";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (showLabels) {
        ctx.save();
        ctx.translate(r, r);
        const mid = start + segAngle / 2;
        ctx.rotate(mid);
        const bg = COLORS[i % COLORS.length];
        ctx.fillStyle = bg === "#131313" || bg === "#0A0A0A" ? "#F2F2ED" : "#0A0A0A";
        ctx.font = `${labelFontSize}px monospace`;
        const maxChars = entries.length > 90 ? 4 : entries.length > 60 ? 5 : entries.length > 40 ? 7 : entries.length > 24 ? 9 : 12;
        const label = en.name.length > maxChars ? en.name.slice(0, maxChars - 1) + "…" : en.name;

        // En la mitad izquierda del círculo el texto queda de cabeza si no se
        // corrige: se le da media vuelta extra y se dibuja del otro lado.
        const flip = mid > Math.PI / 2 && mid < (3 * Math.PI) / 2;
        if (flip) {
          ctx.rotate(Math.PI);
          ctx.textAlign = "left";
          ctx.fillText(label, -(r - 10), 4);
        } else {
          ctx.textAlign = "right";
          ctx.fillText(label, r - 10, 4);
        }
        ctx.restore();
      }
    });
  }, [entries, size]);

  return (
    <div className={`relative aspect-square ${className}`}>
      <div
        className="absolute left-1/2 -top-1.5 z-10 -translate-x-1/2"
        style={{
          width: 0,
          height: 0,
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderTop: "16px solid #FF3D8A",
        }}
      />
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="w-full h-full"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: "transform 4.5s cubic-bezier(.15,.8,.15,1)",
        }}
      />
    </div>
  );
}
