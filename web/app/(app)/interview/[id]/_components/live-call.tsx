"use client";

/**
 * Live AI interview — real LiveKit pipeline.
 *
 * Architecture:
 *   1. Browser mints a room JWT via /api/interview/token (which also pre-creates
 *      the LiveKit room with metadata so the agent receives JD context).
 *   2. <LiveKitRoom> connects to wss://… and publishes the user's mic.
 *   3. The Python agent (`agent/agent.py`) receives the dispatch, joins the
 *      room, and runs Deepgram STT → Azure GPT-5.4-mini → Cartesia TTS.
 *   4. Both sides' transcripts are published as `lk.transcription` text and
 *      consumed via useVoiceAssistant() / useTrackTranscription().
 *   5. On End: hit /api/interview/end-and-score which decides whether to run
 *      real scoring (transcript has substance) or fall back to the seed report
 *      (transcript too short — agent never connected, mic muted, etc).
 *
 * Failure modes we handle:
 *   - LiveKit not configured (no token route response) → fall back to scripted
 *     demo mode (Cartesia plays 4 canned questions).
 *   - Agent never joins the room (no dispatch / cloud routing issue) → after
 *     ~10s with no agent participant, surface a toast and fall back to
 *     scripted mode.
 *   - getUserMedia denied → mic visualizer stays at 0 but interview still works.
 */
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useRoomContext,
  useTrackTranscription,
  useVoiceAssistant,
} from "@livekit/components-react";
import { Track, type Track as TrackNS } from "livekit-client";
import type { Job } from "@/lib/types";
import { Eyebrow } from "@/components/ui/eyebrow";
import { tween, DUR, EASE_OUT } from "@/components/motion";
import {
  useDeepgramTranscription,
  type TranscriptFragment,
} from "@/lib/hooks/use-deepgram-transcription";

const DURATION_MS = 120_000;

// Background-themed scripted questions for the 2-minute demo. Each is short
// enough that Cartesia takes about 8–10 seconds of audio.
const FALLBACK_QUESTIONS = [
  "Hi — thanks for taking the time. To start, tell me about yourself in sixty seconds.",
  "Walk me through your background — your school, your work so far, and what you've shipped.",
  "What technologies are you strongest in, and why did you gravitate toward them?",
  "Last one: why are you looking for a new role right now?",
];

// After the final question's audio ends, give the candidate this much time to
// answer before the interview auto-ends and routes to the report.
const FINAL_ANSWER_WINDOW_MS = 20_000;
// During earlier questions, we also wait this long for the candidate to
// answer before kicking off the next question. Slightly tighter than the
// final-window so the interview doesn't drag.
const ANSWER_WINDOW_MS = 14_000;

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
  style,
  interviewId,
}: {
  job: Job;
  voice: string;
  style: string;
  interviewId: string;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);

  // Mint a token. If LiveKit is not configured, fall back to scripted demo.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/interview/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interview_id: interviewId, voice, style }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          if (res.status === 503) {
            // LiveKit not configured; use scripted demo mode.
            setFallbackMode(true);
          } else {
            setTokenError(data.error || "Could not start interview");
          }
          return;
        }
        setToken(data.token);
        setServerUrl(data.url);
      } catch {
        if (!cancelled) setFallbackMode(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [interviewId, voice, style]);

  if (tokenError) {
    return (
      <CallShell>
        <div style={{ textAlign: "center", maxWidth: 480, padding: 40 }}>
          <Eyebrow style={{ color: "#a8a397" }}>Unable to start interview</Eyebrow>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 22,
              color: "#ece7dc",
              marginTop: 16,
            }}
          >
            {tokenError}
          </p>
        </div>
      </CallShell>
    );
  }

  if (fallbackMode) {
    return <ScriptedFallback job={job} voice={voice} interviewId={interviewId} />;
  }

  if (!token || !serverUrl) {
    return (
      <CallShell>
        <Eyebrow style={{ color: "#74706a" }}>Connecting…</Eyebrow>
      </CallShell>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect
      audio
      video={false}
      style={{ minHeight: "100vh" }}
      onError={(err) => {
        toast.error(`LiveKit error: ${err.message}`);
        setFallbackMode(true);
      }}
    >
      <RoomAudioRenderer />
      <CallStage job={job} voice={voice} interviewId={interviewId} />
    </LiveKitRoom>
  );
}

// ─── CallStage — runs inside a connected LiveKitRoom ─────────────────
function CallStage({
  job,
  voice,
  interviewId,
}: {
  job: Job;
  voice: string;
  interviewId: string;
}) {
  const router = useRouter();
  const room = useRoomContext();
  const startedRef = useRef<number>(Date.now());

  const va = useVoiceAssistant();
  const agentState = va.state; // "connecting" | "initializing" | "listening" | "thinking" | "speaking" | …
  const agentAudio = va.audioTrack;
  const agentSegments = va.agentTranscriptions ?? [];

  const { localParticipant, microphoneTrack } = useLocalParticipant();
  const userTrans = useTrackTranscription({
    publication: microphoneTrack,
    source: Track.Source.Microphone,
    participant: localParticipant,
  });
  const userSegments = userTrans.segments;

  // Real audio amplitudes for the orb + mic waveform.
  const agentVolume = useTrackVolume(
    (agentAudio as { publication?: { track?: TrackNS } } | undefined)?.publication?.track ?? null,
  );
  const localVolume = useTrackVolume(microphoneTrack?.track ?? null);

  // 2-minute countdown.
  const [remainingMs, setRemainingMs] = useState(DURATION_MS);
  const [showTranscript, setShowTranscript] = useState(true);
  const [showIngestion, setShowIngestion] = useState(false);
  const [ending, startEnd] = useTransition();
  const [agentTimedOut, setAgentTimedOut] = useState(false);

  // If no agent has joined within 12 seconds, warn the user and offer a fallback.
  useEffect(() => {
    const t = setTimeout(() => {
      const remoteCount = room.remoteParticipants.size;
      if (remoteCount === 0) {
        setAgentTimedOut(true);
        toast.error(
          "Agent didn't join the room. Click Stop to end and view the report.",
        );
      }
    }, 12_000);
    return () => clearTimeout(t);
  }, [room]);

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

  // Merge agent + user transcript segments into a single ordered list.
  const merged = useMemo<TranscriptTurn[]>(() => {
    const startMs = startedRef.current;
    type Segment = {
      id: string;
      text: string;
      firstReceivedTime?: number;
      final?: boolean;
    };
    const norm = (
      role: "interviewer" | "candidate",
      src: ReadonlyArray<Segment>,
    ): TranscriptTurn[] =>
      src.map((s) => ({
        id: `${role}-${s.id}`,
        role,
        text: s.text,
        t: Math.max(0, Math.floor(((s.firstReceivedTime ?? Date.now()) - startMs) / 1000)),
        final: s.final ?? false,
      }));
    return [
      ...norm("interviewer", agentSegments as ReadonlyArray<Segment>),
      ...norm("candidate", userSegments as ReadonlyArray<Segment>),
    ].sort((a, b) => a.t - b.t || (a.role === "interviewer" ? -1 : 1));
  }, [agentSegments, userSegments]);

  const lastInterviewerLine =
    [...merged].reverse().find((tt) => tt.role === "interviewer")?.text ??
    (agentState === "connecting" || agentState === "initializing"
      ? "Connecting to interviewer…"
      : "Listening…");

  const questionIndex = Math.max(
    1,
    Math.min(4, merged.filter((tt) => tt.role === "interviewer" && tt.final).length || 1),
  );

  function endInterview() {
    if (ending || showIngestion) return;
    setShowIngestion(true);
    startEnd(async () => {
      try {
        // Stop publishing audio + disconnect the room before scoring runs.
        try {
          await room.disconnect();
        } catch {
          /* ignore */
        }
        // Send the merged transcript as a fallback for the scoring route.
        await Promise.all([
          fetch("/api/interview/end-and-score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              interview_id: interviewId,
              transcript: merged.map((m) => ({ role: m.role, text: m.text, t: m.t })),
            }),
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

  return (
    <CallShell>
      <CallTopBar
        questionIndex={questionIndex}
        mins={mins}
        secs={secs}
        lowTime={lowTime}
      />

      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 40, position: "relative" }}>
        <Orb
          isAgentSpeaking={isAgentSpeaking}
          isAgentListening={isAgentListening}
          agentVolume={agentVolume}
          orbScale={orbScale}
          agentState={agentState}
          voice={voice}
        />

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

      <CallBottomBar
        localVolume={localVolume}
        isAgentSpeaking={isAgentSpeaking}
        isAgentListening={isAgentListening}
        agentTimedOut={agentTimedOut}
        ending={ending || showIngestion}
        showTranscript={showTranscript}
        onToggleTranscript={() => setShowTranscript((v) => !v)}
        onEnd={endInterview}
      />

      {showTranscript && <FloatingTranscript turns={merged} voice={voice} />}

      <AnimatePresence>{showIngestion && <IngestionOverlay />}</AnimatePresence>
    </CallShell>
  );
}

// ─── Scripted fallback (LiveKit not configured) ─────────────────────────
function ScriptedFallback({
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
  const [agentState, setAgentState] = useState<"connecting" | "speaking" | "listening">("connecting");
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  // Live (interim) candidate fragment — re-rendered as Deepgram emits partials.
  const [liveCandidate, setLiveCandidate] = useState<string>("");
  const [showTranscript, setShowTranscript] = useState(true);
  const [localVolume, setLocalVolume] = useState(0);
  const [agentVolume, setAgentVolume] = useState(0);
  const [showIngestion, setShowIngestion] = useState(false);
  const [ending, startEnd] = useTransition();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const endedRef = useRef(false);
  // Tracks the index of the currently-active question so Deepgram finals can
  // be attributed to the correct turn.
  const activeQuestionRef = useRef(-1);

  // Mic-amplitude analyser for the bottom waveform. The Deepgram hook owns its
  // own mic stream — using two getUserMedia calls is fine on Chrome.
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

  // Stable callbacks for the Deepgram hook so renders don't recycle the WS.
  const handleFinal = useCallback((frag: TranscriptFragment) => {
    const t = Math.floor((Date.now() - startedRef.current) / 1000);
    const qIdx = activeQuestionRef.current;
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
  }, []);
  const handleInterim = useCallback((frag: TranscriptFragment) => {
    setLiveCandidate(frag.text);
  }, []);

  // Open the Deepgram WS as soon as the fallback mounts. The hook handles its
  // own getUserMedia and survives the entire interview.
  const dg = useDeepgramTranscription({
    enabled: true,
    onFinal: handleFinal,
    onInterim: handleInterim,
  });
  // Surface a one-time toast if Deepgram errored — the demo still works
  // without transcription.
  useEffect(() => {
    if (dg.error) {
      toast.error(`Live transcription unavailable: ${dg.error}`);
    }
  }, [dg.error]);

  useEffect(() => {
    let cancelled = false;
    function commitInterviewerTurn(text: string, i: number) {
      const t = Math.floor((Date.now() - startedRef.current) / 1000);
      setTranscript((prev) => {
        if (prev.some((x) => x.id === `q-${i}`)) return prev;
        return [...prev, { id: `q-${i}`, role: "interviewer", text, t, final: true }];
      });
      setQuestionIndex(i + 1);
      activeQuestionRef.current = i;
    }
    function scheduleNext(i: number, ms: number) {
      if (cancelled) return;
      setTimeout(() => {
        if (cancelled) return;
        // Q4 is the last — after the answer window, end the interview rather
        // than queuing another question.
        if (i + 1 >= FALLBACK_QUESTIONS.length) {
          endInterview();
        } else {
          playQuestion(i + 1);
        }
      }, ms);
    }
    async function playQuestion(i: number) {
      if (cancelled || i >= FALLBACK_QUESTIONS.length) return;
      setAgentState("connecting");
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voice, text: FALLBACK_QUESTIONS[i] }),
        });
        if (!res.ok) {
          commitInterviewerTurn(FALLBACK_QUESTIONS[i]!, i);
          const wait = i + 1 >= FALLBACK_QUESTIONS.length ? FINAL_ANSWER_WINDOW_MS : ANSWER_WINDOW_MS;
          scheduleNext(i, wait);
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.addEventListener("ended", () => URL.revokeObjectURL(url));
        try {
          const ctx = audioCtxRef.current ?? new AudioContext();
          const src = ctx.createMediaElementSource(audio);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          src.connect(analyser);
          src.connect(ctx.destination);
          const data = new Uint8Array(analyser.frequencyBinCount);
          let raf = 0;
          const tick = () => {
            analyser.getByteFrequencyData(data);
            let sum = 0;
            for (let k = 0; k < data.length; k++) sum += data[k]! * data[k]!;
            setAgentVolume(Math.sqrt(sum / data.length) / 255);
            if (!audio.paused && !audio.ended) raf = requestAnimationFrame(tick);
          };
          audio.addEventListener("play", () => {
            setAgentState("speaking");
            commitInterviewerTurn(FALLBACK_QUESTIONS[i]!, i);
            tick();
          });
          audio.addEventListener("ended", () => {
            cancelAnimationFrame(raf);
            setAgentVolume(0);
            setAgentState("listening");
            const wait = i + 1 >= FALLBACK_QUESTIONS.length ? FINAL_ANSWER_WINDOW_MS : ANSWER_WINDOW_MS;
            scheduleNext(i, wait);
          });
        } catch {
          audio.addEventListener("play", () => {
            setAgentState("speaking");
            commitInterviewerTurn(FALLBACK_QUESTIONS[i]!, i);
          });
          audio.addEventListener("ended", () => {
            setAgentState("listening");
            const wait = i + 1 >= FALLBACK_QUESTIONS.length ? FINAL_ANSWER_WINDOW_MS : ANSWER_WINDOW_MS;
            scheduleNext(i, wait);
          });
        }
        await audio.play();
      } catch {
        commitInterviewerTurn(FALLBACK_QUESTIONS[i]!, i);
        const wait = i + 1 >= FALLBACK_QUESTIONS.length ? FINAL_ANSWER_WINDOW_MS : ANSWER_WINDOW_MS;
        scheduleNext(i, wait);
      }
    }
    const kickoff = setTimeout(() => playQuestion(0), 600);
    return () => {
      cancelled = true;
      clearTimeout(kickoff);
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [voice]);

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

  const mins = Math.floor(remainingMs / 60_000);
  const secs = Math.floor((remainingMs % 60_000) / 1000);
  const lowTime = remainingMs <= 30_000;
  const isAgentSpeaking = agentState === "speaking";
  const isAgentListening = agentState === "listening";
  const orbScale = isAgentSpeaking ? 1 + Math.min(0.08, agentVolume * 0.25) : 1;
  const lastInterviewerLine =
    [...transcript].reverse().find((t) => t.role === "interviewer")?.text ?? FALLBACK_QUESTIONS[0]!;

  return (
    <CallShell>
      <CallTopBar
        questionIndex={Math.min(questionIndex || 1, 4)}
        mins={mins}
        secs={secs}
        lowTime={lowTime}
      />
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 40, position: "relative" }}>
        <Orb
          isAgentSpeaking={isAgentSpeaking}
          isAgentListening={isAgentListening}
          agentVolume={agentVolume}
          orbScale={orbScale}
          agentState={agentState}
          voice={voice}
        />
        <div style={{ position: "absolute", bottom: 140, left: 0, right: 0, textAlign: "center", padding: "0 80px" }}>
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
      <CallBottomBar
        localVolume={localVolume}
        isAgentSpeaking={isAgentSpeaking}
        isAgentListening={isAgentListening}
        agentTimedOut={false}
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
  agentTimedOut,
  ending,
  showTranscript,
  onToggleTranscript,
  onEnd,
}: {
  localVolume: number;
  isAgentSpeaking: boolean;
  isAgentListening: boolean;
  agentTimedOut: boolean;
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
          {agentTimedOut
            ? "no agent — click stop"
            : isAgentSpeaking
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

// ─── useTrackVolume — sample audio analyser at 60fps ─────────────────────
function useTrackVolume(track: TrackNS | null): number {
  const [volume, setVolume] = useState(0);
  useEffect(() => {
    if (!track || !track.mediaStream) {
      setVolume(0);
      return;
    }
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(track.mediaStream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;
    const tick = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i]! * data[i]!;
      const rms = Math.sqrt(sum / data.length) / 255;
      setVolume(rms);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ctx.close();
    };
  }, [track]);
  return volume;
}
