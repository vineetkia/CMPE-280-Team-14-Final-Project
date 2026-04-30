/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
config({ path: ".env" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

const DEMO_EMAIL = "demo@sjsu.edu";
const DEMO_PASSWORD = "demo1234";
const DEMO_NAME = "Demo User";

async function ensureDemoUser(): Promise<string> {
  // List by email — admin API doesn't have a getByEmail, so we list pages.
  let userId: string | null = null;
  for (let page = 1; page <= 5 && !userId; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email === DEMO_EMAIL);
    if (found) userId = found.id;
    if (data.users.length < 200) break;
  }

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: DEMO_NAME },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created demo user ${DEMO_EMAIL}`);
  } else {
    await supabase.auth.admin.updateUserById(userId, { password: DEMO_PASSWORD });
    console.log(`Reset password on existing demo user`);
  }

  await supabase.from("profiles").upsert({
    id: userId,
    full_name: DEMO_NAME,
    target_role: "Senior Product Designer",
    years_exp: 7,
    default_voice: "Halden",
  });

  return userId;
}

const NOW = new Date();
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString();

const JOBS = [
  {
    company: "Anthropic",
    role: "Member of Technical Staff",
    location: "SF · Hybrid",
    salary_min: 250_000,
    salary_max: 320_000,
    status: "saved" as const,
    position: 0,
    brand_color: "#d97757",
    days_ago: 3,
  },
  {
    company: "Linear",
    role: "Senior Product Manager",
    location: "Remote",
    salary_min: 200_000,
    salary_max: 240_000,
    status: "applied" as const,
    position: 0,
    brand_color: "#5e6ad2",
    days_ago: 7,
  },
  {
    company: "Vercel",
    role: "Staff Engineer, Platform",
    location: "Remote",
    salary_min: 240_000,
    salary_max: 290_000,
    status: "applied" as const,
    position: 1,
    brand_color: "#000000",
    days_ago: 5,
  },
  {
    company: "Stripe",
    role: "Senior Product Designer",
    location: "SF · Hybrid",
    salary_min: 215_000,
    salary_max: 255_000,
    status: "interview" as const,
    position: 0,
    brand_color: "#635bff",
    days_ago: 11,
    interview_offset_days: 1.5,
  },
  {
    company: "Notion",
    role: "Founding Engineer, AI",
    location: "NYC · Hybrid",
    salary_min: 220_000,
    salary_max: 280_000,
    status: "interview" as const,
    position: 1,
    brand_color: "#000000",
    days_ago: 8,
    interview_offset_days: 4,
  },
  {
    company: "Figma",
    role: "Senior Engineer, Editor",
    location: "SF · On-site",
    salary_min: 235_000,
    salary_max: 275_000,
    status: "offer" as const,
    position: 0,
    brand_color: "#a259ff",
    days_ago: 18,
    offer_amount: "$255k + 0.10%",
  },
];

const SAMPLE_OPTIMIZED = (company: string, role: string) => ({
  contact: {
    name: "Demo User",
    email: "demo@sjsu.edu",
    location: "Brooklyn, NY",
    links: ["linkedin.com/in/demo", "demo.work"],
  },
  summary: `Senior product designer with 7 years shipping consumer and developer-tool surfaces at Notion and Mailchimp. I lead end-to-end design on ambiguous, technically complex products — partnering closely with engineering to ship work that holds a high typographic and motion bar. Tailored for ${company} · ${role}.`,
  experience: [
    {
      company: "Notion",
      role: "Senior Product Designer",
      start: "2022",
      end: "Present",
      bullets: [
        "Led design of AI-assisted database editor shipped to 4.2M weekly users; cut time-to-first-row by 41%.",
        "Drove design quality bar across 14 product surfaces — typography, motion, and detail — establishing a reusable component vocabulary adopted by 3 PM teams.",
        "Mentored 5 designers through career-ladder reviews; co-authored craft rubric now used company-wide.",
      ],
    },
    {
      company: "Mailchimp",
      role: "Product Designer",
      start: "2019",
      end: "2022",
      bullets: [
        "Designed onboarding flow that lifted 7-day activation by 23% across SMB segments (~880k accounts).",
        "Partnered with research on a 6-week generative study; outputs shaped 2024 roadmap.",
      ],
    },
  ],
  education: [{ school: "Carnegie Mellon", degree: "BFA, Design", year: "2018" }],
  skills: [
    "Design systems",
    "Typography",
    "Motion",
    "Figma",
    "Prototyping",
    "User research",
    "Linear",
    "SwiftUI",
    "Pricing & PLG",
  ],
  projects: [],
  bolded_phrases: [
    "4.2M weekly users",
    "cut time-to-first-row by 41%",
    "lifted 7-day activation by 23%",
    "~880k accounts",
    "5 designers",
    "14 product surfaces",
  ],
  metrics_added: ["41%", "23%", "4.2M", "880k"],
  keywords_used: ["typography", "motion", "design quality", "Linear", "SwiftUI"],
  ats_score: 94,
  keyword_coverage: 86,
  change_annotations: [
    {
      section: "Summary",
      before: "Senior PD with experience.",
      after: "Tailored summary lede with 7-year scope and tone match.",
      reason: "JD calls for principled product decisions. Surfacing scope and tone in lede mirrors the recruiter glance test.",
      kind: "change" as const,
    },
    {
      section: "Experience",
      before: "Worked on database editor",
      after: "Led design of AI-assisted database editor shipped to 4.2M weekly users; cut time-to-first-row by 41%.",
      reason: "Quantified your Notion bullet — JD calls out 'principled product decisions' and you led a measurable shift. We made the metrics the lede.",
      kind: "change" as const,
    },
    {
      section: "Experience",
      before: "Helped with design quality.",
      after: "Drove design quality bar across 14 product surfaces — typography, motion, and detail — establishing a reusable component vocabulary.",
      reason: `JD weights typographic and motion bar — your existing line buried this. We surfaced it.`,
      kind: "change" as const,
    },
    {
      section: "Skills",
      before: "—",
      after: "Linear",
      reason: "Direct keyword match — appears 4× in JD. ATS systems index this verbatim.",
      kind: "add" as const,
    },
    {
      section: "Skills",
      before: "—",
      after: "SwiftUI",
      reason: "Mentioned as 'nice to have' in the JD; surfacing it costs nothing and signals breadth.",
      kind: "add" as const,
    },
    {
      section: "Summary",
      before: "Long, generic 71-word summary.",
      after: "Tightened to 38 words.",
      reason: "Recruiter glance test: 6-second comprehension. Yours was running long at 71.",
      kind: "change" as const,
    },
    {
      section: "Experience",
      before: "Mentored some designers.",
      after: "Mentored 5 designers through career-ladder reviews; co-authored craft rubric now used company-wide.",
      reason: "Quantified the mentorship impact and elevated the rubric authorship — both hit the leadership rubric.",
      kind: "change" as const,
    },
  ],
});

const TRANSCRIPT = [
  { role: "interviewer" as const, text: "Hi — let's begin. Tell me about yourself in 60 seconds.", t: 0 },
  {
    role: "candidate" as const,
    text:
      "Senior product designer, seven years across Notion and Mailchimp, lately leading the AI editor at Notion. I gravitate toward technically ambiguous surfaces and care a lot about typographic detail. Most recent shipped: an AI-assisted database editor cutting time-to-first-row by 41%.",
    t: 8,
  },
  {
    role: "interviewer" as const,
    text: "Walk me through your last shipped project — what made it hard?",
    t: 56,
  },
  {
    role: "candidate" as const,
    text:
      "Last quarter we shipped the AI database editor at Notion. The hard part was the editing model assumed determinism — but the AI suggestions are stochastic. We had to redesign the cell-edit primitive from scratch, then validate against 4.2M weekly users without breaking muscle memory. Took three rounds.",
    t: 64,
  },
  {
    role: "interviewer" as const,
    text: "Disagreement with engineering — what did you do?",
    t: 90,
  },
  {
    role: "candidate" as const,
    text:
      "There was a moment where the staff engineer wanted to ship without the empty state. I, um, pushed back and we ran a quick check — turns out 18% of users hit it on day one. We added it.",
    t: 96,
  },
  { role: "interviewer" as const, text: "Why Stripe?", t: 113 },
  {
    role: "candidate" as const,
    text:
      "Stripe feels like a place where the bar for craft is genuinely held — uh, the editor team in particular cares about typography in a way that maps to my Notion work.",
    t: 117,
  },
];

const SAMPLE_FEEDBACK = {
  overall_score: 84,
  dimensions: { clarity: 86, confidence: 78, relevance: 92, structure: 74, technical_depth: 82, pace: 65 },
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
      question: "Why Stripe?",
      answer:
        "Stripe feels like a place where the bar for craft is genuinely held — the editor team in particular cares about typography in a way that maps to my Notion work.",
      score: 68,
      feedback:
        "This answer ran long and lost the through-line. Lead with one specific Stripe surface that maps to your strength, then bridge.",
      better_answer:
        "The Stripe Dashboard's information density is closer to a typographic instrument than a SaaS product — that's the bar I hold myself to. My Notion AI editor work is the natural bridge: same typographic constraints, same complexity ceiling.",
      time_seconds: 50,
    },
  ],
  filler_count: 14,
  wpm: 164,
  improvement_plan: [
    {
      focus_area: "Anchor every answer in STAR.",
      why: "Two answers skipped Situation/Task. Drill: pick 5 random behavioral prompts and write 60-second outlines.",
      drills: [{ name: "STAR scaffolding drill", description: "Five behavioral prompts, 60-second outlines each.", est_minutes: 15 }],
      priority: 1,
    },
    {
      focus_area: "Tighten 'Why this company' to 30 seconds.",
      why: "Lead with one specific surface. Use a typography focus as your bridge.",
      drills: [{ name: "Re-run Q4", description: "Take the same prompt, cap at 30 seconds, lead with surface.", est_minutes: 10 }],
      priority: 2,
    },
    {
      focus_area: "Trim filler words.",
      why: "14 in 1:58 reads as nervous. Try a 3-second pause before answering — sounds composed, not slow.",
      drills: [{ name: "Pace prompt", description: "Three minute drill: deliberate 3-second pre-answer pause.", est_minutes: 20 }],
      priority: 3,
    },
  ],
};

async function main() {
  const userId = await ensureDemoUser();

  // Wipe prior demo data so the script is idempotent.
  await supabase.from("interview_results").delete().eq("user_id", userId);
  await supabase.from("interviews").delete().eq("user_id", userId);
  await supabase.from("resumes").delete().eq("user_id", userId);
  await supabase.from("jobs").delete().eq("user_id", userId);

  // Insert jobs.
  const jobsToInsert = JOBS.map((j) => ({
    user_id: userId,
    company: j.company,
    role: j.role,
    location: j.location,
    salary_min: j.salary_min,
    salary_max: j.salary_max,
    status: j.status,
    position: j.position,
    brand_color: j.brand_color,
    interview_at:
      j.status === "interview" && j.interview_offset_days
        ? day(j.interview_offset_days)
        : null,
    offer_amount: j.status === "offer" ? j.offer_amount : null,
    created_at: day(-j.days_ago),
    updated_at: day(-j.days_ago + 1),
    jd_text: jdFor(j.company, j.role),
  }));

  const { data: insertedJobs, error: jobsErr } = await supabase
    .from("jobs")
    .insert(jobsToInsert)
    .select("id, company, role, status");
  if (jobsErr) throw jobsErr;
  console.log(`Inserted ${insertedJobs!.length} jobs`);

  const stripeJob = insertedJobs!.find((j) => j.company === "Stripe");
  const notionJob = insertedJobs!.find((j) => j.company === "Notion");

  // Two pre-optimized résumés. parsed_json is the pre-optimization version
  // (so rejecting all suggested edits in the optimizer falls back to it
  // visibly). optimized_json is the Azure-rewritten "all approved" version.
  const SAMPLE_PARSED = {
    contact: {
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      location: "Brooklyn, NY",
      links: ["linkedin.com/in/demo"],
    },
    summary: "Senior product designer with 7 years experience.",
    experience: [
      {
        company: "Notion",
        role: "Senior Product Designer",
        start: "2022",
        end: "Present",
        bullets: [
          "Worked on the database editor.",
          "Helped with design quality across the product.",
          "Mentored some designers.",
        ],
      },
      {
        company: "Mailchimp",
        role: "Product Designer",
        start: "2019",
        end: "2022",
        bullets: [
          "Designed the onboarding flow.",
          "Worked with research on a study.",
        ],
      },
    ],
    education: [{ school: "Carnegie Mellon", degree: "BFA, Design", year: "2018" }],
    skills: ["Design systems", "Typography", "Motion", "Figma", "Prototyping", "User research"],
    projects: [],
  };
  const resumes = [stripeJob, notionJob].filter(Boolean).map((j, i) => ({
    user_id: userId,
    job_id: j!.id,
    label: `${j!.company} · v3`,
    parsed_json: SAMPLE_PARSED,
    optimized_json: SAMPLE_OPTIMIZED(j!.company, j!.role),
    ats_score: i === 0 ? 94 : 88,
    keyword_coverage: i === 0 ? 86 : 81,
    is_active: true,
    created_at: day(-2 + i),
  }));
  const { error: resumeErr } = await supabase.from("resumes").insert(resumes);
  if (resumeErr) throw resumeErr;
  console.log(`Inserted ${resumes.length} resumes`);

  // Completed interview for Stripe.
  if (stripeJob) {
    const room = `interview_seed_${Date.now()}`;
    const { data: interview } = await supabase
      .from("interviews")
      .insert({
        user_id: userId,
        job_id: stripeJob.id,
        livekit_room: room,
        voice: "Halden",
        style: "neutral",
        status: "completed",
        started_at: day(-1),
        ended_at: new Date(new Date(day(-1)).getTime() + 118_000).toISOString(),
        duration_seconds: 118,
      })
      .select("id")
      .single();

    await supabase.from("interview_results").insert({
      interview_id: interview!.id,
      user_id: userId,
      overall_score: SAMPLE_FEEDBACK.overall_score,
      dimensions: SAMPLE_FEEDBACK.dimensions,
      question_scores: SAMPLE_FEEDBACK.question_scores,
      filler_count: SAMPLE_FEEDBACK.filler_count,
      wpm: SAMPLE_FEEDBACK.wpm,
      improvement_plan: SAMPLE_FEEDBACK.improvement_plan,
      transcript: TRANSCRIPT,
    });
    console.log(`Inserted seed interview ${interview!.id} for Stripe`);
  }

  console.log("\nSeed complete. Sign in with:");
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
}

function jdFor(company: string, role: string): string {
  return `About the role
${company} is hiring a ${role}. You will lead the design of a major surface area end-to-end — from research through visual polish — partnering closely with engineering and PM.

What you'll do
• Drive design for one or more product areas across web and desktop
• Translate ambiguous problems into focused, principled product decisions
• Raise the design quality bar with attention to typography, motion, and detail
• Run user research and usability testing alongside cross-functional teammates
• Partner closely with engineers — Linear, Figma, SwiftUI fluency a plus

What we look for
• 5+ years of senior or staff-level product design experience
• Demonstrated ability to ship craft-forward consumer or developer-tool surfaces
• Strong opinions on typography, motion, and density
• A portfolio of measurable impact, not just process artifacts.`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
