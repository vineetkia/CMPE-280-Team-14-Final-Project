import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runJsonLLM } from "@/lib/llm";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const FeedbackSchema = z.object({
  overall_score: z.number().int().min(0).max(100),
  dimensions: z.object({
    clarity: z.number().int().min(0).max(100),
    confidence: z.number().int().min(0).max(100),
    relevance: z.number().int().min(0).max(100),
    structure: z.number().int().min(0).max(100),
    technical_depth: z.number().int().min(0).max(100),
    pace: z.number().int().min(0).max(100),
  }),
  question_scores: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      score: z.number().int().min(0).max(100),
      feedback: z.string(),
      better_answer: z.string().nullable(),
      time_seconds: z.number().int().min(0),
    }),
  ),
  improvement_plan: z.array(
    z.object({
      focus_area: z.string(),
      why: z.string(),
      drills: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          est_minutes: z.number().int().min(1).max(120),
        }),
      ),
      priority: z.number().int().min(1).max(5),
    }),
  ),
});

const FILLER_PATTERNS = [/\bum\b/gi, /\buh\b/gi, /\blike\b/gi, /\byou know\b/gi];

function deterministicMetrics(transcript: Array<{ role: string; text: string; t: number }>) {
  const candidateTurns = transcript.filter((t) => t.role === "candidate");
  const allText = candidateTurns.map((t) => t.text).join(" ");
  const wordCount = allText.split(/\s+/).filter(Boolean).length;
  const totalTime = transcript.length ? Math.max(1, transcript[transcript.length - 1]!.t - transcript[0]!.t) : 1;
  const wpm = Math.max(80, Math.round((wordCount / Math.max(15, totalTime)) * 60));
  let fillerCount = 0;
  for (const p of FILLER_PATTERNS) {
    const matches = allText.match(p);
    if (matches) fillerCount += matches.length;
  }
  return { wpm, fillerCount };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const interviewId = String(body.interview_id ?? "");

  const { data: interview } = await supabase
    .from("interviews")
    .select("id, voice, style, jobs(company, role, jd_text)")
    .eq("id", interviewId)
    .maybeSingle();
  if (!interview) return NextResponse.json({ error: "Interview not found" }, { status: 404 });

  // Poll briefly for the agent's transcript flush (it writes via service-role
  // when the call disconnects). The browser also writes a merged copy as a
  // fallback. Either will populate the row within a couple of seconds.
  type TranscriptTurn = { role: "interviewer" | "candidate"; text: string; t: number };
  let transcript: TranscriptTurn[] = [];
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data: existing } = await supabase
      .from("interview_results")
      .select("transcript")
      .eq("interview_id", interviewId)
      .maybeSingle();
    transcript = (existing?.transcript as TranscriptTurn[] | undefined) ?? [];
    if (transcript.length > 0) break;
    await new Promise((r) => setTimeout(r, 500));
  }

  const job = Array.isArray(interview.jobs) ? interview.jobs[0] : interview.jobs;

  // If we have no candidate turns at all, the interview never really happened
  // (mic muted, agent never connected, ended in <5s). Don't burn an LLM call —
  // write a placeholder report so the user lands on the dashboard cleanly.
  const candidateTurns = transcript.filter((t) => t.role === "candidate");
  if (candidateTurns.length === 0) {
    await supabase
      .from("interview_results")
      .upsert(
        {
          interview_id: interviewId,
          user_id: user.id,
          overall_score: 0,
          dimensions: {
            clarity: 0,
            confidence: 0,
            relevance: 0,
            structure: 0,
            technical_depth: 0,
            pace: 0,
          },
          question_scores: [],
          filler_count: 0,
          wpm: 0,
          improvement_plan: [
            {
              focus_area: "Try the interview again with your mic on.",
              why: "We didn't capture any of your responses — the agent either didn't connect or your microphone was muted. Run it back from the lobby.",
              drills: [{ name: "Run interview", description: "Open the lobby and click Begin.", est_minutes: 3 }],
              priority: 1,
            },
          ],
          transcript,
        },
        { onConflict: "interview_id" },
      );
    return NextResponse.json({ ok: true, fallback: true });
  }

  const { wpm, fillerCount } = deterministicMetrics(transcript);

  // Compose Q/A pairs from the transcript.
  const pairs: Array<{ q: string; a: string; t: number }> = [];
  for (let i = 0; i < transcript.length; i++) {
    const t = transcript[i]!;
    if (t.role === "interviewer") {
      const next = transcript[i + 1];
      pairs.push({ q: t.text, a: next?.role === "candidate" ? next.text : "", t: t.t });
    }
  }

  const system = `You are a senior interview coach. Given a transcript and job context, produce honest, surgical scoring.

Inputs:
- Job: ${job?.company ?? ""} · ${job?.role ?? ""}
- JD excerpt: ${(job?.jd_text ?? "").slice(0, 2000)}
- Pre-computed words-per-minute: ${wpm}
- Pre-computed filler count: ${fillerCount}

Output STRICTLY this JSON shape — no prose, no markdown:

{
  "overall_score": int 0-100,
  "dimensions": {
    "clarity": int, "confidence": int, "relevance": int,
    "structure": int, "technical_depth": int, "pace": int
  },
  "question_scores": [
    { "question": string, "answer": string, "score": int 0-100,
      "feedback": string, "better_answer": string|null, "time_seconds": int }
  ],
  "improvement_plan": [
    { "focus_area": string, "why": string,
      "drills": [{ "name": string, "description": string, "est_minutes": int }],
      "priority": int 1-5 }
  ]
}

Voice: composed, second-person, no exclamation marks, no gamification. Three improvement_plan entries; each priority 1 (highest) to 3.`;

  const scored = await runJsonLLM(
    {
      system,
      user: JSON.stringify({ pairs, totalTurns: transcript.length }),
    },
    FeedbackSchema,
    "heavy",
  );

  await supabase
    .from("interview_results")
    .upsert(
      {
        interview_id: interviewId,
        user_id: user.id,
        overall_score: scored.overall_score,
        dimensions: scored.dimensions,
        question_scores: scored.question_scores,
        filler_count: fillerCount,
        wpm,
        improvement_plan: scored.improvement_plan,
        transcript,
      },
      { onConflict: "interview_id" },
    );

  return NextResponse.json({ ok: true });
}
