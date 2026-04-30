"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Chip } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { MotionButton } from "@/components/ui/motion-button";
import { motion } from "@/components/motion";

const TONES = [
  { value: "concise", label: "Concise" },
  { value: "impactful", label: "Impactful" },
  { value: "executive", label: "Executive" },
] as const;
const LENGTHS = [
  { value: "1 page", label: "1 page" },
  { value: "2 pages", label: "2 pages" },
] as const;
const EMPHASES = [
  { value: "quantify", label: "Quantify" },
  { value: "leadership", label: "Leadership" },
  { value: "craft", label: "Craft" },
] as const;

interface JobOption {
  id: string;
  company: string;
  role: string;
  jd_text: string | null;
}

export function OptimizerInputForm({
  jobs,
  preselectedJobId,
  preselectedJD,
}: {
  jobs: JobOption[];
  preselectedJobId: string | null;
  preselectedJD: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsedText, setParsedText] = useState<string>("");
  const [parsing, setParsing] = useState(false);
  const [jd, setJd] = useState(preselectedJD ?? "");
  const [jobId, setJobId] = useState<string | null>(preselectedJobId);
  const [tone, setTone] = useState<(typeof TONES)[number]["value"]>("impactful");
  const [length, setLength] = useState<(typeof LENGTHS)[number]["value"]>("1 page");
  const [emphasis, setEmphasis] = useState<(typeof EMPHASES)[number]["value"]>("quantify");
  const [pending, start] = useTransition();

  const stats = useMemo(() => {
    const words = parsedText.split(/\s+/).filter(Boolean).length;
    const lines = parsedText.split(/\n/).filter((l) => l.trim().length > 0).length;
    return { words, lines };
  }, [parsedText]);

  async function handleFile(f: File) {
    setFile(f);
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/parse-resume", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      setParsedText(data.raw_text);
      toast.success(`Parsed ${data.word_count} words`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Parse failed";
      toast.error(message);
    } finally {
      setParsing(false);
    }
  }

  function onSubmit() {
    if (!parsedText) {
      toast.error("Upload a résumé first.");
      return;
    }
    if (jd.trim().length < 30) {
      toast.error("Paste a job description (at least 30 characters).");
      return;
    }
    start(async () => {
      const res = await fetch("/api/optimize-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: parsedText,
          jd,
          tone,
          length,
          emphasis,
          job_id: jobId,
          label: jobs.find((j) => j.id === jobId) ? `${jobs.find((j) => j.id === jobId)!.company} draft` : "Tailored draft",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Optimization failed");
        return;
      }
      router.push(`/optimize/${data.resume_id}`);
    });
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Résumé upload */}
        <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Eyebrow>Your résumé</Eyebrow>
            <Eyebrow style={{ color: parsedText ? "var(--positive)" : "var(--ink-4)" }}>
              ● {parsing ? "Parsing" : parsedText ? "Parsed" : "Upload"}
            </Eyebrow>
          </div>

          {file ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 16,
                alignItems: "center",
                background: "var(--bg)",
                border: "1px solid var(--hairline)",
                borderRadius: 10,
                padding: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 60,
                  background: "var(--bg-raised)",
                  border: "1px solid var(--hairline-3)",
                  borderRadius: 4,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {[8, 14, 20, 28, 34, 40, 48].map((y, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: 5,
                      right: i % 2 ? 12 : 8,
                      top: y,
                      height: 1,
                      background: "var(--hairline-3)",
                    }}
                  />
                ))}
                <span
                  className="mono"
                  style={{ position: "absolute", bottom: 4, left: 5, fontSize: 8, color: "var(--ink-4)" }}
                >
                  {file.name.toLowerCase().endsWith(".pdf") ? "PDF" : "DOCX"}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 14, color: "var(--ink)" }}>{file.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 2 }}>
                  {Math.round(file.size / 1024)} KB · {stats.words} words · {stats.lines} lines
                </div>
              </div>
              <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}>
                Replace
                <input
                  type="file"
                  accept=".pdf,.docx"
                  hidden
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </label>
            </div>
          ) : (
            <label
              style={{
                border: "1px dashed var(--hairline-3)",
                borderRadius: 14,
                padding: "44px 24px",
                textAlign: "center",
                background: "var(--bg)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 64,
                  background: "var(--bg-raised)",
                  border: "1px solid var(--hairline-3)",
                  borderRadius: 6,
                  position: "relative",
                }}
              >
                {[6, 12, 18].map((t, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      top: t,
                      left: 6,
                      right: i === 0 ? 6 : i === 1 ? 16 : 10,
                      height: 1,
                      background: "var(--hairline-3)",
                    }}
                  />
                ))}
                <span
                  className="mono"
                  style={{ position: "absolute", bottom: 6, left: 5, fontSize: 9, color: "var(--ink-4)" }}
                >
                  PDF
                </span>
              </div>
              <div className="serif" style={{ fontSize: 18 }}>
                Drop file here
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-4)" }}>
                or <span style={{ color: "var(--ink)", textDecoration: "underline" }}>browse files</span>
              </div>
              <input
                type="file"
                accept=".pdf,.docx"
                hidden
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
          )}

          {!file && (
            <div
              style={{
                border: "1px dashed var(--hairline-3)",
                borderRadius: 10,
                padding: "20px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                color: "var(--ink-4)",
                fontSize: 12.5,
              }}
            >
              <Upload size={16} /> PDF or DOCX, under 5MB
            </div>
          )}
        </div>

        {/* JD paste */}
        <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Eyebrow>Job description</Eyebrow>
            {jobId ? (
              <Chip kind="accent">
                Linked to {jobs.find((j) => j.id === jobId)?.company} · {jobs.find((j) => j.id === jobId)?.role}
              </Chip>
            ) : (
              <select
                className="select"
                style={{ width: 240, height: 28, padding: "0 10px", fontSize: 12 }}
                value=""
                onChange={(e) => {
                  const j = jobs.find((x) => x.id === e.target.value);
                  if (j) {
                    setJobId(j.id);
                    if (j.jd_text) setJd(j.jd_text);
                  }
                }}
              >
                <option value="" disabled>
                  Link to job…
                </option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.company} — {j.role}
                  </option>
                ))}
              </select>
            )}
          </div>
          <textarea
            className="textarea"
            rows={9}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the full job description. We'll extract priority keywords and tune the rewrite."
          />
          <div className="eyebrow" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{jd.length} / 8,000 characters</span>
            <span>~30 seconds</span>
          </div>
        </div>
      </div>

      <div
        className="card"
        style={{
          padding: 24,
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr auto",
          gap: 32,
          alignItems: "center",
        }}
      >
        <div>
          <Eyebrow>Tone</Eyebrow>
          <div style={{ marginTop: 8 }}>
            <Segmented options={TONES} value={tone} onChange={setTone} />
          </div>
        </div>
        <div>
          <Eyebrow>Length</Eyebrow>
          <div style={{ marginTop: 8 }}>
            <Segmented options={LENGTHS} value={length} onChange={setLength} />
          </div>
        </div>
        <div>
          <Eyebrow>Emphasis</Eyebrow>
          <div style={{ marginTop: 8 }}>
            <Segmented options={EMPHASES} value={emphasis} onChange={setEmphasis} />
          </div>
        </div>
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 8 }}>
          <MotionButton
            type="button"
            variant="accent"
            size="lg"
            style={{ padding: "0 24px" }}
            disabled={pending}
            onClick={onSubmit}
          >
            <motion.span
              animate={{ rotate: pending ? 360 : 0 }}
              transition={pending ? { duration: 2, repeat: Infinity, ease: "linear" } : { duration: 0.2 }}
              style={{ display: "inline-flex" }}
            >
              <Sparkles size={14} />
            </motion.span>
            {pending ? "Optimizing…" : "Optimize résumé"}
          </MotionButton>
          <Eyebrow style={{ alignSelf: "flex-end" }}>~30 seconds</Eyebrow>
        </div>
      </div>
    </>
  );
}
