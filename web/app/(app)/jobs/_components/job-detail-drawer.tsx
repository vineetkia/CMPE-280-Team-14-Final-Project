"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Link2, Mic, MoreHorizontal, X } from "lucide-react";
import type { Job } from "@/lib/types";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Chip } from "@/components/ui/chip";
import { LogoSq } from "@/components/ui/logo-sq";
import { ScoreChip } from "@/components/ui/score-chip";
import { QuoteRule } from "@/components/ui/quote-rule";
import { motion, drawerEnter, scrim } from "@/components/motion";

type Tab = "overview" | "jd" | "resumes" | "notes" | "timeline";

interface ResumeMeta {
  id: string;
  job_id: string | null;
  ats_score: number | null;
  label: string | null;
  is_active: boolean | null;
}

export function JobDetailDrawer({
  job,
  resumes,
  onClose,
}: {
  job: Job;
  resumes: ResumeMeta[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const linkedResumes = resumes.filter((r) => r.job_id === job.id);
  const interviewWhen = job.interview_at
    ? new Date(job.interview_at).toLocaleDateString("en-US", {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;
  const isInterview = job.status === "interview";

  return (
    <>
      <motion.div
        key="scrim"
        onClick={onClose}
        variants={scrim}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,14,10,0.32)",
          zIndex: 40,
        }}
      />
      <motion.div
        key="drawer"
        role="dialog"
        aria-modal="true"
        variants={drawerEnter}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 600,
          background: "var(--bg)",
          boxShadow: "var(--shadow-4)",
          borderLeft: "1px solid var(--hairline)",
          display: "flex",
          flexDirection: "column",
          zIndex: 50,
        }}
      >
        {/* header */}
        <div
          style={{
            padding: "20px 28px",
            borderBottom: "1px solid var(--hairline)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="btn btn-icon btn-ghost btn-sm" onClick={onClose} aria-label="Close">
              <X size={14} />
            </button>
            <Eyebrow>Job · {job.status[0]!.toUpperCase() + job.status.slice(1)}</Eyebrow>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {job.source_url && (
              <a
                className="btn btn-ghost btn-sm"
                href={job.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Link2 size={14} /> Source
              </a>
            )}
            <button className="btn btn-ghost btn-sm" aria-label="More">
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* hero */}
        <div style={{ padding: "28px 28px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <LogoSq name={job.company} color={job.brand_color} size={48} />
            <div style={{ flex: 1 }}>
              <Eyebrow>
                {job.company} · {job.location ?? "—"} · Posted {Math.floor((Date.now() - new Date(job.created_at).getTime()) / 86_400_000)}d
              </Eyebrow>
              <h2 className="serif" style={{ fontSize: 28, letterSpacing: "-0.025em", margin: "4px 0 6px", fontWeight: 500 }}>
                {job.role}
              </h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(job.salary_min || job.salary_max) && (
                  <Chip>
                    ${Math.round((job.salary_min ?? 0) / 1000)}–
                    ${Math.round((job.salary_max ?? 0) / 1000)}k
                  </Chip>
                )}
                <Chip>Full-time</Chip>
                {interviewWhen && <Chip kind="accent">Interview · {interviewWhen}</Chip>}
              </div>
            </div>
          </div>

          {isInterview && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 16,
                alignItems: "center",
                padding: "16px 18px",
                background: "var(--ink)",
                color: "var(--bg)",
                borderRadius: 12,
                marginTop: 8,
              }}
            >
              <div>
                <Eyebrow style={{ color: "#a8a397" }}>Recommended</Eyebrow>
                <div className="serif" style={{ fontSize: 18, marginTop: 4, letterSpacing: "-0.015em" }}>
                  Take a 2-minute mock interview.
                </div>
                <div style={{ fontSize: 12, color: "#c8c2b3", marginTop: 4 }}>
                  Tuned to this JD · 4 questions · saved transcript.
                </div>
              </div>
              <Link href={`/interview/${job.id}`} className="btn btn-accent btn-lg">
                <Mic size={14} /> Start mock
              </Link>
            </div>
          )}
        </div>

        {/* tabs */}
        <div style={{ padding: "0 28px" }}>
          <div className="tabs">
            {(
              [
                ["overview", "Overview", undefined],
                ["jd", "JD", undefined],
                ["resumes", "Résumé versions", linkedResumes.length],
                ["notes", "Notes", job.notes ? 1 : 0],
                ["timeline", "Timeline", undefined],
              ] as Array<[Tab, string, number | undefined]>
            ).map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                className="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
              >
                {label}
                {count != null && count > 0 && <span className="count tnum">{count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* tab body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <Eyebrow>Active résumé version</Eyebrow>
                {linkedResumes.length === 0 ? (
                  <QuoteRule>No résumé tailored for this role yet.</QuoteRule>
                ) : (
                  linkedResumes
                    .filter((r) => r.is_active)
                    .slice(0, 1)
                    .map((r) => (
                      <div
                        key={r.id}
                        className="card"
                        style={{
                          padding: 16,
                          marginTop: 10,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, color: "var(--ink)" }}>{r.label ?? "Tailored version"}</div>
                          <div style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 2 }}>
                            ATS {r.ats_score ?? "—"} · saved
                          </div>
                        </div>
                        {r.ats_score != null && <ScoreChip value={r.ats_score} />}
                      </div>
                    ))
                )}
              </div>

              <div>
                <Eyebrow>Notes · most recent</Eyebrow>
                {job.notes ? (
                  <div
                    className="card"
                    style={{
                      padding: 16,
                      marginTop: 10,
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontSize: 16,
                      lineHeight: 1.45,
                      color: "var(--ink-2)",
                    }}
                  >
                    “{job.notes}”
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontStyle: "normal",
                        fontSize: 10.5,
                        color: "var(--ink-4)",
                        marginTop: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {new Date(job.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                ) : (
                  <QuoteRule>No notes yet — start a thought, anything.</QuoteRule>
                )}
              </div>
            </div>
          )}

          {tab === "resumes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Eyebrow>Tailored versions for this role</Eyebrow>
              {linkedResumes.length === 0 && <QuoteRule>No tailored versions yet.</QuoteRule>}
              {linkedResumes.map((r) => (
                <div
                  key={r.id}
                  className="card"
                  style={{
                    padding: 16,
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    gap: 16,
                    alignItems: "center",
                    borderColor: r.is_active ? "var(--ink)" : "var(--hairline)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14 }}>{r.label ?? "Tailored version"}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-4)" }}>1 page</div>
                  </div>
                  {r.ats_score != null && <ScoreChip value={r.ats_score} />}
                  <span className="toggle" aria-checked={r.is_active ? "true" : "false"} role="switch" />
                </div>
              ))}
              <Link href="/optimize" className="btn btn-secondary" style={{ alignSelf: "flex-start", marginTop: 4 }}>
                <Mic size={14} /> New version
              </Link>
            </div>
          )}

          {tab === "jd" && (
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                lineHeight: 1.6,
                color: "var(--ink-2)",
                whiteSpace: "pre-wrap",
              }}
            >
              {job.jd_text ?? <QuoteRule>No JD captured for this role.</QuoteRule>}
            </div>
          )}

          {tab === "notes" &&
            (job.notes ? (
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 18,
                  lineHeight: 1.45,
                  color: "var(--ink-2)",
                }}
              >
                {job.notes}
              </div>
            ) : (
              <QuoteRule>No notes yet — start a thought, anything.</QuoteRule>
            ))}

          {tab === "timeline" && (
            <div style={{ display: "flex", flexDirection: "column", paddingLeft: 14, position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: 4,
                  top: 6,
                  bottom: 6,
                  width: 1,
                  background: "var(--hairline-3)",
                }}
              />
              {[
                ...(job.interview_at
                  ? [
                      {
                        d: new Date(job.interview_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                        t: `Interview scheduled · ${interviewWhen}`,
                        accent: true,
                      },
                    ]
                  : []),
                {
                  d: new Date(job.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                  t: `Status moved to ${job.status}`,
                  accent: false,
                },
                {
                  d: new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                  t: "Saved role",
                  accent: false,
                },
              ].map((e, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr",
                    gap: 14,
                    padding: "10px 0",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: -10,
                      top: 14,
                      width: 7,
                      height: 7,
                      borderRadius: 50,
                      background: e.accent ? "var(--accent)" : "var(--ink)",
                    }}
                  />
                  <span
                    className="mono"
                    style={{
                      fontSize: 10.5,
                      color: "var(--ink-4)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {e.d}
                  </span>
                  <span style={{ fontSize: 13.5, color: e.accent ? "var(--accent)" : "var(--ink-2)" }}>{e.t}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            padding: 20,
            borderTop: "1px solid var(--hairline)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Link href={`/optimize?jobId=${job.id}`} className="btn btn-ghost">
            Optimize résumé
          </Link>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" type="button" onClick={onClose}>
              Close
            </button>
            {isInterview && (
              <Link href={`/interview/${job.id}`} className="btn btn-primary">
                Take mock interview
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
