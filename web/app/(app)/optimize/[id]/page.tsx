import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { getShellContext } from "@/lib/get-shell-context";
import { OptimizedResumeSchema, type OptimizedResume } from "@/lib/schemas/resume";
import { OptimizerOutputView } from "../_components/output-view";

export default async function OptimizerOutputPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getShellContext();
  const supabase = await createClient();
  const { data: resume } = await supabase
    .from("resumes")
    .select("id, label, parsed_json, optimized_json, ats_score, keyword_coverage, jobs(company, role, jd_text)")
    .eq("id", id)
    .maybeSingle();

  if (!resume?.optimized_json) notFound();

  const optimized = OptimizedResumeSchema.parse(resume.optimized_json) as OptimizedResume;
  // parsed_json is the original parsed résumé. May be null on legacy rows;
  // in that case the output view treats `optimized` as both base and proposed.
  const parsed = (resume.parsed_json ?? null) as OptimizedResume | null;
  const jobsRel = (resume as { jobs?: { company?: string; role?: string } | { company?: string; role?: string }[] }).jobs;
  const jobInfo = Array.isArray(jobsRel) ? jobsRel[0] : jobsRel;

  return (
    <AppShell
      active="optimizer"
      crumbs={[
        "Hyrd",
        "Resume optimizer",
        jobInfo ? `${jobInfo.company ?? ""} · ${jobInfo.role ?? ""}` : (resume.label ?? "Tailored draft"),
      ]}
      user={ctx.user}
      upNext={ctx.upNext}
      topnavRight={
        <>
          <span className="btn btn-ghost btn-sm">Diff</span>
        </>
      }
    >
      <OptimizerOutputView
        resumeId={resume.id}
        optimized={optimized}
        parsed={parsed}
        jdText={(jobInfo as { jd_text?: string } | undefined)?.jd_text ?? null}
      />
    </AppShell>
  );
}
