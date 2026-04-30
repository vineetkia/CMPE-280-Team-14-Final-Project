import { NextRequest, NextResponse } from "next/server";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!apiKey || !apiSecret || !livekitUrl) {
    return NextResponse.json({ error: "LiveKit not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const interviewId = String(body.interview_id ?? "");
  const voice = String(body.voice ?? "Halden");
  const style = String(body.style ?? "neutral");

  const { data: interview } = await supabase
    .from("interviews")
    .select("livekit_room, jobs(company, role, jd_text)")
    .eq("id", interviewId)
    .maybeSingle();
  if (!interview?.livekit_room)
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });

  const job = Array.isArray(interview.jobs) ? interview.jobs[0] : interview.jobs;

  const metadata = JSON.stringify({
    voice,
    style,
    role: job?.role ?? "Software Engineer",
    company: job?.company ?? "the company",
    jd: job?.jd_text ?? "",
    interview_id: interviewId,
  });

  // Pre-create the room with metadata so the agent (which reads
  // ctx.room.metadata) gets the JD + voice context. Idempotent — if the room
  // already exists, this updates metadata.
  // Convert wss:// URL to https:// for the REST endpoint.
  const httpUrl = livekitUrl.replace(/^wss:\/\//, "https://").replace(/^ws:\/\//, "http://");
  const svc = new RoomServiceClient(httpUrl, apiKey, apiSecret);
  try {
    await svc.createRoom({
      name: interview.livekit_room,
      emptyTimeout: 60, // close the room 60s after the last participant leaves
      maxParticipants: 4,
      metadata,
    });
  } catch (err) {
    // createRoom is idempotent on most cloud services; if it errors as
    // "already exists" we update metadata explicitly.
    try {
      await svc.updateRoomMetadata(interview.livekit_room, metadata);
    } catch (err2) {
      console.warn("Could not pre-create or update LiveKit room metadata", err2);
    }
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: user.id,
    name: user.email ?? "candidate",
    // Participant metadata duplicates the room metadata so the agent has it
    // available even before the room metadata round-trips.
    metadata,
  });
  at.addGrant({
    room: interview.livekit_room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const token = await at.toJwt();
  return NextResponse.json({
    token,
    url: livekitUrl,
    room: interview.livekit_room,
  });
}
