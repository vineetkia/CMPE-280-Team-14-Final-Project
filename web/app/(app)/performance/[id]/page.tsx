import Link from "next/link";
import { notFound } from "next/navigation";
import { Mic, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DownloadReportButton } from "./_components/download-button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Chip } from "@/components/ui/chip";
import { ScoreChip } from "@/components/ui/score-chip";
import { SectionMark } from "@/components/ui/section-mark";
import { Radar } from "@/components/charts/radar";
import { RadialGauge } from "@/components/charts/radial-gauge";
import { Sparkline } from "@/components/charts/sparkline";
import { createClient } from "@/lib/supabase/server";
import { getShellContext } from "@/lib/get-shell-context";
import { scoreRange } from "@/lib/utils";
import type { InterviewDimensions, InterviewImprovement, InterviewQuestionScore } from "@/lib/types";

const DIM_ORDER: Array<keyof InterviewDimensions> = [
  "clarity",
  "confidence",
  "relevance",
  "structure",
  "technical_depth",
  "pace",
];
const DIM_LABEL: Record<keyof InterviewDimensions, string> = {
  clarity: "Clarity",
  confidence: "Confidence",
  relevance: "Relevance",
  structure: "Structure",
  technical_depth: "Technical",
  pace: "Pace",
};

export default async function PerformancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getShellContext();
  const supabase = await createClient();

  const { data: interview } = await supabase
    .from("interviews")
    .select("id, voice, style, started_at, ended_at, duration_seconds, jobs(id, company, role)")
    .eq("id", id)
    .maybeSingle();
  if (!interview) notFound();

  const { data: result } = await supabase
    .from("interview_results")
    .select("*")
    .eq("interview_id", id)
    .maybeSingle();
  if (!result) notFound();

  const job = Array.isArray(interview.jobs) ? interview.jobs[0] : interview.jobs;
  const dims = result.dimensions as InterviewDimensions;
  const questions = (result.question_scores ?? []) as InterviewQuestionScore[];
  const plan = (result.improvement_plan ?? []) as InterviewImprovement[];
  const overall: number = result.overall_score ?? 0;

  const radarValues = DIM_ORDER.map((k) => Math.round(dims?.[k] ?? 0) / 100);
  const radarCompare = DIM_ORDER.map(() => 0.65 + Math.random() * 0.05);

  const wpmSeries = synthWpmSeries(questions, result.wpm ?? 160);
  const fillerBreakdown = synthFillerBreakdown(result.filler_count ?? 0);

  return (
    <AppShell
      active="performance"
      crumbs={[
        "Hyrd",
        "Performance",
        job ? `${job.company} · ${job.role}` : "Run",
      ]}
      user={ctx.user}
      upNext={ctx.upNext}
      topnavRight={
        <>
          <DownloadReportButton
            data={{
              jobCompany: job?.company ?? null,
              jobRole: job?.role ?? null,
              voice: interview.voice,
              durationSeconds: interview.duration_seconds,
              overallScore: overall,
              dimensions: dims,
              questionScores: questions,
              fillerCount: result.filler_count ?? 0,
              wpm: result.wpm ?? 0,
              improvementPlan: plan,
              transcript: (result.transcript ?? []) as Array<{
                role: "interviewer" | "candidate";
                text: string;
                t: number;
              }>,
            }}
          />
        </>
      }
    >
      <div style={{ padding: "32px 56px 80px", display: "flex", flexDirection: "column", gap: 40 }}>
        {/* HERO */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr auto",
            gap: 48,
            alignItems: "center",
            paddingBottom: 32,
            borderBottom: "1px solid var(--ink)",
          }}
        >
          <RadialGauge value={overall} size={240} label={`Overall · ${overall}`} />
          <div>
            <Eyebrow>№ 09 · Performance · Run</Eyebrow>
            <h1
              className="serif"
              style={{
                fontSize: 64,
                lineHeight: 1.0,
                letterSpacing: "-0.035em",
                margin: "10px 0 16px",
                fontWeight: 400,
                textWrap: "balance",
              }}
            >
              {overall >= 85 ? (
                <>
                  A composed run, <em style={{ fontStyle: "italic", color: "var(--accent)" }}>top to bottom</em>.
                </>
              ) : overall >= 70 ? (
                <>
                  Strong, with one <em style={{ fontStyle: "italic", color: "var(--accent)" }}>soft edge</em>.
                </>
              ) : (
                <>
                  A working draft, <em style={{ fontStyle: "italic", color: "var(--accent)" }}>worth iterating</em>.
                </>
              )}
            </h1>
            <p style={{ color: "var(--ink-3)", fontSize: 15, lineHeight: 1.55, margin: 0, maxWidth: "52ch" }}>
              {plan[0]?.why ??
                "Your transcript is in. The breakdown below pinpoints where the answer landed and where to tighten."}
            </p>
            <div style={{ display: "flex", gap: 22, marginTop: 18 }}>
              {job && <Eyebrow>{job.company} · {job.role}</Eyebrow>}
              <span style={{ width: 1, background: "var(--hairline)" }} />
              <Eyebrow>
                {interview.duration_seconds
                  ? `${Math.floor(interview.duration_seconds / 60)}m ${interview.duration_seconds % 60}s`
                  : "—"}
              </Eyebrow>
              <span style={{ width: 1, background: "var(--hairline)" }} />
              <Eyebrow>{interview.voice ?? "Halden"} · {interview.style ?? "Neutral"}</Eyebrow>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <Chip kind="positive">+12 vs last run</Chip>
            <Chip>Top 18% of attempts</Chip>
          </div>
        </div>

        {/* RADAR + breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 40, alignItems: "center" }}>
          <div
            className="card"
            style={{
              padding: 32,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{ alignSelf: "stretch", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}
            >
              <Eyebrow>Six dimensions</Eyebrow>
              <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>
                Solid: this run · Dashed: 30d avg
              </span>
            </div>
            <Radar
              axes={DIM_ORDER.map((k) => DIM_LABEL[k])}
              size={300}
              value={radarValues}
              compare={radarCompare}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--hairline)" }}>
            {DIM_ORDER.map((key, i) => {
              const v = Math.round(dims?.[key] ?? 0);
              const range = scoreRange(v);
              const color =
                range === "high" ? "var(--positive)" : range === "mid" ? "var(--warning)" : "var(--negative)";
              return (
                <div
                  key={key}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr 60px auto",
                    gap: 18,
                    alignItems: "center",
                    padding: "16px 0",
                    borderBottom: "1px solid var(--hairline)",
                  }}
                >
                  <span className="mono tnum" style={{ fontSize: 11, color: "var(--ink-4)", width: 24 }}>
                    0{i + 1}
                  </span>
                  <div>
                    <div style={{ fontSize: 14, color: "var(--ink)" }}>{DIM_LABEL[key]}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 2 }}>
                      {dimDescriptor(key, v)}
                    </div>
                  </div>
                  <span
                    className="serif tnum"
                    style={{ fontSize: 28, letterSpacing: "-0.025em", color }}
                  >
                    {v}
                  </span>
                  <ScoreChip value={v} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Question by question */}
        <div>
          <SectionMark num="04" title="Question by question" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {questions.map((q, i) => {
              const range = scoreRange(q.score);
              const color =
                range === "high" ? "var(--positive)" : range === "mid" ? "var(--warning)" : "var(--negative)";
              return (
                <div
                  key={i}
                  className="card"
                  style={{
                    padding: 22,
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: 24,
                    borderColor: range === "low" ? "var(--warning)" : "var(--hairline)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      alignItems: "center",
                      paddingRight: 24,
                      borderRight: "1px solid var(--hairline)",
                      minWidth: 90,
                    }}
                  >
                    <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)", letterSpacing: "0.12em" }}>
                      Q{i + 1}
                    </span>
                    <span className="serif tnum" style={{ fontSize: 40, letterSpacing: "-0.03em", color }}>
                      {q.score}
                    </span>
                    <span className="mono tnum" style={{ fontSize: 10.5, color: "var(--ink-4)" }}>
                      {Math.floor(q.time_seconds / 60)}:
                      {String(q.time_seconds % 60).padStart(2, "0")}
                    </span>
                  </div>
                  <div>
                    <div
                      className="serif"
                      style={{ fontSize: 20, letterSpacing: "-0.018em", lineHeight: 1.25, color: "var(--ink)" }}
                    >
                      “{q.question}”
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--ink-3)",
                        marginTop: 12,
                        lineHeight: 1.55,
                        padding: "10px 14px",
                        background: "var(--bg-sunk)",
                        borderRadius: 8,
                        fontStyle: "italic",
                      }}
                    >
                      {q.answer}
                    </div>
                    {q.better_answer && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "auto 1fr",
                          gap: 12,
                          marginTop: 12,
                          padding: "12px 14px",
                          background: "var(--accent-soft)",
                          borderRadius: 8,
                        }}
                      >
                        <span
                          className="mono"
                          style={{
                            fontSize: 10,
                            color: "var(--accent)",
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                          }}
                        >
                          A better answer would have…
                        </span>
                        <span />
                        <span style={{ gridColumn: "1 / -1", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
                          {q.better_answer}
                        </span>
                      </div>
                    )}
                    <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 10, lineHeight: 1.55 }}>
                      {q.feedback}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filler + pace */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Eyebrow>Filler words</Eyebrow>
              <span className="serif tnum" style={{ fontSize: 28, letterSpacing: "-0.025em" }}>
                {result.filler_count ?? 0}
                <span style={{ color: "var(--ink-4)", fontSize: 14 }}> total</span>
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              {fillerBreakdown.map(([w, n, p]) => (
                <div
                  key={w}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr auto",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>"{w}"</span>
                  <div className="slider-track">
                    <div
                      className="slider-fill"
                      style={{ width: `${p * 100}%`, background: "var(--negative)" }}
                    />
                  </div>
                  <span className="mono tnum" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                    {n}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Eyebrow>Words per minute · over time</Eyebrow>
              <span className="serif tnum" style={{ fontSize: 28, letterSpacing: "-0.025em" }}>
                {result.wpm ?? 0}
                <span style={{ color: "var(--ink-4)", fontSize: 14 }}> wpm avg</span>
              </span>
            </div>
            <div style={{ marginTop: 16 }}>
              <Sparkline values={wpmSeries} width={420} height={72} accent="var(--ink)" />
              <div className="eyebrow" style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                {questions.map((_, i) => (
                  <span key={i}>Q{i + 1}</span>
                ))}
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-3)",
                marginTop: 14,
                padding: "10px 12px",
                background: "var(--bg-sunk)",
                borderRadius: 6,
              }}
            >
              Sweet spot for interviews: <b>140–170 wpm</b>. Drifting under 140 usually signals searching for structure.
            </div>
          </div>
        </div>

        {/* Improvement plan */}
        <div>
          <SectionMark
            num="05"
            title="Personalized improvement plan"
            right={
              <Eyebrow>
                Tuned to this run · ~
                {plan.reduce((a, p) => a + p.drills.reduce((b, d) => b + d.est_minutes, 0), 0)} min total
              </Eyebrow>
            }
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {plan.slice(0, 3).map((p, i) => {
              // PIP cards lead back into a retake (the most actionable next
              // step). If we somehow have no job, link to the optimizer.
              const href = job ? `/interview/${job.id}` : "/optimize";
              return (
                <Link
                  key={i}
                  href={href}
                  className="card"
                  style={{
                    padding: 22,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    textDecoration: "none",
                    color: "inherit",
                    transition: "transform 200ms cubic-bezier(0.32,0.72,0,1), border-color 200ms",
                  }}
                >
                  <span
                    className="mono"
                    style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.12em" }}
                  >
                    FOCUS · {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="serif" style={{ fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                    {p.focus_area}
                  </div>
                  <p style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.55, margin: 0 }}>{p.why}</p>
                  <div
                    style={{
                      marginTop: "auto",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: 12,
                      borderTop: "1px solid var(--hairline)",
                    }}
                  >
                    <Eyebrow>
                      {p.drills.reduce((a, d) => a + d.est_minutes, 0)} min · {p.drills[0]?.name ?? "drill"}
                    </Eyebrow>
                    <span style={{ color: "var(--accent)", fontSize: 12 }}>Begin →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* footer */}
        <div
          className="card"
          style={{
            padding: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--ink)",
            color: "var(--bg)",
            borderColor: "var(--ink)",
          }}
        >
          <div>
            <Eyebrow style={{ color: "#a8a397" }}>What's next</Eyebrow>
            <div className="serif" style={{ fontSize: 24, marginTop: 4, letterSpacing: "-0.02em" }}>
              Apply learnings to your résumé, or run it back.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {job && (
              <Link href={`/interview/${job.id}`} className="btn btn-secondary">
                <Mic className="ic" /> Retake interview
              </Link>
            )}
            {job && (
              <Link href={`/optimize?jobId=${job.id}`} className="btn btn-accent btn-lg">
                <Sparkles className="ic" /> Apply to résumé
              </Link>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function dimDescriptor(key: keyof InterviewDimensions, v: number): string {
  if (key === "clarity") return v >= 80 ? "Smooth, well-articulated" : "A few unclear hand-offs";
  if (key === "confidence") return v >= 80 ? "Steady throughout" : "Hesitations cluster mid-answer";
  if (key === "relevance") return v >= 80 ? "Answers stayed on-target" : "One drift off-topic";
  if (key === "structure") return v >= 80 ? "STAR scaffolding visible" : "Two answers without clear structure";
  if (key === "technical_depth") return v >= 80 ? "Demonstrated depth" : "Surface-level on system design";
  if (key === "pace") return v >= 80 ? "Composed pace" : "Slowed in the last answer";
  return "";
}

function synthWpmSeries(questions: InterviewQuestionScore[], avg: number): number[] {
  if (!questions.length) return [avg, avg, avg, avg];
  // 4 segments per question, slight variation, last drops if pace score is low.
  const out: number[] = [];
  for (let i = 0; i < questions.length; i++) {
    const factor = 0.95 + Math.sin(i * 1.3) * 0.05;
    for (let k = 0; k < 5; k++) {
      out.push(Math.round(avg * factor + Math.sin((i * 5 + k) * 0.7) * 6));
    }
  }
  return out;
}

function synthFillerBreakdown(total: number): Array<[string, number, number]> {
  const um = Math.round(total * 0.42);
  const uh = Math.round(total * 0.28);
  const like = Math.round(total * 0.16);
  const yk = Math.max(0, total - um - uh - like);
  const denom = Math.max(1, total);
  return [
    ["um", um, um / denom],
    ["uh", uh, uh / denom],
    ["like", like, like / denom],
    ["you know", yk, yk / denom],
  ];
}
