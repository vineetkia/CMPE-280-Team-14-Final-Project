"use client";

/**
 * Live AI interview — Cartesia-only scripted pipeline.
 *
 * Pipeline:
 *   1. Cartesia plays 4 background-themed questions in sequence (~8–10s each).
 *   2. The candidate's mic is streamed to Deepgram Nova-3 over a browser
 *      WebSocket (token minted via /api/deepgram-token).
 *   3. After the 4th question's audio ends + a 20s answer window, the call
 *      auto-ends and routes to the seed performance report.
 *
 * No LiveKit, no real-time agent. The component is intentionally narrow —
 * deterministic question order, fixed timing, predictable end condition.
 */
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { Job } from "@/lib/types";
import { Eyebrow } from "@/components/ui/eyebrow";
import { tween, DUR, EASE_OUT } from "@/components/motion";
import {
  useDeepgramTranscription,
  type TranscriptFragment,
} from "@/lib/hooks/use-deepgram-transcription";

const DURATION_MS = 120_000;

// Background-themed scripted questions for the 2-minute interview. Each is
// short enough that Cartesia takes about 8–10 seconds of audio.
const QUESTIONS = [
  "Hi — thanks for taking the time. To start, tell me about yourself in sixty seconds.",
  "Walk me through your background — your school, your work so far, and what you've shipped.",
  "What technologies are you strongest in, and why did you gravitate toward them?",
  "Last one: why are you looking for a new role right now?",
];


interface TranscriptTurn {
  id: string;
  role: "interviewer" | "candidate";
  text: string;
  t: number;
  final: boolean;
}

export function LiveCall({
  job,
  voice,
  style: _style,
  interviewId,
}: {
  job: Job;
  voice: string;
  style: string;
  interviewId: string;
}) {
  return <ScriptedCall job={job} voice={voice} interviewId={interviewId} />;
}

// ─── ScriptedCall — Cartesia plays 4 questions, Deepgram transcribes ─────
// Short positive acknowledgements played between questions. One per turn, in
// order, after the candidate finishes their answer.
const ACKS = [
  "Got it — thanks for that overview.",
  "Helpful framing. Appreciate the context.",
  "Solid — that's useful detail.",
];
// After the final answer is captured we play this wrap line, then end.
const WRAP = "Thanks — that's all from me.";

// How long to wait after the *last* Deepgram-final fragment before deciding
// the candidate is done speaking (and we should ack + advance).
const SILENCE_AFTER_ANSWER_MS = 1800;
// Minimum word count in the cumulative answer before we consider it real.
const MIN_ANSWER_WORDS = 3;
// If the candidate stays silent this long after the question ends, treat the
// turn as skipped and move on (so the interview can't stall forever).
const NO_ANSWER_TIMEOUT_MS = 25_000;

function ScriptedCall({
  job: _job,
  voice,
  interviewId,
}: {
  job: Job;
  voice: string;
  interviewId: string;
}) {
  const router = useRouter();
  const startedRef = useRef<number>(Date.now());
  const [remainingMs, setRemainingMs] = useState(DURATION_MS);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [agentState, setAgentState] = useState<"connecting" | "speaking" | "listening" | "thinking">("connecting");
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [liveCandidate, setLiveCandidate] = useState<string>("");
  const [showTranscript, setShowTranscript] = useState(true);
  const [localVolume, setLocalVolume] = useState(0);
  const [agentVolume, setAgentVolume] = useState(0);
  const [showIngestion, setShowIngestion] = useState(false);
  const [ending, startEnd] = useTransition();
  // Strict no-fallback mode: if Deepgram fails to open we render a full-card
  // error and don't proceed.
  const [fatalError, setFatalError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const endedRef = useRef(false);
  const activeQuestionRef = useRef(-1);
  // Mutable reference to the latest cumulative answer per question, used by
  // the silence-detection effect that fires after each Deepgram final.
  const answerBufferRef = useRef<Map<number, string>>(new Map());
  // Timer that fires when the candidate has been silent long enough — pulled
  // out so each new final can reset it.
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Continuation that the silence timer should call once silence is reached.
  const onAnswerCompleteRef = useRef<(() => void) | null>(null);
  // Hard cap on how long we wait per question before skipping.
  const noAnswerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearAnswerTimers() {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (noAnswerTimerRef.current) {
      clearTimeout(noAnswerTimerRef.current);
      noAnswerTimerRef.current = null;
    }
  }

  // Mic-amplitude analyser for the bottom waveform.
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
        /* mic denied — visualizer stays at 0 */
      }
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
  }, []);

  const handleFinal = useCallback((frag: TranscriptFragment) => {
    const t = Math.floor((Date.now() - startedRef.current) / 1000);
    const qIdx = activeQuestionRef.current;
    if (qIdx < 0) return;
    setLiveCandidate("");
    setTranscript((prev) => [
      ...prev,
      {
        id: `c-${qIdx}-${frag.id}`,
        role: "candidate",
        text: frag.text,
        t,
        final: true,
      },
    ]);
    // Append to this question's running answer buffer.
    const prev = answerBufferRef.current.get(qIdx) ?? "";
    const next = prev ? `${prev} ${frag.text}` : frag.text;
    answerBufferRef.current.set(qIdx, next);
    // Reset the silence countdown — every new final restarts the clock.
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    const wordCount = next.split(/\s+/).filter(Boolean).length;
    if (wordCount >= MIN_ANSWER_WORDS) {
      silenceTimerRef.current = setTimeout(() => {
        const cb = onAnswerCompleteRef.current;
        if (cb) {
          onAnswerCompleteRef.current = null;
          cb();
        }
      }, SILENCE_AFTER_ANSWER_MS);
    }
  }, []);
  const handleInterim = useCallback((frag: TranscriptFragment) => {
    setLiveCandidate(frag.text);
  }, []);

  const dg = useDeepgramTranscription({
    enabled: true,
    onFinal: handleFinal,
    onInterim: handleInterim,
  });

  // Strict failure mode: Deepgram error → fatalError card.
  useEffect(() => {
    if (dg.error) setFatalError(dg.error);
  }, [dg.error]);
  // Also: if the WS hasn't opened within 6s, give up.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!dg.isActive && !fatalError) {
        setFatalError(
          "Could not connect to the live transcription service in time. Refresh and try again.",
        );
      }
    }, 6000);
    return () => clearTimeout(t);
  }, [dg.isActive, fatalError]);

  // ─── Question loop ───────────────────────────────────────────────────
  // Plays Cartesia clips synchronously and waits for the candidate's answer
  // (Deepgram-final + silence) before advancing. Bails out cleanly on unmount.
  useEffect(() => {
    if (fatalError) return;
    if (!dg.isActive) return; // wait until the transcription stream is open

    let cancelled = false;

    function setActiveQuestion(i: number) {
      activeQuestionRef.current = i;
      setQuestionIndex(i + 1);
    }

    function commitInterviewerTurn(text: string, idForKey: string) {
      const t = Math.floor((Date.now() - startedRef.current) / 1000);
      setTranscript((prev) => {
        if (prev.some((x) => x.id === idForKey)) return prev;
        return [...prev, { id: idForKey, role: "interviewer", text, t, final: true }];
      });
    }

    // Play a Cartesia clip and resolve when the audio finishes (or fails).
    function playClip(text: string, transcriptId: string): Promise<void> {
      return new Promise(async (resolve) => {
        if (cancelled) return resolve();
        setAgentState("connecting");
        try {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ voice, text }),
          });
          if (!res.ok) {
            commitInterviewerTurn(text, transcriptId);
            return resolve();
          }
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.addEventListener("ended", () => URL.revokeObjectURL(url));
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
              setAgentVolume(Math.sqrt(sum / data.length) / 255);
              if (!audio.paused && !audio.ended) raf = requestAnimationFrame(tick);
            };
            audio.addEventListener("play", () => {
              setAgentState("speaking");
              commitInterviewerTurn(text, transcriptId);
              tick();
            });
            audio.addEventListener("ended", () => {
              cancelAnimationFrame(raf);
              setAgentVolume(0);
              resolve();
            });
            audio.addEventListener("error", () => {
              cancelAnimationFrame(raf);
              setAgentVolume(0);
              resolve();
            });
          } catch {
            // MediaElementSource not supported — still play the audio
            audio.addEventListener("play", () => {
              setAgentState("speaking");
              commitInterviewerTurn(text, transcriptId);
            });
            audio.addEventListener("ended", () => resolve());
            audio.addEventListener("error", () => resolve());
          }
          await audio.play();
        } catch {
          commitInterviewerTurn(text, transcriptId);
          resolve();
        }
      });
    }

    // Wait for the candidate to finish answering — resolves either when the
    // silence timer fires or after NO_ANSWER_TIMEOUT_MS (whichever first).
    function waitForAnswer(): Promise<void> {
      return new Promise((resolve) => {
        let resolved = false;
        const finish = () => {
          if (resolved) return;
          resolved = true;
          clearAnswerTimers();
          resolve();
        };
        onAnswerCompleteRef.current = finish;
        noAnswerTimerRef.current = setTimeout(finish, NO_ANSWER_TIMEOUT_MS);
      });
    }

    (async () => {
      // Brief settle so the orb mount animation finishes.
      await new Promise((r) => setTimeout(r, 600));
      for (let i = 0; i < QUESTIONS.length; i++) {
        if (cancelled || endedRef.current) return;
        setActiveQuestion(i);
        await playClip(QUESTIONS[i]!, `q-${i}`);
        if (cancelled || endedRef.current) return;
        setAgentState("listening");
        await waitForAnswer();
        if (cancelled || endedRef.current) return;
        // Acks for Q1..Q3, wrap-up for Q4.
        const isLast = i + 1 >= QUESTIONS.length;
        const ackText = isLast ? WRAP : ACKS[i] ?? "Thanks for that.";
        setAgentState("thinking");
        await new Promise((r) => setTimeout(r, 350));
        await playClip(ackText, `ack-${i}`);
      }
      // All done — auto-end.
      endInterview();
    })();

    return () => {
      cancelled = true;
      clearAnswerTimers();
      onAnswerCompleteRef.current = null;
      audioRef.current?.pause();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice, dg.isActive, fatalError]);

  // 2-minute hard cap.
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
    if (endedRef.current || ending || showIngestion) return;
    endedRef.current = true;
    clearAnswerTimers();
    setShowIngestion(true);
    audioRef.current?.pause();
    startEnd(async () => {
      try {
        await Promise.all([
          fetch("/api/interview/end-and-score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              interview_id: interviewId,
              transcript: transcript.map((m) => ({ role: m.role, text: m.text, t: m.t })),
            }),
          }),
          new Promise((r) => setTimeout(r, 4500)),
        ]);
        router.push(`/performance/${interviewId}`);
      } catch {
        toast.error("Could not finalize report");
        setShowIngestion(false);
        endedRef.current = false;
      }
    });
  }

  // Strict failure card — no fallbacks.
  if (fatalError) {
    return (
      <CallShell>
        <div
          style={{
            margin: "auto",
            maxWidth: 520,
            padding: 32,
            border: "1px solid #d97a4a40",
            background: "#1c1a1488",
            backdropFilter: "blur(20px)",
            borderRadius: 14,
            textAlign: "center",
          }}
        >
          <Eyebrow style={{ color: "#d97a4a" }}>Interview unavailable</Eyebrow>
          <p
            className="serif"
            style={{
              marginTop: 18,
              fontSize: 24,
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
              color: "#ece7dc",
            }}
          >
            Live transcription failed to start.
          </p>
          <p style={{ marginTop: 14, fontSize: 14, color: "#a8a397", lineHeight: 1.5 }}>
            {fatalError}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 26,
              padding: "10px 22px",
              border: "1px solid #ece7dc44",
              background: "transparent",
              color: "#ece7dc",
              fontSize: 13,
              letterSpacing: "0.04em",
              cursor: "pointer",
              borderRadius: 4,
            }}
          >
            Reload and try again
          </button>
        </div>
      </CallShell>
    );
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
    <CallShell>
      <CallTopBar
        questionIndex={Math.min(questionIndex || 1, 4)}
        mins={mins}
        secs={secs}
        lowTime={lowTime}
      />
      {/* Agent subtitle sits in the upper third of the canvas, well above the
          orb's status label so the two never collide. */}
      <div
        style={{
          position: "absolute",
          top: 110,
          left: 0,
          right: 0,
          textAlign: "center",
          padding: "0 96px",
          pointerEvents: "none",
        }}
      >
        <motion.div
          key={lastInterviewerLine}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tween(DUR.slow, EASE_OUT)}
          className="serif"
          style={{
            fontSize: 28,
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            color: "#fff",
            fontWeight: 400,
            maxWidth: 980,
            margin: "0 auto",
          }}
        >
          “{lastInterviewerLine}”
        </motion.div>
      </div>
      <div
        style={{ flex: 1, display: "grid", placeItems: "center", padding: 40, position: "relative" }}
      >
        <Orb
          isAgentSpeaking={isAgentSpeaking}
          isAgentListening={isAgentListening}
          agentVolume={agentVolume}
          orbScale={orbScale}
          agentState={agentState}
          voice={voice}
        />
      </div>
      <CallBottomBar
        localVolume={localVolume}
        isAgentSpeaking={isAgentSpeaking}
        isAgentListening={isAgentListening}
        ending={ending || showIngestion}
        showTranscript={showTranscript}
        onToggleTranscript={() => setShowTranscript((v) => !v)}
        onEnd={endInterview}
      />
      {showTranscript && (
        <FloatingTranscript turns={transcript} voice={voice} liveCandidate={liveCandidate} />
      )}
      <AnimatePresence>{showIngestion && <IngestionOverlay />}</AnimatePresence>
    </CallShell>
  );
}

// ─── Shared subcomponents ───────────────────────────────────────────────

function CallShell({ children }: { children: React.ReactNode }) {
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
      {children}
    </div>
  );
}

function CallTopBar({
  questionIndex,
  mins,
  secs,
  lowTime,
}: {
  questionIndex: number;
  mins: number;
  secs: number;
  lowTime: boolean;
}) {
  return (
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
          {String(questionIndex).padStart(2, "0")}
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
  );
}

function CallBottomBar({
  localVolume,
  isAgentSpeaking,
  isAgentListening,
  ending,
  showTranscript,
  onToggleTranscript,
  onEnd,
}: {
  localVolume: number;
  isAgentSpeaking: boolean;
  isAgentListening: boolean;
  ending: boolean;
  showTranscript: boolean;
  onToggleTranscript: () => void;
  onEnd: () => void;
}) {
  return (
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
          Your mic ·{" "}
          {isAgentSpeaking
            ? "muted while AI speaks"
            : isAgentListening
              ? "open"
              : "standby"}
        </span>
      </div>
      <button
        type="button"
        onClick={onEnd}
        disabled={ending}
        aria-label="End interview"
        style={{
          width: 78,
          height: 78,
          borderRadius: 50,
          background: "#d96b56",
          color: "#14130e",
          border: "none",
          cursor: ending ? "not-allowed" : "pointer",
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
          onClick={onToggleTranscript}
          style={{ background: showTranscript ? "#d97a4a" : undefined }}
        />
      </div>
    </div>
  );
}

function Orb({
  isAgentSpeaking,
  isAgentListening,
  agentVolume,
  orbScale,
  agentState,
  voice,
}: {
  isAgentSpeaking: boolean;
  isAgentListening: boolean;
  agentVolume: number;
  orbScale: number;
  agentState: string;
  voice: string;
}) {
  return (
    <div style={{ position: "relative", width: 460, height: 460, display: "grid", placeItems: "center" }}>
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          animate={{ scale: 1 + (isAgentSpeaking ? agentVolume * 0.06 : 0) }}
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
          boxShadow: "0 0 80px #d97a4a40, inset -20px -30px 60px #00000040, inset 20px 20px 50px #ffffff20",
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
          {agentState === "connecting" || agentState === "initializing"
            ? "Connecting"
            : isAgentSpeaking
              ? `${voice} is speaking`
              : isAgentListening
                ? "Listening to you"
                : agentState === "thinking"
                  ? "Thinking…"
                  : "Standby"}
        </span>
      </div>
    </div>
  );
}

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

function FloatingTranscript({
  turns,
  voice,
  liveCandidate,
}: {
  turns: TranscriptTurn[];
  voice: string;
  liveCandidate?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns.length, liveCandidate]);
  return (
    <div
      ref={scrollerRef}
      style={{
        position: "absolute",
        left: 32,
        top: 100,
        width: 340,
        background: "#1c1a1480",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid #ece7dc14",
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxHeight: 420,
        overflowY: "auto",
        zIndex: 3,
      }}
    >
      <Eyebrow style={{ color: "#74706a" }}>Live transcript</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, lineHeight: 1.55 }}>
        {turns.length === 0 && !liveCandidate && (
          <span style={{ color: "#74706a", fontStyle: "italic" }}>Waiting for the first turn…</span>
        )}
        <AnimatePresence initial={false}>
          {turns.map((t) => {
            const isInt = t.role === "interviewer";
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: t.final ? 1 : 0.7, y: 0 }}
                exit={{ opacity: 0 }}
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
                {isInt ? (
                  <p style={{ margin: "2px 0 0", color: "#d8d3c5" }}>{t.text}</p>
                ) : (
                  // Candidate finals: word-by-word fade so each word lands cleanly.
                  <p style={{ margin: "2px 0 0", color: "#ece7dc" }}>
                    {t.text.split(/\s+/).map((w, i) => (
                      <motion.span
                        key={`${t.id}-${i}`}
                        initial={{ opacity: 0, y: 2 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.018, duration: 0.18, ease: "easeOut" }}
                        style={{ display: "inline-block", marginRight: "0.28em" }}
                      >
                        {w}
                      </motion.span>
                    ))}
                  </p>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {liveCandidate && (
          <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={tween(DUR.fast, EASE_OUT)}
          >
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: "#a8a397",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              You · live
            </span>
            <p
              style={{
                margin: "2px 0 0",
                color: "#ece7dc",
                opacity: 0.7,
                fontStyle: "italic",
              }}
            >
              {liveCandidate}
              <motion.span
                aria-hidden="true"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{
                  display: "inline-block",
                  marginLeft: 3,
                  width: 6,
                  height: 12,
                  background: "#d97a4a",
                  verticalAlign: "middle",
                }}
              />
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

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
              background: "radial-gradient(circle at 35% 30%, #f4d4b8, #d97a4a 55%, #9c4a2c 100%)",
              boxShadow: "0 0 60px #d97a4a44",
            }}
          />
        </div>
        <div style={{ marginTop: 20, fontFamily: "var(--font-display)", fontSize: 24, letterSpacing: "-0.02em" }}>
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
                    borderColor: state === "done" ? "#d97a4a" : state === "active" ? "#d97a4a" : "#ece7dc33",
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

