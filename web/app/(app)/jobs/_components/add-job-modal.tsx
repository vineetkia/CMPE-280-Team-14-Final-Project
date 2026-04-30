"use client";

import { useEffect, useState, useTransition } from "react";
import { Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { addJobFromJD } from "@/app/_actions/jobs";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Segmented } from "@/components/ui/segmented";
import { motion, modalEnter, scrim } from "@/components/motion";

const STATUS_OPTIONS = [
  { value: "saved" as const, label: "Saved" },
  { value: "applied" as const, label: "Applied" },
  { value: "interview" as const, label: "Interview" },
];

type AddStatus = (typeof STATUS_OPTIONS)[number]["value"];

export function AddJobModal({
  onClose,
  onCreated,
  defaultStatus,
}: {
  onClose: () => void;
  onCreated: () => void;
  defaultStatus?: AddStatus;
}) {
  const [jd, setJd] = useState("");
  const [status, setStatus] = useState<AddStatus>(defaultStatus ?? "saved");
  const [pending, start] = useTransition();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <motion.div
        key="modal-scrim"
        onClick={onClose}
        variants={scrim}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{ position: "fixed", inset: 0, background: "rgba(15,14,10,0.32)", zIndex: 60 }}
      />
      <motion.div
        key="modal"
        role="dialog"
        aria-modal="true"
        variants={modalEnter}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{
          position: "fixed",
          top: "10vh",
          left: "50%",
          transform: "translateX(-50%)",
          width: 640,
          maxWidth: "90vw",
          background: "var(--bg-raised)",
          border: "1px solid var(--hairline)",
          borderRadius: 14,
          boxShadow: "var(--shadow-4)",
          zIndex: 70,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          padding: 28,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Eyebrow>№ 05 · Add a role</Eyebrow>
            <div className="serif" style={{ fontSize: 26, marginTop: 6, letterSpacing: "-0.02em" }}>
              Paste a JD — we’ll extract the rest.
            </div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <div className="field">
          <label className="label">Job description</label>
          <textarea
            className="textarea"
            rows={9}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the full job description. We'll detect company, role, location, and salary range."
          />
          <div className="eyebrow" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{jd.length} / 8,000 characters</span>
            <span>Auto-extracts metadata · ~2s</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <Eyebrow>Initial column</Eyebrow>
            <div style={{ marginTop: 8 }}>
              <Segmented options={STATUS_OPTIONS} value={status} onChange={setStatus} />
            </div>
          </div>

          <button
            type="button"
            className="btn btn-accent btn-lg"
            disabled={!jd.trim() || pending}
            onClick={() =>
              start(async () => {
                const res = await addJobFromJD({ jd, status });
                if (res?.error) {
                  toast.error(res.error);
                } else {
                  toast.success("Job added");
                  onCreated();
                  onClose();
                }
              })
            }
          >
            <Sparkles size={14} /> {pending ? "Parsing…" : "Add job"}
          </button>
        </div>
      </motion.div>
    </>
  );
}
