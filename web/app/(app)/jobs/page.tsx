import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { getShellContext } from "@/lib/get-shell-context";
import type { Job } from "@/lib/types";
import { KanbanBoard } from "./_components/kanban-board";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  const { open } = await searchParams;
  const ctx = await getShellContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select("*")
    .order("position", { ascending: true });
  const jobs = (data ?? []) as Job[];

  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, job_id, ats_score, label, is_active");

  return (
    <AppShell
      active="tracker"
      crumbs={["Hyrd", "Job tracker", "All roles"]}
      user={ctx.user}
      upNext={ctx.upNext}
    >
      <KanbanBoard jobs={jobs} resumes={resumes ?? []} initialOpen={open ?? null} />
    </AppShell>
  );
}
