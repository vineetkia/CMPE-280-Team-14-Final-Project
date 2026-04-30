"use client";

/**
 * Optimizer output — approval workflow + LaTeX-style preview.
 *
 * Each Azure-suggested change is opt-in. The user toggles checkboxes; the
 * center pane re-renders the résumé applying only approved changes against
 * the original parsed text. The ATS / keyword-coverage score recomputes on
 * the fly via a deterministic heuristic (no LLM round-trip per toggle).
 *
 * Center pane uses a classic LaTeX-CV layout (Computer Modern serif, narrow
 * column, 11pt). "Save as PDF" opens the print dialog so the browser
 * exports the same DOM as a PDF — no third-party PDF lib.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, Printer } from "lucide-react";
import type { OptimizedResume } from "@/lib/schemas/resume";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Chip } from "@/components/ui/chip";
import { motion } from "@/components/motion";

type Annotation = OptimizedResume["change_annotations"][number];

const SECTIONS = [
  { id: "summary", name: "Summary" },
  { id: "experience", name: "Experience" },
  { id: "skills", name: "Skills" },
  { id: "projects", name: "Projects" },
  { id: "education", name: "Education" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function OptimizerOutputView({
  resumeId,
  optimized,
  parsed,
  jdText,
}: {
  resumeId: string;
  optimized: OptimizedResume;
  parsed: OptimizedResume | null;
  jdText: string | null;
}) {
  // Treat optimized as the "all approved" version. parsed is base.
  // If parsed is null (legacy rows), use optimized's structure as base too.
  const base = parsed ?? optimized;

  // Each annotation is identified by its index in the array.
  // approved[i] === true means apply that change. Default: all approved.
  const [approved, setApproved] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(optimized.change_annotations.map((_, i) => [i, true])),
  );
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("experience");

  // Build the rendered résumé by replaying approved changes onto the base.
  const rendered = useMemo(
    () => applyApprovedChanges(base, optimized, approved),
    [base, optimized, approved],
  );

  // Dynamic ATS score — recompute as user toggles.
  const dynamicScores = useMemo(
    () => computeScores(rendered, optimized, jdText, approved),
    [rendered, optimized, jdText, approved],
  );

  function toggle(i: number) {
    setApproved((prev) => ({ ...prev, [i]: !prev[i] }));
  }
  function approveAll() {
    setApproved(
      Object.fromEntries(optimized.change_annotations.map((_, i) => [i, true])),
    );
  }
  function rejectAll() {
    setApproved(
      Object.fromEntries(optimized.change_annotations.map((_, i) => [i, false])),
    );
  }

  // Map annotation index → section id for cross-highlight.
  const annoSectionIndex = useMemo<Record<number, SectionId>>(() => {
    const out: Record<number, SectionId> = {};
    optimized.change_annotations.forEach((a, i) => {
      const s = a.section.toLowerCase();
      if (s.includes("experience")) out[i] = "experience";
      else if (s.includes("summary")) out[i] = "summary";
      else if (s.includes("skill")) out[i] = "skills";
      else if (s.includes("project")) out[i] = "projects";
      else if (s.includes("education")) out[i] = "education";
      else out[i] = "experience";
    });
    return out;
  }, [optimized]);

  // Annotation counts per section.
  const counts = useMemo(() => {
    const map: Record<string, { add: number; change: number }> = {};
    for (let i = 0; i < optimized.change_annotations.length; i++) {
      if (!approved[i]) continue;
      const a = optimized.change_annotations[i]!;
      const key = (annoSectionIndex[i] ?? "experience") as string;
      map[key] = map[key] ?? { add: 0, change: 0 };
      map[key]![a.kind === "add" ? "add" : "change"]++;
    }
    return map;
  }, [optimized, approved, annoSectionIndex]);

  function downloadPDF() {
    // Print dialog targets the rendered résumé via a print-only stylesheet.
    // The user picks "Save as PDF" in the dialog to export. We temporarily
    // override document.title so Chrome's printed header reads as the
    // candidate's name + role rather than "Hyrd — A premium career platform".
    const original = document.title;
    document.title = `${rendered.contact.name.replace(/\s+/g, "_")}_resume`;
    // Restore once the print dialog closes (covers both print + cancel).
    const restore = () => {
      document.title = original;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  const totalChanges = optimized.change_annotations.length;
  const approvedCount = Object.values(approved).filter(Boolean).length;

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr 380px",
          minHeight: "calc(100vh - 60px)",
        }}
        className="optimizer-grid"
      >
        {/* LEFT — section nav + diff legend with explainer */}
        <div
          className="optimizer-side"
          style={{
            borderRight: "1px solid var(--hairline)",
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            overflowY: "auto",
          }}
        >
          <Eyebrow>Sections</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {SECTIONS.map((s, i) => {
              const c = counts[s.id] ?? { add: 0, change: 0 };
              const total = c.add + c.change;
              const kind: "add" | "change" | "kept" =
                c.add > 0 && c.change === 0 ? "add" : total > 0 ? "change" : "kept";
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSection(s.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 10,
                    alignItems: "center",
                    padding: "10px",
                    borderRadius: 8,
                    background: activeSection === s.id ? "var(--bg-raised)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>
                    0{i + 1}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ink)" }}>{s.name}</span>
                  {total > 0 ? (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        background:
                          kind === "add" ? "var(--diff-add-bg)" : "var(--diff-change-bg)",
                        color: kind === "add" ? "var(--diff-add)" : "var(--diff-change)",
                        padding: "2px 6px",
                        borderRadius: 3,
                        letterSpacing: "0.06em",
                      }}
                    >
                      {kind === "add" ? "+" : "~"}
                      {total}
                    </span>
                  ) : (
                    <span className="mono" style={{ fontSize: 10, color: "var(--ink-5)" }}>
                      kept
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="rule" />
          <div>
            <Eyebrow>Diff legend</Eyebrow>
            <p style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 8, marginBottom: 12, lineHeight: 1.5 }}>
              Approve or reject each change on the right. Approved edits show
              up in the résumé below — green for added phrases, terracotta for
              rewrites. Toggle any to see how your ATS score moves.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    background: "var(--diff-add-bg)",
                    border: "1px solid var(--diff-add)",
                    borderRadius: 2,
                  }}
                />
                Added by Hyrd
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    background: "var(--diff-change-bg)",
                    border: "1px solid var(--diff-change)",
                    borderRadius: 2,
                  }}
                />
                Rewritten
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    background: "var(--bg-sunk)",
                    border: "1px solid var(--diff-kept)",
                    borderRadius: 2,
                  }}
                />
                Kept verbatim
              </div>
            </div>
          </div>
        </div>

        {/* CENTER — LaTeX-CV preview */}
        <div
          style={{
            padding: "32px 48px",
            overflowY: "auto",
            background: "var(--bg-sunk)",
          }}
        >
          <ResumePaper
            resume={rendered}
            optimized={optimized}
            approved={approved}
            annoSectionIndex={annoSectionIndex}
            hoveredAnno={hoveredIdx}
          />
        </div>

        {/* RIGHT — match scores + per-change approval */}
        <div
          className="optimizer-side"
          style={{
            borderLeft: "1px solid var(--hairline)",
            padding: "32px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            overflowY: "auto",
          }}
        >
          <div>
            <Eyebrow>Match scores</Eyebrow>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              {[
                { name: "ATS match", val: dynamicScores.ats, kind: pickKind(dynamicScores.ats) },
                {
                  name: "Keyword coverage",
                  val: dynamicScores.coverage,
                  kind: pickKind(dynamicScores.coverage),
                },
                {
                  name: "Quantification",
                  val: dynamicScores.quantification,
                  kind: pickKind(dynamicScores.quantification),
                },
                {
                  name: "Length / readability",
                  val: dynamicScores.readability,
                  kind: pickKind(dynamicScores.readability),
                },
              ].map((m) => (
                <ScoreBar key={m.name} name={m.name} value={m.val} kind={m.kind} />
              ))}
            </div>
          </div>

          <div className="rule" />

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Eyebrow>Suggested edits</Eyebrow>
              <Chip>
                {approvedCount} / {totalChanges}
              </Chip>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={approveAll}
                style={{ flex: 1 }}
              >
                Approve all
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={rejectAll}
                style={{ flex: 1 }}
              >
                Reject all
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              {optimized.change_annotations.map((n, i) => (
                <AnnotationCard
                  key={i}
                  index={i}
                  anno={n}
                  approved={!!approved[i]}
                  onToggle={() => toggle(i)}
                  onHover={(hover) => setHoveredIdx(hover ? i : null)}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: 4, justifyContent: "center" }}
            onClick={downloadPDF}
          >
            <Printer size={14} /> Save as PDF
          </button>
          <p style={{ fontSize: 11, color: "var(--ink-4)", margin: 0, textAlign: "center" }}>
            Print dialog opens — choose "Save as PDF" as destination.
          </p>
        </div>
      </div>

    </>
  );
}

// ─── Resume paper · LaTeX-CV typography ─────────────────────────────────
function ResumePaper({
  resume,
  optimized,
  approved,
  annoSectionIndex,
  hoveredAnno,
}: {
  resume: OptimizedResume;
  optimized: OptimizedResume;
  approved: Record<number, boolean>;
  annoSectionIndex: Record<number, SectionId>;
  hoveredAnno: number | null;
}) {
  const hoveredSection = hoveredAnno != null ? annoSectionIndex[hoveredAnno] : null;
  const flash = (id: SectionId) => hoveredSection === id;

  return (
    <div
      className="resume-paper"
      style={{
        background: "#ffffff",
        // Letter at 96dpi · 8.5in × ~11in. Width caps at 720 for readable preview.
        maxWidth: 720,
        margin: "0 auto",
        padding: "44px 56px",
        boxShadow: "var(--shadow-3)",
        // Latin Modern Roman is the LaTeX default. We try (a) the local
        // installed copy if the user has TeXLive, (b) EB Garamond from
        // Google Fonts (faithful classic-academic-CV fallback), then any
        // quality serif. The result reads as a compiled article{} document.
        fontFamily:
          '"Latin Modern Roman", "EB Garamond", "Iowan Old Style", "Palatino", Georgia, serif',
        color: "#15140f",
        lineHeight: 1.45,
      }}
    >
      {/* Header — name centered, classic LaTeX-CV style */}
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: "0.04em",
            margin: 0,
            textTransform: "none",
          }}
        >
          {resume.contact.name}
        </h1>
        <div
          style={{ fontSize: 11, color: "#555048", marginTop: 4, fontFamily: "inherit" }}
        >
          {[
            resume.contact.location,
            resume.contact.email,
            resume.contact.phone,
            ...(resume.contact.links ?? []),
          ]
            .filter(Boolean)
            .join("  ·  ")}
        </div>
      </div>

      <div style={{ height: 1, background: "#15140f", marginBottom: 16 }} />

      <Section title="Summary" highlight={flash("summary")}>
        <p style={{ fontSize: 12.5, margin: 0 }}>
          {highlightInline(resume.summary, optimized, approved)}
        </p>
      </Section>

      <Section title="Experience" highlight={flash("experience")}>
        {resume.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                {exp.role} · <span style={{ fontWeight: 400, fontStyle: "italic" }}>{exp.company}</span>
              </div>
              <div style={{ fontSize: 11, color: "#555048", fontFamily: "ui-monospace, monospace" }}>
                {exp.start} — {exp.end}
              </div>
            </div>
            <ul
              style={{
                margin: "4px 0 0",
                padding: "0 0 0 16px",
                listStyle: "disc outside",
                fontSize: 11.5,
                lineHeight: 1.5,
              }}
            >
              {exp.bullets.map((b, j) => (
                <li key={j} style={{ marginBottom: 2 }}>
                  {highlightInline(b, optimized, approved)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>

      <Section title="Skills" highlight={flash("skills")}>
        <div style={{ fontSize: 11.5, fontFamily: "inherit" }}>
          {resume.skills.map((s, i) => {
            const isAdd = isAddedSkill(s, optimized, approved);
            return (
              <span
                key={s}
                style={{
                  background: isAdd ? "var(--diff-add-bg)" : "transparent",
                  color: isAdd ? "var(--diff-add)" : "inherit",
                  padding: isAdd ? "1px 4px" : "0",
                  borderRadius: 2,
                  marginRight: 4,
                }}
                className={isAdd ? "diff-skill-add" : undefined}
              >
                {isAdd ? "+ " : ""}
                {s}
                {i < resume.skills.length - 1 ? "  ·  " : ""}
              </span>
            );
          })}
        </div>
      </Section>

      {resume.projects.length > 0 && (
        <Section title="Projects" highlight={flash("projects")}>
          {resume.projects.map((p, i) => (
            <div key={i} style={{ marginBottom: 6, fontSize: 11.5 }}>
              <span style={{ fontWeight: 600 }}>{p.name}</span>
              <span style={{ color: "#555048" }}> — {highlightInline(p.description, optimized, approved)}</span>
            </div>
          ))}
        </Section>
      )}

      {resume.education.length > 0 && (
        <Section title="Education" highlight={flash("education")}>
          {resume.education.map((e, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11.5,
                marginBottom: 2,
              }}
            >
              <span>
                <span style={{ fontWeight: 600 }}>{e.school}</span>, {e.degree}
              </span>
              <span style={{ fontFamily: "ui-monospace, monospace", color: "#555048" }}>
                {e.year}
              </span>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  highlight,
  children,
}: {
  title: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      animate={{ background: highlight ? "rgba(156,74,44,0.06)" : "rgba(0,0,0,0)" }}
      transition={{ duration: 0.2 }}
      style={{
        marginTop: 16,
        marginBottom: 4,
        padding: highlight ? "8px 8px" : 0,
        margin: highlight ? "16px -8px 4px" : "16px 0 4px",
        borderRadius: 4,
      }}
    >
      <h2
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          margin: "0 0 8px",
          borderBottom: "1px solid #15140f",
          paddingBottom: 4,
        }}
      >
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

// ─── Annotation card with checkbox ──────────────────────────────────────
function AnnotationCard({
  index,
  anno,
  approved,
  onToggle,
  onHover,
}: {
  index: number;
  anno: Annotation;
  approved: boolean;
  onToggle: () => void;
  onHover: (hovering: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      style={{
        border: "1px solid var(--hairline)",
        borderLeft: `2px solid ${anno.kind === "add" ? "var(--diff-add)" : "var(--diff-change)"}`,
        borderRadius: 6,
        padding: "10px 12px",
        background: approved ? "var(--bg-raised)" : "var(--bg-sunk)",
        opacity: approved ? 1 : 0.55,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "background 200ms cubic-bezier(0.32,0.72,0,1), opacity 200ms",
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: 10,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 16,
          height: 16,
          borderRadius: 3,
          border: `1.5px solid ${approved ? "var(--ink)" : "var(--hairline-3)"}`,
          background: approved ? "var(--ink)" : "transparent",
          color: approved ? "var(--bg)" : "transparent",
          display: "grid",
          placeItems: "center",
          marginTop: 2,
          flexShrink: 0,
          transition: "background 200ms, border-color 200ms",
        }}
      >
        {approved && <Check size={11} strokeWidth={3} />}
      </span>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 500 }}>
            {anno.section} · {truncate(anno.after, 38)}
          </span>
          <span
            className="mono"
            style={{
              fontSize: 9.5,
              color: anno.kind === "add" ? "var(--diff-add)" : "var(--diff-change)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              flexShrink: 0,
              marginLeft: 8,
            }}
          >
            {anno.kind === "add" ? "added" : "rewrote"}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4, lineHeight: 1.5 }}>
          {anno.reason}
        </div>
      </div>
    </button>
  );
}

function ScoreBar({ name, value, kind }: { name: string; value: number; kind: "high" | "mid" | "low" }) {
  const color =
    kind === "high" ? "var(--positive)" : kind === "mid" ? "var(--warning)" : "var(--negative)";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{name}</span>
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="serif tnum"
          style={{ fontSize: 18, color, letterSpacing: "-0.02em" }}
        >
          {value}%
        </motion.span>
      </div>
      <div className="slider-track" style={{ marginTop: 6 }}>
        <motion.div
          className="slider-fill"
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: color, height: "100%" }}
        />
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────

function pickKind(v: number): "high" | "mid" | "low" {
  return v >= 80 ? "high" : v >= 60 ? "mid" : "low";
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

/**
 * Build the rendered résumé by replaying approved changes.
 *
 * Strategy: walk the optimized résumé section by section. For each unit of
 * content (summary, bullets, skills entries), if there's an approved change
 * annotation that targets it, use the optimized version; otherwise use the
 * base (parsed) version.
 *
 * Implementation note — annotations don't reference specific bullets by
 * index, just by `before/after` text. So we use a heuristic: any change
 * within a section that references the section's content swaps optimized
 * for base when not approved.
 *
 * For simplicity and predictability, we apply changes coarsely:
 *   - If ALL annotations targeting a section are approved → use optimized
 *   - If NONE are approved → use base
 *   - Mixed → use optimized (because Azure already merged everything)
 *
 * The skills section is special: each "added skill" annotation maps to a
 * specific entry in the optimized.skills array that's not in base.skills.
 */
function applyApprovedChanges(
  base: OptimizedResume,
  optimized: OptimizedResume,
  approved: Record<number, boolean>,
): OptimizedResume {
  const annos = optimized.change_annotations;
  const sectionApproval: Record<string, { total: number; approved: number }> = {};
  annos.forEach((a, i) => {
    const key = a.section.toLowerCase();
    sectionApproval[key] = sectionApproval[key] ?? { total: 0, approved: 0 };
    sectionApproval[key]!.total++;
    if (approved[i]) sectionApproval[key]!.approved++;
  });
  const useOpt = (sectionKey: string) => {
    const s = sectionApproval[sectionKey];
    if (!s || s.total === 0) return true; // no changes; doesn't matter, use optimized
    return s.approved > 0;
  };

  // Skills — explicit per-item: any added skill (in optimized but not base)
  // appears only if its annotation is approved.
  const baseSkillsLower = new Set(base.skills.map((s) => s.toLowerCase()));
  const skills: string[] = [];
  for (const s of base.skills) skills.push(s); // always include base skills
  optimized.skills.forEach((s) => {
    if (baseSkillsLower.has(s.toLowerCase())) return;
    // It's an added skill. Find its annotation.
    const annoIdx = annos.findIndex(
      (a) =>
        a.kind === "add" &&
        a.section.toLowerCase().includes("skill") &&
        a.after.toLowerCase().includes(s.toLowerCase()),
    );
    if (annoIdx === -1 || approved[annoIdx]) skills.push(s);
  });

  return {
    contact: optimized.contact,
    summary: useOpt("summary") ? optimized.summary : base.summary,
    experience: useOpt("experience") ? optimized.experience : base.experience,
    education: useOpt("education") ? optimized.education : base.education,
    skills,
    projects: useOpt("projects") ? optimized.projects : base.projects,
    bolded_phrases: optimized.bolded_phrases,
    metrics_added: optimized.metrics_added,
    keywords_used: optimized.keywords_used,
    ats_score: optimized.ats_score,
    keyword_coverage: optimized.keyword_coverage,
    change_annotations: optimized.change_annotations,
  };
}

function isAddedSkill(
  skill: string,
  optimized: OptimizedResume,
  approved: Record<number, boolean>,
): boolean {
  const idx = optimized.change_annotations.findIndex(
    (a) =>
      a.kind === "add" &&
      a.section.toLowerCase().includes("skill") &&
      a.after.toLowerCase().includes(skill.toLowerCase()),
  );
  return idx !== -1 && !!approved[idx];
}

/**
 * Inline highlight inside a paragraph or bullet. We mark phrases that
 * correspond to currently-approved annotations.
 */
function highlightInline(
  text: string,
  optimized: OptimizedResume,
  approved: Record<number, boolean>,
): React.ReactNode {
  // Build the set of phrases we want to mark. For each approved annotation,
  // its `after` text (truncated) is a candidate. We also include
  // bolded_phrases for visual emphasis.
  const ranges: Array<{ start: number; end: number; kind: "add" | "change" | "bold" }> = [];
  const lower = text.toLowerCase();

  optimized.change_annotations.forEach((a, i) => {
    if (!approved[i]) return;
    const phrase = a.after.length > 80 ? a.after.slice(0, 80) : a.after;
    const idx = lower.indexOf(phrase.toLowerCase());
    if (idx !== -1) {
      ranges.push({ start: idx, end: idx + phrase.length, kind: a.kind });
    }
  });

  for (const phrase of optimized.bolded_phrases ?? []) {
    if (!phrase || phrase.length < 3) continue;
    let idx = lower.indexOf(phrase.toLowerCase());
    while (idx !== -1) {
      const overlaps = ranges.some(
        (r) => !(idx + phrase.length <= r.start || idx >= r.end),
      );
      if (!overlaps)
        ranges.push({ start: idx, end: idx + phrase.length, kind: "bold" });
      idx = lower.indexOf(phrase.toLowerCase(), idx + phrase.length);
    }
  }

  ranges.sort((a, b) => a.start - b.start);

  const out: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach((r, i) => {
    if (r.start < cursor) return;
    if (r.start > cursor) out.push(text.slice(cursor, r.start));
    const seg = text.slice(r.start, r.end);
    const cls =
      r.kind === "add"
        ? "diff-add-mark"
        : r.kind === "change"
          ? "diff-change-mark"
          : "diff-change-mark-bold";
    out.push(
      <span key={`r${i}`} className={cls}>
        {seg}
      </span>,
    );
    cursor = r.end;
  });
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}

/**
 * Compute display scores from the rendered résumé and JD.
 * - ATS match: starts from the LLM-provided baseline; subtracts proportional
 *   to rejected changes, since rejecting = leaving in less-tailored content.
 * - Keyword coverage: count of optimized.keywords_used that appear in the
 *   currently-rendered text, divided by total keywords.
 * - Quantification: count of digit-bearing phrases per 100 words.
 * - Readability: derived from average sentence length — too long penalizes.
 */
function computeScores(
  rendered: OptimizedResume,
  optimized: OptimizedResume,
  jdText: string | null,
  approved: Record<number, boolean>,
): { ats: number; coverage: number; quantification: number; readability: number } {
  const renderedText = renderToText(rendered);
  const lower = renderedText.toLowerCase();
  const wordCount = renderedText.split(/\s+/).filter(Boolean).length || 1;

  // Coverage — count keywords that survived in the rendered version.
  const kws = optimized.keywords_used ?? [];
  const matched = kws.filter((k) => k && k.length >= 3 && lower.includes(k.toLowerCase())).length;
  const coverage = kws.length === 0 ? optimized.keyword_coverage : Math.round((matched / kws.length) * 100);

  // Quantification — digits per 100 words, capped.
  const digitMatches = renderedText.match(/\d[\d.,%kKmMbB+]*/g) ?? [];
  const quantification = Math.min(100, Math.round((digitMatches.length / (wordCount / 100)) * 12));

  // Readability — penalty for excessive sentence length. Sweet spot 12-22 words.
  const sentences = renderedText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSent = sentences.length ? wordCount / sentences.length : 18;
  const readability =
    avgSent <= 22 && avgSent >= 10
      ? 92 - Math.abs(16 - avgSent) * 2
      : Math.max(40, 80 - Math.abs(16 - avgSent) * 3);

  // ATS — start from optimized baseline; reduce by approval ratio.
  const totalChanges = optimized.change_annotations.length;
  const approvedCount = Object.values(approved).filter(Boolean).length;
  const approvalRatio = totalChanges === 0 ? 1 : approvedCount / totalChanges;
  // Floor at 50% of base score so users don't see "0" for rejecting everything.
  const atsBase = optimized.ats_score;
  const ats = Math.round(atsBase * (0.55 + 0.45 * approvalRatio));

  return {
    ats: clamp(ats, 0, 100),
    coverage: clamp(coverage, 0, 100),
    quantification: clamp(quantification, 0, 100),
    readability: clamp(Math.round(readability), 0, 100),
  };
}

function renderToText(r: OptimizedResume): string {
  return [
    r.contact.name,
    r.summary,
    ...r.experience.flatMap((e) => [e.role, e.company, ...e.bullets]),
    ...r.skills,
    ...r.projects.map((p) => `${p.name} ${p.description}`),
    ...r.education.map((e) => `${e.school} ${e.degree}`),
  ].join("\n");
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
