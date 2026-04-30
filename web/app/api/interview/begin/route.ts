import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const BodySchema = z.object({
  job_id: z.string().uuid(),
  voice: z.string(),
  style: z.string(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const room = `interview_${crypto.randomUUID()}`;
  const { data, error } = await supabase
    .from("interviews")
    .insert({
      user_id: user.id,
      job_id: body.job_id,
      livekit_room: room,
      voice: body.voice,
      style: body.style,
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ interview_id: data.id, room });
}
