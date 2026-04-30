import Link from "next/link";
import { ArrowRight, Plus, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Chip } from "@/components/ui/chip";
import { LogoSq } from "@/components/ui/logo-sq";
import { SectionMark } from "@/components/ui/section-mark";
import { Sparkline } from "@/components/charts/sparkline";
import { Stagger, StaggerItem } from "@/components/motion";
import { createClient } from "@/lib/supabase/server";
import { getShellContext } from "@/lib/get-shell-context";
import type { Job } from "@/lib/types";
import { formatDaysAgo } from "@/lib/utils";

const STATUSES: Array<Job["status"]> = ["saved", "applied", "interview", "offer", "rejected"];

export default async function DashboardPage() {
  const ctx = await getShellContext();
  const supabase = await createClient();
  const { data: jobs = [] } = await supabase
    .from("jobs")
    .select("*")
    .order("position", { ascending: true });

  const all = (jobs ?? []) as Job[];
  const counts = STATUSES.reduce<Record<Job["status"], number>>(
    (acc, s) => ({ ...acc, [s]: all.filter((j) => j.status === s).length }),
    { saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 },
  );
  const interviews = all
    .filter((j) => j.status === "interview" && j.interview_at)
    .sort((a, b) => new Date(a.interview_at!).getTime() - new Date(b.interview_at!).getTime())
    .slice(0, 3);

  const trend = [62, 68, 71, 70, 76, 79, 78, 82, 85, 84, 86, 88, 86, 89];
  const greeting =
    new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
  const firstName = ctx.user.name.split(" ")[0];
  const interviewCount = counts.interview;

  return (
    <AppShell
      active="home"
      crumbs={["Hyrd", "Home"]}
      user={ctx.user}
      upNext={ctx.upNext}
      topnavRight={
        <>
          <Link href="/jobs" className="btn btn-secondary btn-sm">
            <Plus className="ic" /> Add job
          </Link>
          <Link href="/optimize" className="btn btn-accent btn-sm">
            <Sparkles className="ic" /> Optimize résumé
          </Link>
        </>
      }
    >
      <Stagger style={{ padding: "40px 56px 64px", display: "flex", flexDirection: "column", gap: 40 }}>
        {/* Greeting hero */}
        <StaggerItem><div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderBottom: "1px solid var(--ink)",
            paddingBottom: 24,
          }}
        >
          <div>
            <Eyebrow>
              {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
            </Eyebrow>
            <h1
              className="serif"
              style={{
                fontSize: 64,
                lineHeight: 1.0,
                letterSpacing: "-0.035em",
                margin: "10px 0 0",
                fontWeight: 400,
                textWrap: "balance",
              }}
            >
              {greeting}, <em style={{ fontStyle: "italic" }}>{firstName}</em>.<br />
              <span style={{ color: "var(--ink-3)" }}>{all.length} active applications.</span>{" "}
              <em style={{ fontStyle: "italic", color: "var(--accent)" }}>
                {interviewCount} interview{interviewCount === 1 ? "" : "s"}
              </em>{" "}
              this week.
            </h1>
          </div>
        </div></StaggerItem>

        {/* Top row */}
        <StaggerItem><div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1fr", gap: 16 }}>
          {/* Primary CTA */}
          <div
            className="card"
            style={{
              padding: 28,
              background: "var(--ink)",
              color: "var(--bg)",
              borderColor: "var(--ink)",
              display: "flex",
              flexDirection: "column",
              gap: 18,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Eyebrow style={{ color: "#a8a397" }}>Primary action</Eyebrow>
            <div className="serif" style={{ fontSize: 32, lineHeight: 1.05, letterSpacing: "-0.025em" }}>
              Tailor a résumé to a job description.
            </div>
            <p style={{ color: "#c8c2b3", fontSize: 13.5, margin: 0, maxWidth: "42ch", lineHeight: 1.55 }}>
              Drop in any JD and we will quantify your bullets, weave in the right keywords, and return a recruiter-grade draft in about 30 seconds.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <Link href="/optimize" className="btn btn-accent">
                Start optimizing <ArrowRight className="ic" />
              </Link>
              <Link href="/optimize" className="btn btn-ghost" style={{ color: "#c8c2b3" }}>
                See last result
              </Link>
            </div>
            <div
              className="serif"
              aria-hidden="true"
              style={{
                position: "absolute",
                right: -12,
                bottom: -56,
                fontSize: 280,
                lineHeight: 1,
                color: "#ffffff08",
                letterSpacing: "-0.05em",
                fontStyle: "italic",
                pointerEvents: "none",
              }}
            >
              R
            </div>
          </div>

          {/* Up next */}
          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Eyebrow>Up next · Interviews</Eyebrow>
              <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>{interviews.length} this week</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {interviews.length === 0 && (
                <div
                  className="quote-rule"
                  style={{ fontSize: 16, padding: "8px 0 8px 20px", marginTop: 4 }}
                >
                  No interviews scheduled. Move a card to Interview to begin prep.
                </div>
              )}
              {interviews.map((u, i) => (
                <Link
                  key={u.id}
                  href={`/jobs?open=${u.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 14,
                    alignItems: "center",
                    padding: "14px 0",
                    borderBottom: i < interviews.length - 1 ? "1px solid var(--hairline)" : "none",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <LogoSq name={u.company} color={u.brand_color} size={36} />
                  <div>
                    <div style={{ fontSize: 14, color: "var(--ink)" }}>{u.role}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 2 }}>
                      {u.company} ·{" "}
                      {new Date(u.interview_at!).toLocaleDateString("en-US", {
                        weekday: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      className="serif tnum"
                      style={{
                        fontSize: 18,
                        color: i === 0 ? "var(--accent)" : "var(--ink)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {timeUntil(u.interview_at!)}
                    </div>
                    <Eyebrow style={{ fontSize: 9.5 }}>until</Eyebrow>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Trend */}
          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            <Eyebrow>Recent performance</Eyebrow>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span className="serif tnum" style={{ fontSize: 56, letterSpacing: "-0.04em", lineHeight: 1 }}>
                86
              </span>
              <span style={{ color: "var(--ink-4)", fontSize: 13 }}>avg score</span>
              <Chip kind="positive" style={{ marginLeft: "auto" }}>+8 vs prior</Chip>
            </div>
            <Sparkline values={trend} width={240} height={48} accent="var(--accent)" />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Eyebrow>14 mock interviews · 30d</Eyebrow>
              <Link href="/performance" className="eyebrow" style={{ color: "var(--ink-3)", textDecoration: "none" }}>
                see all →
              </Link>
            </div>
          </div>
        </div></StaggerItem>

        {/* Kanban preview */}
        <StaggerItem><div>
          <SectionMark
            num="01"
            title="Job tracker"
            right={
              <Link href="/jobs" className="btn btn-ghost btn-sm">
                Open board <ArrowRight className="ic" />
              </Link>
            }
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
            {STATUSES.map((s) => {
              const items = all.filter((j) => j.status === s).slice(0, 2);
              const accent = s === "interview";
              return (
                <div
                  key={s}
                  className="card"
                  style={{
                    padding: 14,
                    background: accent ? "var(--bg-raised)" : "var(--bg)",
                    borderColor: accent ? "var(--accent)" : "var(--hairline)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <span className="label">{labelFor(s)}</span>
                    <span className="serif tnum" style={{ fontSize: 14 }}>
                      {counts[s]}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {items.map((it) => (
                      <div
                        key={it.id}
                        style={{
                          background: "var(--bg-raised)",
                          border: "1px solid var(--hairline)",
                          borderRadius: 8,
                          padding: 10,
                        }}
                      >
                        <div style={{ fontSize: 12.5, color: "var(--ink)", letterSpacing: "-0.005em" }}>
                          {it.role}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 2 }}>{it.company}</div>
                        {it.status === "interview" && it.interview_at && (
                          <Chip kind="accent" style={{ marginTop: 8 }}>
                            {new Date(it.interview_at).toLocaleDateString("en-US", {
                              weekday: "short",
                              hour: "numeric",
                            })}
                          </Chip>
                        )}
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div style={{ fontSize: 11, color: "var(--ink-4)", textAlign: "center", padding: "6px 0" }}>—</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div></StaggerItem>
      </Stagger>
    </AppShell>
  );
}

function labelFor(s: Job["status"]) {
  return { saved: "Saved", applied: "Applied", interview: "Interview", offer: "Offer", rejected: "Rejected" }[s];
}

function timeUntil(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return "now";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days <= 0) return `${hours}h`;
  if (days < 2 && hours > 0) return `${days}d ${hours}h`;
  return `${days}d`;
}
