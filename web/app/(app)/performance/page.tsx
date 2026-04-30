import Link from "next/link";
import { Mic, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Eyebrow } from "@/components/ui/eyebrow";
import { QuoteRule } from "@/components/ui/quote-rule";
import { createClient } from "@/lib/supabase/server";
import { getShellContext } from "@/lib/get-shell-context";

export default async function PerformanceIndexPage() {
  const ctx = await getShellContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("interviews")
    .select("id, status, ended_at, created_at, jobs(company, role), interview_results(overall_score)")
    .order("created_at", { ascending: false })
    .limit(20);

  const completed = (data ?? []).filter((i) => i.status === "completed");

  return (
    <AppShell
      active="performance"
      crumbs={["Hyrd", "Performance"]}
      user={ctx.user}
      upNext={ctx.upNext}
    >
      <div style={{ padding: "40px 56px 64px", display: "flex", flexDirection: "column", gap: 32 }}>
        <div>
          <Eyebrow>№ 09 · Performance</Eyebrow>
          <h1
            className="serif"
            style={{ fontSize: 56, letterSpacing: "-0.035em", margin: "10px 0 0", fontWeight: 400 }}
          >
            Every run, archived.
          </h1>
        </div>

        {completed.length === 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
            <QuoteRule attribution="Begin with one mock interview.">
              The transcript is the source of truth. Without one, there is nothing to study.
            </QuoteRule>
            <Link href="/jobs" className="btn btn-accent btn-lg" style={{ width: "fit-content" }}>
              <Mic size={14} /> Pick a role and run a mock
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {completed.map((row) => {
              const job = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs;
              const result = Array.isArray(row.interview_results) ? row.interview_results[0] : row.interview_results;
              return (
                <Link
                  key={row.id}
                  href={`/performance/${row.id}`}
                  className="row"
                  style={{
                    gridTemplateColumns: "auto 1fr auto auto",
                    color: "inherit",
                    textDecoration: "none",
                    padding: "16px 4px",
                  }}
                >
                  <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)", width: 80 }}>
                    {new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <div>
                    <div style={{ fontSize: 14 }}>{job?.role ?? "Mock interview"}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-4)" }}>{job?.company ?? "—"}</div>
                  </div>
                  <span
                    className="serif tnum"
                    style={{ fontSize: 22, color: "var(--ink)", letterSpacing: "-0.02em" }}
                  >
                    {result?.overall_score ?? "—"}
                  </span>
                  <Sparkles size={14} className="ic" style={{ color: "var(--ink-4)" }} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
