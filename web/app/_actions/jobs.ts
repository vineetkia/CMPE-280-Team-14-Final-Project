"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { runJsonLLM, getProvider } from "@/lib/llm";

const StatusSchema = z.enum(["saved", "applied", "interview", "offer", "rejected"]);

export async function moveJobAction(input: {
  id: string;
  status: z.infer<typeof StatusSchema>;
  position: number;
}): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({ status: input.status, position: input.position })
    .eq("id", input.id);
  if (error) return { error: error.message };
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function reorderColumnAction(input: {
  status: z.infer<typeof StatusSchema>;
  ids: string[];
}): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  for (let idx = 0; idx < input.ids.length; idx++) {
    const { error } = await supabase
      .from("jobs")
      .update({ status: input.status, position: idx })
      .eq("id", input.ids[idx]!);
    if (error) return { error: error.message };
  }
  revalidatePath("/jobs");
  return { ok: true };
}

const ParsedJDSchema = z.object({
  company: z.string(),
  role: z.string(),
  location: z.string().nullable(),
  salary_min: z.number().int().nullable(),
  salary_max: z.number().int().nullable(),
  brand_color: z.string().nullable(),
});

export async function addJobFromJD(input: { jd: string; status: z.infer<typeof StatusSchema> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  let parsed: z.infer<typeof ParsedJDSchema> = {
    company: "Untitled",
    role: "Unknown role",
    location: null,
    salary_min: null,
    salary_max: null,
    brand_color: null,
  };

  const provider = getProvider();
  const hasKeys =
    (provider === "anthropic" && !!process.env.ANTHROPIC_API_KEY) ||
    (provider === "azure" && !!process.env.OPENAI_API_KEY && !!process.env.OPENAI_BASE_URL);

  if (hasKeys) {
    try {
      parsed = await runJsonLLM(
        {
          system:
            "You extract structured job posting metadata. Respond ONLY with a JSON object matching this schema: " +
            '{"company": string, "role": string, "location": string|null, "salary_min": number|null, "salary_max": number|null, "brand_color": string|null}. ' +
            "salary_min/max are USD integers (e.g. 200000). brand_color is a #rrggbb hex if you recognize the company. No prose, no markdown.",
          user: input.jd.slice(0, 8000),
          maxTokens: 500,
        },
        ParsedJDSchema,
        "light",
      );
    } catch (err) {
      console.error("addJobFromJD parse error", err);
    }
  }

  // Determine position at end of column
  const { data: tail } = await supabase
    .from("jobs")
    .select("position")
    .eq("user_id", user.id)
    .eq("status", input.status)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (tail?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      user_id: user.id,
      company: parsed.company,
      role: parsed.role,
      location: parsed.location,
      salary_min: parsed.salary_min,
      salary_max: parsed.salary_max,
      jd_text: input.jd,
      status: input.status,
      position,
      brand_color: parsed.brand_color,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/jobs");
  return { ok: true, id: data.id };
}

export async function updateJobAction(input: {
  id: string;
  patch: Partial<{
    company: string;
    role: string;
    location: string | null;
    salary_min: number | null;
    salary_max: number | null;
    status: z.infer<typeof StatusSchema>;
    position: number;
    notes: string;
    interview_at: string | null;
    offer_amount: string | null;
    brand_color: string | null;
  }>;
}): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").update(input.patch).eq("id", input.id);
  if (error) return { error: error.message };
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteJobAction(input: {
  id: string;
}): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").delete().eq("id", input.id);
  if (error) return { error: error.message };
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  return { ok: true };
}
