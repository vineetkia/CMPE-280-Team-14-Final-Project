"use client";

import { useState } from "react";
import type { Job } from "@/lib/types";
import { Lobby } from "./lobby";
import { LiveCall } from "./live-call";

type Phase = "lobby" | "live";

export function InterviewExperience({ job }: { job: Job }) {
  const [phase, setPhase] = useState<Phase>("lobby");
  const [voice, setVoice] = useState<"Halden" | "Mira" | "Jules">("Halden");
  const [style, setStyle] = useState<"friendly" | "neutral" | "tough">("neutral");
  const [interviewId, setInterviewId] = useState<string | null>(null);

  if (phase === "lobby") {
    return (
      <Lobby
        job={job}
        voice={voice}
        style={style}
        onVoiceChange={setVoice}
        onStyleChange={setStyle}
        onBegin={(id) => {
          setInterviewId(id);
          setPhase("live");
        }}
      />
    );
  }

  return (
    <LiveCall
      job={job}
      voice={voice}
      style={style}
      interviewId={interviewId!}
    />
  );
}
