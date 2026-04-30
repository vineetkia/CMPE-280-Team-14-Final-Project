"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { scoreRange } from "@/lib/utils";
import { DUR, EASE_OUT } from "@/components/motion";

/**
 * Animated radial gauge — count up from 0 to value over 1.2s, with the arc
 * stroke drawing in lockstep. We tween a JS number with rAF instead of using
 * framer's `animate()` because we need the integer-rounded text in sync with
 * the arc length.
 */
export function RadialGauge({
  value,
  size = 220,
  label = "Overall",
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const target = Math.max(0, Math.min(100, value));
  const range = scoreRange(value);
  const stroke =
    range === "high" ? "var(--positive)" : range === "mid" ? "var(--warning)" : "var(--negative)";

  const [displayNum, setDisplayNum] = useState(0);
  const duration = DUR.slower * 2 * 1000; // 1200ms

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    // Mirror EASE_OUT (cubic-bezier(0.16, 1, 0.3, 1)) with a cheap approximation —
    // we get the right "fast then settle" feel without pulling in a bezier solver.
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplayNum(Math.round(ease(t) * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  const dash = (c * displayNum) / 100;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`${label}: ${value} out of 100`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--hairline-3)" strokeWidth="2" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="48%"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize={size * 0.34}
        fill="var(--ink)"
        letterSpacing="-0.04em"
      >
        {displayNum}
      </text>
      <text
        x="50%"
        y="68%"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--ink-4)"
        letterSpacing="0.16em"
      >
        {label.toUpperCase()}
      </text>
    </svg>
  );
}
