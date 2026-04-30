import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runJsonLLM } from "@/lib/llm";
import { OptimizedResumeSchema, ParsedResumeSchema } from "@/lib/schemas/resume";
import { optimizeResumePrompt, parseResumePrompt } from "@/lib/prompts/resume";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  raw_text: z.string().min(50),
  jd: z.string().min(20),
  tone: z.enum(["concise", "impactful", "executive"]).default("impactful"),
  length: z.enum(["1 page", "2 pages"]).default("1 page"),
  emphasis: z.enum(["quantify", "leadership", "craft"]).default("quantify"),
  job_id: z.string().uuid().nullable().optional(),
  label: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = RequestSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Step 1: parse raw text into structured résumé (light tier — fast).
  const parsed = await runJsonLLM(
    parseResumePrompt(body.raw_text),
    ParsedResumeSchema,
    "light",
  );

  // Step 2: optimize against JD (heavy tier — capable).
  const optimized = await runJsonLLM(
    optimizeResumePrompt({
      resume: parsed,
      jd: body.jd,
      tone: body.tone,
      length: body.length,
      emphasis: body.emphasis,
    }),
    OptimizedResumeSchema,
    "heavy",
  );

  // Persist the version.
  const { data: resume, error } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      job_id: body.job_id ?? null,
      label: body.label ?? "Tailored draft",
      parsed_json: parsed,
      optimized_json: optimized,
      ats_score: optimized.ats_score,
      keyword_coverage: optimized.keyword_coverage,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ resume_id: resume.id, optimized });
}
