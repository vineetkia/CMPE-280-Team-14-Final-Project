import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const BodySchema = z.object({
  interview_id: z.string().uuid(),
  transcript: z
    .array(
      z.object({
        role: z.enum(["interviewer", "candidate"]),
        text: z.string(),
        t: z.number().int(),
      }),
    )
    .min(0),
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

  const { data: interview } = await supabase
    .from("interviews")
    .select("id, started_at")
    .eq("id", body.interview_id)
    .maybeSingle();
  if (!interview) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const startedAt = interview.started_at ? new Date(interview.started_at).getTime() : Date.now();
  const duration = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

  await supabase
    .from("interviews")
    .update({
      ended_at: new Date().toISOString(),
      duration_seconds: duration,
      status: "completed",
    })
    .eq("id", body.interview_id);

  // The agent flushes its own (more accurate) transcript via service-role at
  // end-of-call. We write the browser's merged copy only if the result row is
  // still missing a transcript — this serves as a fallback when the agent
  // didn't run (e.g., LiveKit not configured) or its flush is delayed.
  const { data: existing } = await supabase
    .from("interview_results")
    .select("transcript")
    .eq("interview_id", body.interview_id)
    .maybeSingle();

  const existingTranscript = (existing?.transcript ?? []) as unknown[];
  if (!existing || existingTranscript.length < body.transcript.length) {
    await supabase
      .from("interview_results")
      .upsert(
        {
          interview_id: body.interview_id,
          user_id: user.id,
          transcript: body.transcript,
        },
        { onConflict: "interview_id" },
      );
  }

  return NextResponse.json({ ok: true, duration_seconds: duration });
}
