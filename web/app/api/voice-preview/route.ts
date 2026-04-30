// Preview a Cartesia voice. Returns a small WAV streamed back to the browser.
// We hand-pick a sample line per voice so the user hears the actual cadence.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// Same Cartesia voice IDs as the agent.
const CARTESIA_VOICE_IDS: Record<string, string> = {
  Halden: "a0e99841-438c-4a64-b679-ae501e7d6091",
  Mira: "248be419-c632-4f23-adf1-5324ed7dbf1d",
  Jules: "5c5ad5e7-1020-476b-8b91-fdcbe9cc313c",
};

const SAMPLE_LINES: Record<string, string> = {
  Halden: "Walk me through the last project you shipped — what made it hard?",
  Mira: "Tell me about a moment you had to push back against a teammate.",
  Jules: "Why this company, specifically? What's the connection?",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Cartesia not configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const voiceName = String(body.voice ?? "Halden");
  const voiceId = CARTESIA_VOICE_IDS[voiceName];
  if (!voiceId) {
    return NextResponse.json({ error: "Unknown voice" }, { status: 400 });
  }

  const text = SAMPLE_LINES[voiceName] ?? SAMPLE_LINES.Halden;

  // Cartesia /tts/bytes returns audio bytes directly (no streaming setup).
  // https://docs.cartesia.ai/api-reference/tts/tts-bytes
  const resp = await fetch("https://api.cartesia.ai/tts/bytes", {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Cartesia-Version": "2024-06-10",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_id: "sonic-2",
      transcript: text,
      voice: { mode: "id", id: voiceId },
      output_format: { container: "mp3", bit_rate: 128000, sample_rate: 44100 },
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    console.error("Cartesia preview error", resp.status, errBody.slice(0, 400));
    return NextResponse.json({ error: "Voice preview failed" }, { status: 502 });
  }

  const audio = await resp.arrayBuffer();
  return new Response(audio, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=300",
    },
  });
}
