import React, { useRef, useEffect } from 'react';

interface LiveSpectrogramProps {
  /** Frequency bin data (Uint8Array, 0–255) from AnalyserNode */
  frequencyData: Uint8Array | null;
  /** Whether the recorder is actively capturing audio */
  isActive: boolean;
  /** Number of bars to render (default 32 — balanced density) */
  numBars?: number;
  /** Height of the canvas in px */
  height?: number;
  className?: string;
}

const VIOLET_LOW = [109, 40, 217];   // violet-700
const VIOLET_HIGH = [196, 181, 253]; // violet-300
const SILENT_COLOR = [30, 30, 50];   // near-black for idle bars

function lerp(a: number[], b: number[], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

export const LiveSpectrogram: React.FC<LiveSpectrogramProps> = ({
  frequencyData,
  isActive,
  numBars = 32,
  height = 48,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const prevBarsRef = useRef<number[]>(new Array(numBars).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const BAR_GAP = 2;
    const BAR_W = Math.floor((W - (numBars - 1) * BAR_GAP) / numBars);

    const render = () => {
      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < numBars; i++) {
        let rawValue = 0;

        if (isActive && frequencyData && frequencyData.length > 0) {
          // Sample a chunk of bins per bar (low–mid freq emphasis)
          const binsPerBar = Math.floor((frequencyData.length * 0.6) / numBars);
          const startBin = i * binsPerBar;
          let sum = 0;
          for (let b = startBin; b < startBin + binsPerBar; b++) {
            sum += frequencyData[b] ?? 0;
          }
          rawValue = sum / (binsPerBar * 255); // normalised [0, 1]
        }

        // Smooth with previous frame — attack fast, decay slow
        const prev = prevBarsRef.current[i];
        const smoothed = rawValue > prev
          ? rawValue * 0.6 + prev * 0.4
          : rawValue * 0.15 + prev * 0.85;
        prevBarsRef.current[i] = smoothed;

        const barH = Math.max(2, smoothed * H);
        const x = i * (BAR_W + BAR_GAP);
        const y = H - barH;

        ctx.fillStyle = isActive ? lerp(VIOLET_LOW, VIOLET_HIGH, smoothed) : `rgb(${SILENT_COLOR.join(',')})`;
        // Rounded top edges
        const radius = Math.min(BAR_W / 2, 3);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + BAR_W - radius, y);
        ctx.quadraticCurveTo(x + BAR_W, y, x + BAR_W, y + radius);
        ctx.lineTo(x + BAR_W, y + barH);
        ctx.lineTo(x, y + barH);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    };
  }, [frequencyData, isActive, numBars, height]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={height}
      className={`w-full rounded-lg ${className}`}
      aria-hidden="true"
    />
  );
};
