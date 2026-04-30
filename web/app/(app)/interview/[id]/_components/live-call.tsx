"use client";

/**
 * Demo-mode mock interview.
 *
 * Why this isn't LiveKit anymore: we have ~2 minutes of stage time per demo,
 * which isn't enough for real STT to produce useful analytics. Instead we
 * play four canned questions through Cartesia (the same voice the user
 * chose in the lobby), capture the user's mic for visualizer reactivity
 * only (no transcription), and on End we show the canonical seed-style
 * report that everyone in the room can read.
 *
 * The previous LiveKit-based implementation lives in the git history if we
 * ever want to flip back for a longer demo or production.
 */
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { Job } from "@/lib/types";
import { Eyebrow } from "@/components/ui/eyebrow";
import { tween, DUR, EASE_OUT } from "@/components/motion";

const DURATION_MS = 120_000;

const QUESTIONS = [
  "Hi — thanks for taking the time. Tell me about yourself in sixty seconds.",
  "Walk me through the last project you shipped — what made it hard?",
  "Tell me about a time you had to push back against engineering. What did you do?",
  "Why this role, specifically?",
];

interface TranscriptTurn {
  id: string;
  role: "interviewer" | "candidate";
  text: string;
  t: number;
}

export function LiveCall({
  job: _job,
  voice,
  style: _style,
  interviewId,
}: {
  job: Job;
  voice: string;
  style: string;
  interviewId: string;
}) {
  const router = useRouter();
  const startedRef = useRef<number>(Date.now());

  const [remainingMs, setRemainingMs] = useState(DURATION_MS);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [agentState, setAgentState] = useState<"connecting" | "speaking" | "listening">(
    "connecting",
  );
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [showTranscript, setShowTranscript] = useState(true);
  const [localVolume, setLocalVolume] = useState(0);
  const [agentVolume, setAgentVolume] = useState(0);
  const [showIngestion, setShowIngestion] = useState(false);
  const [ending, startEnd] = useTransition();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ─── Real mic capture for the bottom waveform. ──────────────────────
  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let raf = 0;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) return;
        const ctx = new AudioContext();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        audioCtxRef.current = ctx;
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i]! * data[i]!;
          const rms = Math.sqrt(sum / data.length) / 255;
          setLocalVolume(rms);
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        // Mic denied — visualizer stays at 0 but the demo still works.
      }
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
  }, []);

  // ─── Question scheduler — plays each question through Cartesia in turn. ─
  useEffect(() => {
    let cancelled = false;
    function commitInterviewerTurn(text: string, i: number) {
      const t = Math.floor((Date.now() - startedRef.current) / 1000);
      setTranscript((prev) => {
        if (prev.some((x) => x.id === `q-${i}`)) return prev;
        return [...prev, { id: `q-${i}`, role: "interviewer", text, t }];
      });
      setQuestionIndex(i + 1);
    }
    function scheduleNext(i: number, ms: number) {
      if (cancelled) return;
      // Add a placeholder candidate turn so the user sees their "side" too.
      setTimeout(() => {
        if (cancelled) return;
        const t = Math.floor((Date.now() - startedRef.current) / 1000);
        setTranscript((prev) => [
          ...prev,
          {
            id: `c-${i}`,
            role: "candidate",
            text: "[Your answer is being captured…]",
            t: Math.max(0, t - 6),
          },
        ]);
      }, 1500);
      setTimeout(() => playQuestion(i + 1), ms);
    }
    async function playQuestion(i: number) {
      if (cancelled || i >= QUESTIONS.length) return;
      setAgentState("connecting");
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voice, text: QUESTIONS[i] }),
        });
        if (!res.ok) {
          if (!cancelled) {
            commitInterviewerTurn(QUESTIONS[i]!, i);
            scheduleNext(i, 6000);
          }
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.addEventListener("ended", () => URL.revokeObjectURL(url));

        // Hook a 2nd analyser to the audio element so the orb amplitude is real.
        let raf = 0;
        try {
          const ctx = audioCtxRef.current ?? new AudioContext();
          const src = ctx.createMediaElementSource(audio);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          src.connect(analyser);
          src.connect(ctx.destination);
          const data = new Uint8Array(analyser.frequencyBinCount);
          const tick = () => {
            analyser.getByteFrequencyData(data);
            let sum = 0;
            for (let k = 0; k < data.length; k++) sum += data[k]! * data[k]!;
            const rms = Math.sqrt(sum / data.length) / 255;
            setAgentVolume(rms);
            if (!audio.paused && !audio.ended) raf = requestAnimationFrame(tick);
          };
          audio.addEventListener("play", () => {
            setAgentState("speaking");
            commitInterviewerTurn(QUESTIONS[i]!, i);
            tick();
          });
          audio.addEventListener("ended", () => {
            cancelAnimationFrame(raf);
            setAgentVolume(0);
            setAgentState("listening");
            // Ten seconds of "your turn" before next Q. With ~10s of audio
            // per question, total budget = 4 × 20s = 80s, plus settling.
            scheduleNext(i, 10000);
          });
        } catch {
          // Fall back: play without analyser.
          audio.addEventListener("play", () => {
            setAgentState("speaking");
            commitInterviewerTurn(QUESTIONS[i]!, i);
          });
          audio.addEventListener("ended", () => {
            setAgentState("listening");
            scheduleNext(i, 10000);
          });
        }
        await audio.play();
      } catch {
        if (!cancelled) {
          commitInterviewerTurn(QUESTIONS[i]!, i);
          scheduleNext(i, 6000);
        }
      }
    }
    const kickoff = setTimeout(() => playQuestion(0), 600);
    return () => {
      cancelled = true;
      clearTimeout(kickoff);
      audioRef.current?.pause();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice]);

  // ─── Countdown. ─────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      const left = Math.max(0, DURATION_MS - (Date.now() - startedRef.current));
      setRemainingMs(left);
      if (left <= 0) {
        clearInterval(t);
        endInterview();
      }
    }, 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function endInterview() {
    if (ending || showIngestion) return;
    setShowIngestion(true);
    audioRef.current?.pause();
    startEnd(async () => {
      try {
        // Minimum 4 seconds of theater so the animation states all play.
        await Promise.all([
          fetch("/api/interview/demo-report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ interview_id: interviewId }),
          }),
          new Promise((r) => setTimeout(r, 4500)),
        ]);
        router.push(`/performance/${interviewId}`);
      } catch {
        toast.error("Could not finalize report");
        setShowIngestion(false);
      }
    });
  }

  const mins = Math.floor(remainingMs / 60_000);
  const secs = Math.floor((remainingMs % 60_000) / 1000);
  const lowTime = remainingMs <= 30_000;
  const isAgentSpeaking = agentState === "speaking";
  const isAgentListening = agentState === "listening";

  const orbScale = isAgentSpeaking ? 1 + Math.min(0.08, agentVolume * 0.25) : 1;
  const lastInterviewerLine =
    [...transcript].reverse().find((t) => t.role === "interviewer")?.text ?? QUESTIONS[0]!;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#14130e",
        color: "#ece7dc",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grain overlay */}
      <svg
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.4,
          pointerEvents: "none",
          mixBlendMode: "overlay",
        }}
      >
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.06 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Top bar */}
      <div
        style={{
          padding: "20px 32px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          borderBottom: "1px solid #ece7dc14",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 50,
              background: "#d96b56",
              boxShadow: "0 0 12px #d96b56",
            }}
          />
          <span
            className="mono"
            style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#a8a397" }}
          >
            Recording · {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <Eyebrow style={{ color: "#74706a" }}>Question</Eyebrow>
          <span className="serif tnum" style={{ fontSize: 18, letterSpacing: "-0.01em" }}>
            {String(Math.min(questionIndex || 1, 4)).padStart(2, "0")}
          </span>
          <Eyebrow style={{ color: "#74706a" }}>of 04</Eyebrow>
        </div>
        <div style={{ textAlign: "right" }}>
          <motion.span
            className="serif tnum"
            animate={{
              opacity: lowTime ? [1, 0.5, 1] : 1,
              color: lowTime ? "#d97a4a" : "#ece7dc",
            }}
            transition={lowTime ? { duration: 1, repeat: Infinity } : { duration: 0.2 }}
            style={{ fontSize: 22, letterSpacing: "-0.02em", display: "inline-block" }}
          >
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </motion.span>
          <span className="mono" style={{ fontSize: 11, color: "#74706a", marginLeft: 6 }}>
            · remaining
          </span>
        </div>
      </div>

      {/* Center stage */}
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 40, position: "relative" }}>
        <div
          style={{
            position: "relative",
            width: 460,
            height: 460,
            display: "grid",
            placeItems: "center",
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: 1 + (isAgentSpeaking ? agentVolume * 0.06 : 0),
              }}
              transition={{ type: "tween", duration: 0.12, ease: "easeOut" }}
              style={{
                position: "absolute",
                width: 140 + i * 70,
                height: 140 + i * 70,
                borderRadius: "50%",
                border: "1px solid #ece7dc14",
                opacity: 1 - i * 0.18,
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              width: 380,
              height: 380,
              borderRadius: "50%",
              background: "radial-gradient(circle at 40% 35%, #d97a4a44, transparent 65%)",
              filter: "blur(8px)",
            }}
          />
          <motion.div
            animate={{ scale: orbScale }}
            transition={{ type: "tween", duration: 0.08, ease: "linear" }}
            style={{
              position: "absolute",
              width: 240,
              height: 240,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 30%, #f4d4b8, #d97a4a 55%, #9c4a2c 100%)",
              boxShadow:
                "0 0 80px #d97a4a40, inset -20px -30px 60px #00000040, inset 20px 20px 50px #ffffff20",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "radial-gradient(circle, #fff8, transparent 70%)",
              top: 130,
              left: 130,
            }}
          />
          <div style={{ position: "absolute", bottom: -40, textAlign: "center" }}>
            <span
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: isAgentSpeaking ? "#d97a4a" : "#74706a",
              }}
            >
              ●{" "}
              {agentState === "connecting"
                ? "Connecting"
                : isAgentSpeaking
                  ? `${voice} is speaking`
                  : "Listening to you"}
            </span>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 140,
            left: 0,
            right: 0,
            textAlign: "center",
            padding: "0 80px",
          }}
        >
          <motion.div
            key={lastInterviewerLine}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={tween(DUR.slow, EASE_OUT)}
            className="serif"
            style={{ fontSize: 32, lineHeight: 1.2, letterSpacing: "-0.02em", color: "#fff", fontWeight: 400 }}
          >
            “{lastInterviewerLine}”
          </motion.div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          padding: "20px 32px 28px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 24,
          borderTop: "1px solid #ece7dc14",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 50,
              background: "#ece7dc14",
              display: "grid",
              placeItems: "center",
              border: "1px solid #ece7dc20",
            }}
          >
            <Mic size={16} />
          </span>
          <MicWaveform volume={localVolume} />
          <span
            className="mono"
            style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "#74706a" }}
          >
            Your mic · {isAgentSpeaking ? "muted while AI speaks" : isAgentListening ? "open" : "standby"}
          </span>
        </div>

        <button
          type="button"
          onClick={endInterview}
          disabled={ending || showIngestion}
          aria-label="End interview"
          style={{
            width: 78,
            height: 78,
            borderRadius: 50,
            background: "#d96b56",
            color: "#14130e",
            border: "none",
            cursor: ending || showIngestion ? "not-allowed" : "pointer",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 0 0 8px #d96b5614, 0 0 28px #d96b5640",
          }}
        >
          <span style={{ width: 24, height: 24, background: "#14130e", borderRadius: 4 }} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "flex-end" }}>
          <span
            className="mono"
            style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "#74706a" }}
          >
            Live transcript
          </span>
          <button
            type="button"
            className="toggle"
            aria-checked={showTranscript}
            role="switch"
            onClick={() => setShowTranscript((v) => !v)}
            style={{ background: showTranscript ? "#d97a4a" : undefined }}
          />
        </div>
      </div>

      {showTranscript && <FloatingTranscript turns={transcript} voice={voice} />}

      <AnimatePresence>{showIngestion && <IngestionOverlay />}</AnimatePresence>
    </div>
  );
}

// ─── Bottom mic waveform — 22 bars driven by local volume ──────────
function MicWaveform({ volume }: { volume: number }) {
  const bars = 22;
  const heights = Array.from({ length: bars }, (_, i) => {
    const phase = i / bars;
    const base = 3 + Math.sin(phase * Math.PI * 2) * 3 + Math.sin(phase * 8) * 2;
    const live = volume * 18 * (0.5 + 0.5 * Math.sin(phase * Math.PI * 4));
    return Math.max(2, base + live);
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 1.5, height: 18 }}>
      {heights.map((h, i) => (
        <span
          key={i}
          style={{
            width: 2,
            height: h,
            background: "#ece7dc",
            opacity: 0.45 + volume * 0.55,
            borderRadius: 1,
            transition: "height 80ms linear, opacity 120ms linear",
          }}
        />
      ))}
    </div>
  );
}

// ─── Floating glass transcript card ────────────────────────────────
function FloatingTranscript({ turns, voice }: { turns: TranscriptTurn[]; voice: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns.length]);
  return (
    <div
      ref={scrollerRef}
      style={{
        position: "absolute",
        left: 32,
        top: 100,
        width: 320,
        background: "#1c1a1480",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid #ece7dc14",
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxHeight: 380,
        overflowY: "auto",
        zIndex: 3,
      }}
    >
      <Eyebrow style={{ color: "#74706a" }}>Live transcript</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, lineHeight: 1.55 }}>
        {turns.length === 0 && (
          <span style={{ color: "#74706a", fontStyle: "italic" }}>Waiting for the first turn…</span>
        )}
        {turns.map((t) => {
          const isInt = t.role === "interviewer";
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={tween(DUR.slow, EASE_OUT)}
            >
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  color: isInt ? "#d97a4a" : "#a8a397",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                {isInt ? voice : "You"} · {Math.floor(t.t / 60)}:
                {String(t.t % 60).padStart(2, "0")}
              </span>
              <p style={{ margin: "2px 0 0", color: isInt ? "#d8d3c5" : "#ece7dc" }}>{t.text}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Ingestion overlay — shown while we "process" the demo report. ──────
function IngestionOverlay() {
  const stages = [
    "Capturing transcript",
    "Analyzing answers",
    "Scoring dimensions",
    "Generating report",
  ];
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStage((s) => Math.min(s + 1, stages.length - 1)), 1000);
    return () => clearInterval(t);
  }, [stages.length]);
  return (
    <motion.div
      key="ingest"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,19,14,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 100,
        display: "grid",
        placeItems: "center",
        color: "#ece7dc",
      }}
    >
      <div style={{ width: 460, maxWidth: "90vw", textAlign: "center" }}>
        {/* Pulsing core */}
        <div style={{ position: "relative", height: 140, display: "grid", placeItems: "center" }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6, ease: "easeInOut" }}
              style={{
                position: "absolute",
                width: 100,
                height: 100,
                borderRadius: "50%",
                border: "1px solid #d97a4a",
              }}
            />
          ))}
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 35% 30%, #f4d4b8, #d97a4a 55%, #9c4a2c 100%)",
              boxShadow: "0 0 60px #d97a4a44",
            }}
          />
        </div>

        <div
          style={{
            marginTop: 20,
            fontFamily: "var(--font-display)",
            fontSize: 24,
            letterSpacing: "-0.02em",
          }}
        >
          <span>Generating your report</span>
          <motion.span
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            …
          </motion.span>
        </div>

        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 8 }}>
          {stages.map((label, i) => {
            const state = i < stage ? "done" : i === stage ? "active" : "pending";
            return (
              <motion.div
                key={i}
                animate={{ opacity: state === "pending" ? 0.4 : 1 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 13,
                  color: state === "pending" ? "#74706a" : "#d8d3c5",
                }}
              >
                <motion.span
                  animate={{
                    background: state === "done" ? "#d97a4a" : "transparent",
                    borderColor:
                      state === "done"
                        ? "#d97a4a"
                        : state === "active"
                          ? "#d97a4a"
                          : "#ece7dc33",
                    color: state === "done" ? "#14130e" : "#ece7dc",
                  }}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 50,
                    border: "1px solid",
                    display: "inline-grid",
                    placeItems: "center",
                    fontSize: 9,
                    flexShrink: 0,
                  }}
                >
                  {state === "done" ? "✓" : ""}
                </motion.span>
                <span>{label}</span>
                {state === "active" && (
                  <motion.span
                    aria-hidden="true"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                    style={{
                      marginLeft: "auto",
                      width: 12,
                      height: 12,
                      border: "1.5px solid #d97a4a",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
