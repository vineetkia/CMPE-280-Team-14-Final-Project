import { createClient } from "@/lib/supabase/server";

export interface ShellContext {
  user: { name: string; initials: string; plan: string; email: string; id: string };
  upNext: { company: string; role: string; when: string; jobId: string } | null;
}

export async function getShellContext(): Promise<ShellContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fallbackUser = {
    id: user?.id ?? "",
    email: user?.email ?? "demo@sjsu.edu",
    name: "Demo User",
    initials: "DU",
    plan: "Pro · trial 12d left",
  };

  if (!user) return { user: fallbackUser, upNext: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const fullName = profile?.full_name ?? user.email?.split("@")[0] ?? "Demo User";
  const ini =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s: string) => s[0]?.toUpperCase())
      .join("") || "DU";

  const { data: nextJob } = await supabase
    .from("jobs")
    .select("id, company, role, interview_at")
    .eq("status", "interview")
    .not("interview_at", "is", null)
    .order("interview_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let upNext: ShellContext["upNext"] = null;
  if (nextJob?.interview_at) {
    const d = new Date(nextJob.interview_at);
    const fmt = d.toLocaleDateString("en-US", { weekday: "short" }) +
      " · " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    upNext = { company: nextJob.company, role: nextJob.role, when: fmt, jobId: nextJob.id };
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      name: fullName,
      initials: ini,
      plan: "Pro · trial 12d left",
    },
    upNext,
  };
}
