import Link from "next/link";
import { Mic } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Eyebrow } from "@/components/ui/eyebrow";
import { LogoSq } from "@/components/ui/logo-sq";
import { QuoteRule } from "@/components/ui/quote-rule";
import { createClient } from "@/lib/supabase/server";
import { getShellContext } from "@/lib/get-shell-context";
import type { Job } from "@/lib/types";

export default async function InterviewIndexPage() {
  const ctx = await getShellContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("status", "interview")
    .order("interview_at", { ascending: true });
  const jobs = (data ?? []) as Job[];

  return (
    <AppShell
      active="interview"
      crumbs={["Hyrd", "AI Interview"]}
      user={ctx.user}
      upNext={ctx.upNext}
    >
      <div style={{ padding: "40px 56px 64px", display: "flex", flexDirection: "column", gap: 32 }}>
        <div>
          <Eyebrow>№ 07 · AI Interview</Eyebrow>
          <h1
            className="serif"
            style={{ fontSize: 56, letterSpacing: "-0.035em", margin: "10px 0 0", fontWeight: 400 }}
          >
            Pick a role, two minutes, voice only.
          </h1>
        </div>

        {jobs.length === 0 ? (
          <QuoteRule attribution="Move a card into Interview to begin.">
            The mock is tuned to a specific JD — the value is in that calibration.
          </QuoteRule>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {jobs.map((j) => (
              <Link
                key={j.id}
                href={`/interview/${j.id}`}
                className="row"
                style={{
                  gridTemplateColumns: "auto 1fr auto auto",
                  gap: 16,
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                <LogoSq name={j.company} color={j.brand_color} size={36} />
                <div>
                  <div style={{ fontSize: 14 }}>{j.role}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-4)" }}>{j.company}</div>
                </div>
                <span className="chip chip-accent">
                  {j.interview_at
                    ? new Date(j.interview_at).toLocaleDateString("en-US", {
                        weekday: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "Anytime"}
                </span>
                <span className="btn btn-accent btn-sm">
                  <Mic size={14} /> Begin
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
