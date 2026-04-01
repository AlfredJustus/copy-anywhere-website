"use client";

import { useEffect, useRef, useId } from "react";

interface SquigglyProgressProps {
  current: number;
  total: number;
}

const VIEW_W = 360;
const VIEW_H = 24;
const CENTER_Y = VIEW_H / 2;
const AMPLITUDE = 7;
const STROKE_W = 6;
const DOT_R = 8;
const SAMPLES = 200;
const ANIM_MS = 600;

/** Fraction of the path over which amplitude ramps from 0 → full. */
const RAMP_IN = 0.12;

/** Max visual fraction — never looks "complete" while still preparing. */
const MAX_VISUAL = 0.9;

/** Amplitude envelope: ramps in smoothly at the start. */
function envelope(t: number): number {
  if (t < RAMP_IN) {
    const r = t / RAMP_IN;
    return r * r * (3 - 2 * r); // smoothstep
  }
  return 1;
}

/** Y-coordinate on the wave at normalised position t ∈ [0,1]. */
function waveY(t: number, cycles: number): number {
  return CENTER_Y + AMPLITUDE * envelope(t) * Math.sin(2 * Math.PI * cycles * t);
}

/** Build a sine-wave path with eased-in amplitude. */
function buildWavePath(cycles: number): string {
  const pts: string[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const x = t * VIEW_W;
    const y = waveY(t, cycles);
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

function ease(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function SquigglyProgress({ current, total }: SquigglyProgressProps) {
  const id = useId();
  const dotRef = useRef<SVGCircleElement>(null);
  const rafRef = useRef(0);
  const prevFrac = useRef(0);

  const cycles = total || 1;
  const rawFraction = total > 0 ? current / total : 0;
  const fraction = rawFraction * MAX_VISUAL;
  const d = buildWavePath(cycles);

  // Animate dot along the wave when fraction changes
  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;

    const from = prevFrac.current;
    const to = fraction;

    // If no change (or first render at 0), just place the dot
    if (from === to) {
      const x = to * VIEW_W;
      const y = waveY(to, cycles);
      dot.setAttribute("cx", x.toFixed(2));
      dot.setAttribute("cy", y.toFixed(2));
      return;
    }

    const start = performance.now();
    cancelAnimationFrame(rafRef.current);

    const tick = (now: number) => {
      const t = Math.min((now - start) / ANIM_MS, 1);
      const f = from + (to - from) * ease(t);
      const x = f * VIEW_W;
      const y = waveY(f, cycles);
      dot.setAttribute("cx", x.toFixed(2));
      dot.setAttribute("cy", y.toFixed(2));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevFrac.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [fraction, cycles]);

  // Clip-rect width mirrors the dot animation
  const clipWidth = fraction * VIEW_W;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width="100%"
      style={{ maxWidth: 360, display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={`sq-clip-${id}`}>
          <rect
            x="0"
            y="0"
            width={clipWidth}
            height={VIEW_H}
            style={{ transition: `width ${ANIM_MS}ms cubic-bezier(0.4,0,0.2,1)` }}
          />
        </clipPath>
      </defs>

      {/* Revealed wave trail */}
      <path
        d={d}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={STROKE_W}
        strokeLinecap="round"
        clipPath={`url(#sq-clip-${id})`}
      />

      {/* Leading dot */}
      <circle
        ref={dotRef}
        cx={0}
        cy={CENTER_Y}
        r={DOT_R}
        fill="var(--accent)"
      />
    </svg>
  );
}
