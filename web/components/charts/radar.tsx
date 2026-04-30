"use client";

import { motion } from "framer-motion";
import { DUR, EASE_OUT, tween } from "@/components/motion";

export function Radar({
  axes,
  size = 260,
  value,
  compare,
}: {
  axes: string[];
  size?: number;
  value: number[]; // 0–1
  compare?: number[]; // 0–1
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 30;
  const n = axes.length;

  const pt = (i: number, v: number): [number, number] => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rr = r * v;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  };
  const polygon = (vals: number[]) => vals.map((v, i) => pt(i, v).join(",")).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <polygon
          key={g}
          points={polygon(Array(n).fill(g))}
          fill="none"
          stroke="var(--hairline-3)"
          strokeWidth="1"
        />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--hairline-2)" strokeWidth="1" />;
      })}
      {compare && compare.length > 0 && (
        <motion.polygon
          points={polygon(compare)}
          fill="var(--ink)"
          fillOpacity="0.04"
          stroke="var(--ink-4)"
          strokeDasharray="3 3"
          strokeWidth="1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...tween(DUR.slow, EASE_OUT), delay: 0.3 }}
        />
      )}
      <motion.polygon
        points={polygon(value)}
        fill="var(--accent)"
        fillOpacity="0.14"
        stroke="var(--accent)"
        strokeWidth="1.5"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        transition={tween(DUR.slower, EASE_OUT)}
      />
      {axes.map((label, i) => {
        const [x, y] = pt(i, 1.18);
        return (
          <motion.text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill="var(--ink-3)"
            letterSpacing="0.1em"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...tween(DUR.base, EASE_OUT), delay: 0.4 + i * 0.04 }}
          >
            {label.toUpperCase()}
          </motion.text>
        );
      })}
      {value.map((v, i) => {
        const [x, y] = pt(i, v);
        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r="3"
            fill="var(--accent)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...tween(DUR.base, EASE_OUT), delay: 0.6 + i * 0.06 }}
          />
        );
      })}
    </svg>
  );
}
