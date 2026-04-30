"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mic, X } from "lucide-react";
import { toast } from "sonner";
import type { Job } from "@/lib/types";
import { Brand } from "@/components/ui/brand";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Chip } from "@/components/ui/chip";
import { LogoSq } from "@/components/ui/logo-sq";
import { Segmented } from "@/components/ui/segmented";

type Voice = "Halden" | "Mira" | "Jules";
type Style = "friendly" | "neutral" | "tough";

const VOICES: Array<{ name: Voice; desc: string }> = [
  { name: "Halden", desc: "Neutral · baritone · 0.9× pace" },
  { name: "Mira", desc: "Warm · alto · 1.0× pace" },
  { name: "Jules", desc: "Crisp · mid · 1.05× pace" },
];

const STYLES = [
  { value: "friendly" as const, label: "Friendly" },
  { value: "neutral" as const, label: "Neutral" },
  { value: "tough" as const, label: "Tough" },
];

export function Lobby({
  job,
  voice,
  style,
  onVoiceChange,
  onStyleChange,
  onBegin,
}: {
  job: Job;
  voice: Voice;
  style: Style;
  onVoiceChange: (v: Voice) => void;
  onStyleChange: (s: Style) => void;
  onBegin: (interviewId: string) => void;
}) {
  const router = useRouter();
  const [micOk, setMicOk] = useState<"checking" | "ok" | "denied">("checking");
  const [levels, setLevels] = useState<number[]>(Array(38).fill(4));
  const [pending, start] = useTransition();
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let cancelled = false;
    let raf: number;
    let analyser: AnalyserNode | null = null;
    let stream: MediaStream | null = null;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) return;
        setMicOk("ok");
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(data);
          const next = Array.from({ length: 38 }, (_, i) => {
            const idx = Math.floor((i / 38) * data.length);
            return Math.max(3, Math.round((data[idx]! / 255) * 24));
          });
          setLevels(next);
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        console.error(err);
        if (!cancelled) setMicOk("denied");
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
  }, []);

  function begin() {
    start(async () => {
      try {
        const res = await fetch("/api/interview/begin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_id: job.id, voice, style }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Could not start interview");
          return;
        }
        onBegin(data.interview_id);
      } catch (err) {
        toast.error("Network error starting interview");
      }
    });
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "20px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        <Brand size="sm" />
        <Eyebrow>№ 07 · Pre-call lobby</Eyebrow>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => router.back()}>
          <X size={14} /> Cancel
        </button>
      </div>

      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 40 }}>
        <div style={{ width: 720, display: "flex", flexDirection: "column", gap: 28 }}>
          {/* Job context */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 18px",
              background: "var(--bg-raised)",
              border: "1px solid var(--hairline)",
              borderRadius: 12,
            }}
          >
            <LogoSq name={job.company} color={job.brand_color} size={36} />
            <div style={{ flex: 1 }}>
              <Eyebrow>Mock interview · tuned to JD</Eyebrow>
              <div style={{ fontSize: 14, color: "var(--ink)" }}>
                {job.role} · {job.company}
              </div>
            </div>
            <Chip>4 questions</Chip>
            <Chip>2 min</Chip>
          </div>

          <div style={{ textAlign: "center" }}>
            <Eyebrow>Before we begin</Eyebrow>
            <h1
              className="serif"
              style={{
                fontSize: 56,
                letterSpacing: "-0.03em",
                margin: "10px 0 6px",
                lineHeight: 1.05,
                fontWeight: 400,
              }}
            >
              <em style={{ fontStyle: "italic" }}>Compose</em> yourself.
            </h1>
            <p
              style={{
                color: "var(--ink-3)",
                fontSize: 15,
                margin: 0,
                maxWidth: 460,
                marginInline: "auto",
              }}
            >
              Two minutes, four questions, voice only. You can end anytime — your transcript is saved.
            </p>
          </div>

          {/* Mic check */}
          <div className="card" style={{ padding: 22, display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 50,
                background: micOk === "ok" ? "var(--positive-soft)" : "var(--negative-soft)",
                color: micOk === "ok" ? "var(--positive)" : "var(--negative)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Mic size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 14, color: "var(--ink)" }}>Microphone</span>
                <Eyebrow style={{ color: micOk === "ok" ? "var(--positive)" : "var(--negative)" }}>
                  ● {micOk === "ok" ? "Listening" : micOk === "denied" ? "Permission denied" : "Checking…"}
                </Eyebrow>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 8, height: 24 }}>
                {levels.map((h, i) => (
                  <span
                    key={i}
                    style={{
                      width: 2,
                      height: h,
                      background: "var(--ink)",
                      opacity: i % 4 === 0 ? 0.9 : 0.5,
                      borderRadius: 1,
                      transition: "height 80ms linear",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Voice picker */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Eyebrow>Interviewer voice</Eyebrow>
              <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>Tap to select</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 12 }}>
              {VOICES.map((v) => (
                <VoicePickerCard
                  key={v.name}
                  voice={v}
                  selected={voice === v.name}
                  onSelect={() => onVoiceChange(v.name)}
                />
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "center" }}>
            <div>
              <Eyebrow>Interviewer style</Eyebrow>
              <div style={{ marginTop: 8 }}>
                <Segmented options={STYLES} value={style} onChange={onStyleChange} />
              </div>
            </div>
            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 6 }}>
              <button
                type="button"
                className="btn btn-accent btn-lg"
                style={{ alignSelf: "flex-end", padding: "0 28px" }}
                onClick={begin}
                disabled={pending || micOk !== "ok"}
              >
                {pending ? "Starting…" : "Begin interview"} <ArrowRight size={14} />
              </button>
              <Eyebrow style={{ alignSelf: "flex-end" }}>2 minutes · You can end anytime</Eyebrow>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Voice picker card with real Cartesia preview audio ─────────────────
function VoicePickerCard({
  voice,
  selected,
  onSelect,
}: {
  voice: { name: Voice; desc: string };
  selected: boolean;
  onSelect: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop any in-flight preview when this card is unmounted.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  async function preview(e: React.MouseEvent) {
    e.stopPropagation();
    if (playing) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlaying(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/voice-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice: voice.name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Could not load voice preview");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.addEventListener("ended", () => {
        setPlaying(false);
        URL.revokeObjectURL(url);
      });
      audio.addEventListener("pause", () => setPlaying(false));
      await audio.play();
      setPlaying(true);
    } catch {
      toast.error("Network error loading voice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect();
      }}
      style={{
        textAlign: "left",
        padding: 14,
        borderRadius: 10,
        background: selected ? "var(--ink)" : "var(--bg)",
        color: selected ? "var(--bg)" : "var(--ink)",
        border: `1px solid ${selected ? "var(--ink)" : "var(--hairline)"}`,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        position: "relative",
        transition: "background 200ms cubic-bezier(0.32,0.72,0,1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="serif" style={{ fontSize: 18, letterSpacing: "-0.015em" }}>
          {voice.name}
        </span>
        <button
          type="button"
          onClick={preview}
          aria-label={playing ? `Stop ${voice.name} preview` : `Preview ${voice.name}`}
          style={{
            width: 26,
            height: 26,
            borderRadius: 50,
            border: "1px solid currentColor",
            background: "transparent",
            color: "currentColor",
            display: "grid",
            placeItems: "center",
            fontSize: 11,
            cursor: "pointer",
            padding: 0,
          }}
        >
          {loading ? "⋯" : playing ? "■" : "▶"}
        </button>
      </div>
      <span className="mono" style={{ fontSize: 10.5, opacity: 0.7, letterSpacing: "0.06em" }}>
        {voice.desc}
      </span>
    </div>
  );
}
