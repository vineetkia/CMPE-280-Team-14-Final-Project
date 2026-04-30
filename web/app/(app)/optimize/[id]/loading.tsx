"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Eyebrow } from "@/components/ui/eyebrow";
import { tween, DUR, EASE_OUT, Stagger, StaggerItem } from "@/components/motion";

const STEPS = [
  "Parsing source résumé",
  "Aligning with JD keywords",
  "Quantifying bullets",
  "Annotating diff",
] as const;

// Auto-advance through the steps so the panel feels alive even though
// the actual work happens server-side. Total ~24s — matches typical Opus latency.
const STEP_MS = 6000;

export default function Loading() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, STEP_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 360px", minHeight: "100vh" }}>
      <div style={{ borderRight: "1px solid var(--hairline)", padding: 32, display: "flex", flexDirection: "column", gap: 18 }}>
        <Eyebrow>Sections</Eyebrow>
        <Stagger>
          {[1, 2, 3, 4, 5].map((i) => (
            <StaggerItem key={i}>
              <Skeleton style={{ height: 36, width: "100%" }} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
      <div style={{ background: "var(--bg-sunk)", padding: 48, display: "flex", justifyContent: "center" }}>
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tween(DUR.slow, EASE_OUT)}
          style={{
            width: 720,
            padding: "44px 56px",
            background: "#fffdf7",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <Skeleton style={{ height: 36, width: "60%" }} />
          <Skeleton style={{ height: 12, width: "80%" }} />
          <div style={{ height: 1, background: "var(--ink)", margin: "8px 0" }} />
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} style={{ height: 14, width: i % 2 === 0 ? "92%" : "78%" }} />
          ))}
        </motion.div>
      </div>
      <div style={{ borderLeft: "1px solid var(--hairline)", padding: 32, display: "flex", flexDirection: "column", gap: 14 }}>
        <Eyebrow>Generating draft</Eyebrow>
        {STEPS.map((label, i) => {
          const state =
            i < activeStep ? "done" : i === activeStep ? "active" : "pending";
          return (
            <motion.div
              key={i}
              animate={{
                opacity: state === "pending" ? 0.45 : 1,
              }}
              transition={tween(DUR.base, EASE_OUT)}
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <motion.span
                animate={{
                  background: state === "done" ? "var(--ink)" : "transparent",
                  borderColor:
                    state === "done"
                      ? "var(--ink)"
                      : state === "active"
                        ? "var(--accent)"
                        : "var(--hairline-3)",
                  color: state === "done" ? "var(--bg)" : "var(--ink)",
                }}
                transition={tween(DUR.slow, EASE_OUT)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 50,
                  border: "1px solid",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 10,
                  position: "relative",
                }}
              >
                {state === "done" ? "✓" : ""}
                {state === "active" && (
                  <motion.span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: -2,
                      borderRadius: 50,
                      border: "1.25px solid var(--accent)",
                    }}
                    animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </motion.span>
              <span
                style={{
                  fontSize: 13,
                  color: state === "pending" ? "var(--ink-4)" : "var(--ink-2)",
                }}
              >
                {label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
