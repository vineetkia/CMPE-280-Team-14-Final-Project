"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type {
  InterviewDimensions,
  InterviewImprovement,
  InterviewQuestionScore,
} from "@/lib/types";

interface ReportData {
  jobCompany: string | null;
  jobRole: string | null;
  voice: string | null;
  durationSeconds: number | null;
  overallScore: number;
  dimensions: InterviewDimensions;
  questionScores: InterviewQuestionScore[];
  fillerCount: number;
  wpm: number;
  improvementPlan: InterviewImprovement[];
  transcript: Array<{ role: "interviewer" | "candidate"; text: string; t: number }>;
}

export function DownloadReportButton({ data }: { data: ReportData }) {
  const [pending, start] = useTransition();

  function handle() {
    start(async () => {
      try {
        const html = renderHTML(data);
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        // Open the formatted page in a new tab so the user can ⌘P → Save as PDF.
        // We deliberately do NOT auto-print — user keeps control.
        const win = window.open(url, "_blank", "noopener");
        if (!win) {
          toast.error("Pop-up blocked. Allow pop-ups and try again.");
          return;
        }
        toast("Report opened — use ⌘P / Ctrl+P to save as PDF");
        // Revoke the object URL after the new tab has had time to load.
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } catch (err) {
        toast.error("Could not generate report");
      }
    });
  }

  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm"
      onClick={handle}
      disabled={pending}
    >
      <Download className="ic" /> {pending ? "Generating…" : "Report"}
    </button>
  );
}

function renderHTML(d: ReportData): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const dims = [
    ["Clarity", d.dimensions.clarity],
    ["Confidence", d.dimensions.confidence],
    ["Relevance", d.dimensions.relevance],
    ["Structure", d.dimensions.structure],
    ["Technical depth", d.dimensions.technical_depth],
    ["Pace", d.dimensions.pace],
  ] as const;
  const min = d.durationSeconds ? Math.floor(d.durationSeconds / 60) : 0;
  const sec = d.durationSeconds ? d.durationSeconds % 60 : 0;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>Interview report — ${esc(d.jobCompany ?? "")} · ${esc(d.jobRole ?? "")}</title>
<style>
  @page { margin: 28mm 22mm; }
  body { font-family: 'Iowan Old Style', 'Palatino', Georgia, serif; max-width: 760px; margin: 32px auto; padding: 0 24px; color: #15140f; line-height: 1.55; }
  .eyebrow { font-family: ui-monospace, Menlo, monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.16em; color: #8a857a; }
  h1 { font-size: 36px; margin: 6px 0 4px; letter-spacing: -0.025em; font-weight: 500; }
  h2 { font-size: 14px; font-family: ui-monospace, Menlo, monospace; text-transform: uppercase; letter-spacing: 0.12em; margin: 28px 0 10px; color: #555048; border-bottom: 1px solid #15140f; padding-bottom: 8px; }
  .meta { color: #555048; font-size: 12px; margin-bottom: 24px; }
  .gauge { font-size: 60px; font-weight: 500; letter-spacing: -0.04em; line-height: 1; margin: 12px 0 4px; color: ${d.overallScore >= 80 ? "#3f5c3a" : d.overallScore >= 60 ? "#b3781a" : "#8b2e1f"}; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  td { padding: 8px 0; border-bottom: 1px solid rgba(21,20,15,0.1); vertical-align: top; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
  .q { margin-bottom: 24px; padding: 14px 16px; background: rgba(21,20,15,0.04); border-radius: 6px; }
  .q .qhead { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
  .q .qq { font-size: 15px; font-weight: 500; }
  .q .score { font-variant-numeric: tabular-nums; font-size: 18px; }
  .q .ans { font-style: italic; color: #2a2722; font-size: 13px; }
  .q .feedback { font-size: 12.5px; color: #555048; margin-top: 8px; }
  .q .better { font-size: 12.5px; color: #2a2722; margin-top: 8px; padding: 8px 10px; background: rgba(156,74,44,0.1); border-radius: 4px; }
  .pip { padding: 10px 12px; background: rgba(21,20,15,0.04); border-radius: 4px; margin-bottom: 8px; font-size: 13px; }
  .pip strong { font-weight: 500; }
  .footer { margin-top: 40px; font-size: 11px; color: #8a857a; }
  @media print {
    body { margin: 0; }
    .q, .pip { break-inside: avoid; }
  }
</style></head><body>
<div class="eyebrow">Hyrd · Interview report</div>
<h1>${esc(d.jobCompany ?? "Mock interview")} · ${esc(d.jobRole ?? "")}</h1>
<div class="meta">${min}m ${sec}s · ${esc(d.voice ?? "Halden")} · ${d.fillerCount} filler words · ${d.wpm} wpm avg</div>

<div class="gauge">${d.overallScore}<span style="font-size:18px;color:#8a857a;font-weight:400;"> / 100</span></div>
<div class="eyebrow">Overall</div>

<h2>Six dimensions</h2>
<table>
  ${dims.map(([n, v]) => `<tr><td>${esc(n)}</td><td class="num" style="color:${(v as number) >= 80 ? "#3f5c3a" : (v as number) >= 60 ? "#b3781a" : "#8b2e1f"}">${v}</td></tr>`).join("")}
</table>

<h2>Question by question</h2>
${d.questionScores
  .map(
    (q, i) => `
  <div class="q">
    <div class="qhead">
      <span class="eyebrow">Q${i + 1} · ${Math.floor(q.time_seconds / 60)}:${String(q.time_seconds % 60).padStart(2, "0")}</span>
      <span class="score" style="color:${q.score >= 80 ? "#3f5c3a" : q.score >= 60 ? "#b3781a" : "#8b2e1f"}">${q.score}</span>
    </div>
    <div class="qq">"${esc(q.question)}"</div>
    <div class="ans">${esc(q.answer)}</div>
    <div class="feedback">${esc(q.feedback)}</div>
    ${q.better_answer ? `<div class="better"><strong>A better answer would have…</strong> ${esc(q.better_answer)}</div>` : ""}
  </div>`,
  )
  .join("")}

<h2>Improvement plan</h2>
${d.improvementPlan
  .map(
    (p, i) => `
  <div class="pip">
    <strong>FOCUS ${String(i + 1).padStart(2, "0")} · ${esc(p.focus_area)}</strong><br/>
    ${esc(p.why)}<br/>
    <span class="eyebrow">${p.drills.reduce((a, dd) => a + dd.est_minutes, 0)} min · ${p.drills.map((dd) => esc(dd.name)).join(" · ")}</span>
  </div>`,
  )
  .join("")}

<h2>Transcript</h2>
${d.transcript
  .map(
    (t) => `<div style="margin:6px 0;font-size:12.5px;"><span class="eyebrow">${t.role === "interviewer" ? esc(d.voice ?? "interviewer") : "you"} · ${Math.floor(t.t / 60)}:${String(t.t % 60).padStart(2, "0")}</span><br/>${esc(t.text)}</div>`,
  )
  .join("")}

<div class="footer">Generated by Hyrd · ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
</body></html>`;
}
