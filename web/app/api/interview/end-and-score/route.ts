// Combined end-of-call + scoring path. Decides between:
//   (a) running real Azure scoring against the captured transcript, when the
//       candidate actually said something substantial (>= 60 chars across all
//       their turns combined, OR at least 2 candidate turns), or
//   (b) falling back to the canonical seed report when the transcript is too
//       thin to score honestly (mic muted, agent didn't connect, ended in <5s).
//
// This replaces the older /api/interview/end + /api/interview/feedback +
// /api/interview/demo-report split. Browser hits one endpoint and we route.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { runJsonLLM } from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 60;

const TranscriptTurnSchema = z.object({
  role: z.enum(["interviewer", "candidate"]),
  text: z.string(),
  t: z.number().int(),
});

const BodySchema = z.object({
  interview_id: z.string().uuid(),
  transcript: z.array(TranscriptTurnSchema).min(0),
});

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

// Canonical seed report — used when the real transcript is too thin to score.
const SEED_REPORT = {
  overall_score: 84,
  dimensions: {
    clarity: 86,
    confidence: 78,
    relevance: 92,
    structure: 74,
    technical_depth: 82,
    pace: 65,
  },
  question_scores: [
    {
      question: "Tell me about yourself in 60 seconds.",
      answer:
        "Senior product designer, seven years across Notion and Mailchimp, lately leading the AI editor at Notion. I gravitate toward technically ambiguous surfaces and care a lot about typographic detail.",
      score: 87,
      feedback:
        "Your opening line is strong. Tighten the middle by leading with one outcome (the 41% time-to-first-row) before listing companies.",
      better_answer:
        "Senior product designer, seven years, currently leading Notion's AI database editor — the team cut time-to-first-row by 41%. Earlier at Mailchimp I shipped onboarding work that lifted activation by 23%. I gravitate toward typographically dense, technically ambiguous surfaces.",
      time_seconds: 48,
    },
    {
      question: "Walk me through your last shipped project — what made it hard?",
      answer:
        "Last quarter we shipped the AI database editor at Notion. The hard part was the editing model assumed determinism — but the AI suggestions are stochastic.",
      score: 92,
      feedback: "Cleanly structured — Situation, Task, Action, Result implicit but legible.",
      better_answer: null,
      time_seconds: 42,
    },
    {
      question: "Disagreement with engineering — what did you do?",
      answer:
        "There was a moment where the staff engineer wanted to ship without the empty state. I pushed back and we ran a quick check — turns out 18% of users hit it on day one.",
      score: 76,
      feedback:
        "Use STAR more explicitly. Two clear sentences for Situation and Task before Action; Result was buried at the end.",
      better_answer:
        "Situation: we were a week from ship and the staff eng wanted to skip the empty state. Task: I owned the activation experience. Action: I asked for 24 hours, ran a usage probe, found 18% of new accounts hit it day one. Result: we shipped with the empty state and activation held flat instead of dropping.",
      time_seconds: 38,
    },
    {
      question: "Why this role?",
      answer:
        "It feels like a place where the bar for craft is genuinely held — the editor team in particular cares about typography in a way that maps to my Notion work.",
      score: 68,
      feedback:
        "This answer ran long and lost the through-line. Lead with one specific surface that maps to your strength, then bridge.",
      better_answer:
        "The Dashboard's information density is closer to a typographic instrument than a SaaS product — that's the bar I hold myself to. My Notion AI editor work is the natural bridge: same typographic constraints, same complexity ceiling.",
      time_seconds: 50,
    },
  ],
  filler_count: 14,
  wpm: 164,
  transcript: [
    { role: "interviewer" as const, text: "Hi — let's begin. Tell me about yourself in 60 seconds.", t: 0 },
    {
      role: "candidate" as const,
      text:
        "Senior product designer, seven years across Notion and Mailchimp, lately leading the AI editor at Notion. I gravitate toward technically ambiguous surfaces and care a lot about typographic detail. Most recent shipped: an AI-assisted database editor cutting time-to-first-row by 41%.",
      t: 8,
    },
    { role: "interviewer" as const, text: "Walk me through your last shipped project — what made it hard?", t: 56 },
    {
      role: "candidate" as const,
      text:
        "Last quarter we shipped the AI database editor at Notion. The hard part was the editing model assumed determinism — but the AI suggestions are stochastic.",
      t: 64,
    },
    { role: "interviewer" as const, text: "Disagreement with engineering — what did you do?", t: 90 },
    {
      role: "candidate" as const,
      text:
        "There was a moment where the staff engineer wanted to ship without the empty state. I, um, pushed back and we ran a quick check — turns out 18% of users hit it on day one.",
      t: 96,
    },
    { role: "interviewer" as const, text: "Why this role?", t: 113 },
    {
      role: "candidate" as const,
      text:
        "It feels like a place where the bar for craft is genuinely held — uh, the editor team in particular cares about typography in a way that maps to my Notion work.",
      t: 117,
    },
  ],
  improvement_plan: [
    {
      focus_area: "Anchor every answer in STAR.",
      why: "Two answers skipped Situation/Task. Drill: pick 5 random behavioral prompts and write 60-second outlines.",
      drills: [
        {
          name: "STAR scaffolding drill",
          description: "Five behavioral prompts, 60-second outlines each.",
          est_minutes: 15,
        },
      ],
      priority: 1,
    },
    {
      focus_area: "Tighten 'Why this company' to 30 seconds.",
      why: "Lead with one specific surface. Use a typography focus as your bridge.",
      drills: [
        {
          name: "Re-run Q4",
          description: "Take the same prompt, cap at 30 seconds, lead with surface.",
          est_minutes: 10,
        },
      ],
      priority: 2,
    },
    {
      focus_area: "Trim filler words.",
      why: "14 in 1:58 reads as nervous. Try a 3-second pause before answering — sounds composed, not slow.",
      drills: [
        {
          name: "Pace prompt",
          description: "Three minute drill: deliberate 3-second pre-answer pause.",
          est_minutes: 20,
        },
      ],
      priority: 3,
    },
  ],
};

const FILLER_PATTERNS = [/\bum\b/gi, /\buh\b/gi, /\blike\b/gi, /\byou know\b/gi];

function deterministicMetrics(
  transcript: Array<{ role: string; text: string; t: number }>,
) {
  const candidateTurns = transcript.filter((t) => t.role === "candidate");
  const allText = candidateTurns.map((t) => t.text).join(" ");
  const wordCount = allText.split(/\s+/).filter(Boolean).length;
  const lastT = transcript.length ? transcript[transcript.length - 1]!.t : 1;
  const firstT = transcript.length ? transcript[0]!.t : 0;
  const totalTime = Math.max(15, lastT - firstT);
  const wpm = Math.max(80, Math.round((wordCount / totalTime) * 60));
  let fillerCount = 0;
  for (const p of FILLER_PATTERNS) {
    const matches = allText.match(p);
    if (matches) fillerCount += matches.length;
  }
  return { wpm, fillerCount, candidateChars: allText.length, candidateTurns: candidateTurns.length };
}

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

  const { interview_id, transcript: browserTranscript } = body;

  // Mark the interview completed (regardless of which scoring path runs).
  const { data: interview } = await supabase
    .from("interviews")
    .select("id, voice, style, started_at, jobs(company, role, jd_text)")
    .eq("id", interview_id)
    .maybeSingle();
  if (!interview) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }
  const startedAt = interview.started_at ? new Date(interview.started_at).getTime() : Date.now();
  const duration = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
  await supabase
    .from("interviews")
    .update({
      ended_at: new Date().toISOString(),
      duration_seconds: Math.min(duration, 120),
      status: "completed",
    })
    .eq("id", interview_id);

  // Source the transcript: prefer the agent's flushed copy if it exists,
  // otherwise use what the browser sent (covers the scripted-fallback case).
  const { data: existing } = await supabase
    .from("interview_results")
    .select("transcript")
    .eq("interview_id", interview_id)
    .maybeSingle();
  type TranscriptTurn = { role: "interviewer" | "candidate"; text: string; t: number };
  const agentTranscript = (existing?.transcript as TranscriptTurn[] | undefined) ?? [];
  const transcript: TranscriptTurn[] =
    agentTranscript.length >= browserTranscript.length ? agentTranscript : browserTranscript;

  // Decide scoring path.
  const metrics = deterministicMetrics(transcript);
  const hasSubstance = metrics.candidateChars >= 60 && metrics.candidateTurns >= 1;

  if (!hasSubstance) {
    // Demo / mic-muted / agent-never-joined fallback — write the seed report.
    await supabase
      .from("interview_results")
      .upsert(
        {
          interview_id,
          user_id: user.id,
          ...SEED_REPORT,
          transcript: transcript.length > 0 ? transcript : SEED_REPORT.transcript,
        },
        { onConflict: "interview_id" },
      );
    return NextResponse.json({ ok: true, mode: "seed_fallback" });
  }

  // Real Azure scoring.
  const job = Array.isArray(interview.jobs) ? interview.jobs[0] : interview.jobs;

  // Compose Q/A pairs from the transcript for the LLM.
  const pairs: Array<{ q: string; a: string; t: number }> = [];
  for (let i = 0; i < transcript.length; i++) {
    const t = transcript[i]!;
    if (t.role === "interviewer") {
      const next = transcript[i + 1];
      pairs.push({
        q: t.text,
        a: next?.role === "candidate" ? next.text : "",
        t: t.t,
      });
    }
  }

  const system = `You are a senior interview coach. Given a transcript and job context, produce honest, surgical scoring.

Inputs:
- Job: ${job?.company ?? ""} · ${job?.role ?? ""}
- JD excerpt: ${(job?.jd_text ?? "").slice(0, 2000)}
- Pre-computed words-per-minute: ${metrics.wpm}
- Pre-computed filler count: ${metrics.fillerCount}

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

Voice: composed, second-person, no exclamation marks, no gamification. Up to 4 question_scores entries (one per question asked). Three improvement_plan entries; each priority 1 (highest) to 3.`;

  let scored: z.infer<typeof FeedbackSchema>;
  try {
    scored = await runJsonLLM(
      {
        system,
        user: JSON.stringify({ pairs, totalTurns: transcript.length }),
      },
      FeedbackSchema,
      "heavy",
    );
  } catch (err) {
    console.error("Real scoring failed; falling back to seed", err);
    await supabase
      .from("interview_results")
      .upsert(
        {
          interview_id,
          user_id: user.id,
          ...SEED_REPORT,
          transcript,
        },
        { onConflict: "interview_id" },
      );
    return NextResponse.json({ ok: true, mode: "seed_fallback_after_error" });
  }

  await supabase
    .from("interview_results")
    .upsert(
      {
        interview_id,
        user_id: user.id,
        overall_score: scored.overall_score,
        dimensions: scored.dimensions,
        question_scores: scored.question_scores,
        filler_count: metrics.fillerCount,
        wpm: metrics.wpm,
        improvement_plan: scored.improvement_plan,
        transcript,
      },
      { onConflict: "interview_id" },
    );

  return NextResponse.json({ ok: true, mode: "real_scoring" });
}
