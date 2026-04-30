// Generic TTS proxy — given { voice, text }, returns Cartesia-synthesized
// MP3 bytes. Used by both the voice picker preview and the demo-mode 4-question
// scripted interview flow.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const CARTESIA_VOICE_IDS: Record<string, string> = {
  Halden: "a0e99841-438c-4a64-b679-ae501e7d6091",
  Mira: "248be419-c632-4f23-adf1-5324ed7dbf1d",
  Jules: "5c5ad5e7-1020-476b-8b91-fdcbe9cc313c",
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
  const text = String(body.text ?? "").slice(0, 600);
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
  const voiceId = CARTESIA_VOICE_IDS[voiceName];
  if (!voiceId) return NextResponse.json({ error: "Unknown voice" }, { status: 400 });

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
    console.error("Cartesia TTS error", resp.status, errBody.slice(0, 400));
    return NextResponse.json({ error: "TTS failed" }, { status: 502 });
  }

  const audio = await resp.arrayBuffer();
  return new Response(audio, {
    status: 200,
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=300" },
  });
}
