// Demo-mode "report generation" — copies the seeded Stripe interview's
// scoring + transcript onto the current interview row. Used when the user
// runs a 2-minute scripted demo: real analytics aren't possible in 2 minutes,
// so we show the canonical seed report as the result.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  transcript: [
    { role: "interviewer", text: "Hi — let's begin. Tell me about yourself in 60 seconds.", t: 0 },
    {
      role: "candidate",
      text:
        "Senior product designer, seven years across Notion and Mailchimp, lately leading the AI editor at Notion. I gravitate toward technically ambiguous surfaces and care a lot about typographic detail. Most recent shipped: an AI-assisted database editor cutting time-to-first-row by 41%.",
      t: 8,
    },
    {
      role: "interviewer",
      text: "Walk me through your last shipped project — what made it hard?",
      t: 56,
    },
    {
      role: "candidate",
      text:
        "Last quarter we shipped the AI database editor at Notion. The hard part was the editing model assumed determinism — but the AI suggestions are stochastic. We had to redesign the cell-edit primitive from scratch, then validate against 4.2M weekly users without breaking muscle memory. Took three rounds.",
      t: 64,
    },
    { role: "interviewer", text: "Disagreement with engineering — what did you do?", t: 90 },
    {
      role: "candidate",
      text:
        "There was a moment where the staff engineer wanted to ship without the empty state. I, um, pushed back and we ran a quick check — turns out 18% of users hit it on day one. We added it.",
      t: 96,
    },
    { role: "interviewer", text: "Why this role?", t: 113 },
    {
      role: "candidate",
      text:
        "It feels like a place where the bar for craft is genuinely held — uh, the editor team in particular cares about typography in a way that maps to my Notion work.",
      t: 117,
    },
  ],
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const interviewId = String(body.interview_id ?? "");
  if (!interviewId) return NextResponse.json({ error: "interview_id required" }, { status: 400 });

  // Mark the interview completed.
  const { data: interview } = await supabase
    .from("interviews")
    .select("id, started_at")
    .eq("id", interviewId)
    .maybeSingle();
  if (!interview) return NextResponse.json({ error: "Interview not found" }, { status: 404 });

  const startedAt = interview.started_at ? new Date(interview.started_at).getTime() : Date.now();
  const duration = Math.max(60, Math.round((Date.now() - startedAt) / 1000));

  await supabase
    .from("interviews")
    .update({
      ended_at: new Date().toISOString(),
      duration_seconds: Math.min(duration, 120),
      status: "completed",
    })
    .eq("id", interviewId);

  await supabase
    .from("interview_results")
    .upsert(
      {
        interview_id: interviewId,
        user_id: user.id,
        ...SEED_REPORT,
      },
      { onConflict: "interview_id" },
    );

  return NextResponse.json({ ok: true });
}
