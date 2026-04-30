import { AppShell } from "@/components/app-shell";
import { Eyebrow } from "@/components/ui/eyebrow";
import { SectionMark } from "@/components/ui/section-mark";
import { getShellContext } from "@/lib/get-shell-context";
import { createClient } from "@/lib/supabase/server";
import { OptimizerInputForm } from "./_components/input-form";

export default async function OptimizerPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { jobId } = await searchParams;
  const ctx = await getShellContext();
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, company, role, jd_text")
    .order("updated_at", { ascending: false });
  const { data: drafts } = await supabase
    .from("resumes")
    .select("id, label, ats_score, created_at")
    .order("created_at", { ascending: false })
    .limit(3);

  const presetJob = jobs?.find((j) => j.id === jobId) ?? null;

  return (
    <AppShell
      active="optimizer"
      crumbs={["Hyrd", "Resume optimizer", "New draft"]}
      user={ctx.user}
      upNext={ctx.upNext}
      topnavRight={
        <span className="btn btn-ghost btn-sm" style={{ pointerEvents: "none" }}>
          Drafts ({drafts?.length ?? 0})
        </span>
      }
    >
      <div style={{ padding: "32px 56px 64px" }}>
        <SectionMark
          num="03"
          title="Tailor a résumé"
          right={<Eyebrow>Untitled draft · auto-saved</Eyebrow>}
        />
        <OptimizerInputForm jobs={jobs ?? []} preselectedJobId={presetJob?.id ?? null} preselectedJD={presetJob?.jd_text ?? ""} />
      </div>
    </AppShell>
  );
}
