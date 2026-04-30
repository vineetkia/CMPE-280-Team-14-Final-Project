"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Job } from "@/lib/types";
import { updateJobAction } from "@/app/_actions/jobs";
import { Eyebrow } from "@/components/ui/eyebrow";
import { MotionButton } from "@/components/ui/motion-button";
import { modalEnter, scrim } from "@/components/motion";

export function EditJobModal({
  job,
  onClose,
  onSaved,
}: {
  job: Job;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [company, setCompany] = useState(job.company);
  const [role, setRole] = useState(job.role);
  const [location, setLocation] = useState(job.location ?? "");
  const [salaryMin, setSalaryMin] = useState(job.salary_min ?? "");
  const [salaryMax, setSalaryMax] = useState(job.salary_max ?? "");
  const [status, setStatus] = useState<Job["status"]>(job.status);
  const [interviewAt, setInterviewAt] = useState(
    job.interview_at ? new Date(job.interview_at).toISOString().slice(0, 16) : "",
  );
  const [offerAmount, setOfferAmount] = useState(job.offer_amount ?? "");
  const [notes, setNotes] = useState(job.notes ?? "");
  const [pending, start] = useTransition();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function save() {
    start(async () => {
      const res = await updateJobAction({
        id: job.id,
        patch: {
          company: company.trim(),
          role: role.trim(),
          location: location.trim() || null,
          salary_min: salaryMin === "" ? null : Number(salaryMin),
          salary_max: salaryMax === "" ? null : Number(salaryMax),
          status,
          interview_at: interviewAt ? new Date(interviewAt).toISOString() : null,
          offer_amount: status === "offer" ? (offerAmount.trim() || null) : null,
          notes: notes.trim(),
        },
      });
      if ("error" in res) {
        toast.error(res.error);
      } else {
        toast.success("Saved");
        onSaved();
        onClose();
      }
    });
  }

  return (
    <>
      <motion.div
        key="edit-scrim"
        onClick={onClose}
        variants={scrim}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{ position: "fixed", inset: 0, background: "rgba(15,14,10,0.32)", zIndex: 60 }}
      />
      <motion.div
        key="edit-modal"
        role="dialog"
        aria-modal="true"
        variants={modalEnter}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{
          position: "fixed",
          top: "8vh",
          left: "50%",
          transform: "translateX(-50%)",
          width: 560,
          maxWidth: "90vw",
          background: "var(--bg-raised)",
          border: "1px solid var(--hairline)",
          borderRadius: 14,
          boxShadow: "var(--shadow-4)",
          zIndex: 70,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: 28,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Eyebrow>Edit job</Eyebrow>
            <div className="serif" style={{ fontSize: 22, marginTop: 4, letterSpacing: "-0.02em" }}>
              {company} · {role}
            </div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Company">
            <input
              className="input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </Field>
          <Field label="Role">
            <input className="input" value={role} onChange={(e) => setRole(e.target.value)} />
          </Field>
          <Field label="Location">
            <input
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="SF · Hybrid"
            />
          </Field>
          <Field label="Status">
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value as Job["status"])}
            >
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
          </Field>
          <Field label="Salary min (USD)">
            <input
              className="input"
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="200000"
            />
          </Field>
          <Field label="Salary max (USD)">
            <input
              className="input"
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="240000"
            />
          </Field>
          {status === "interview" && (
            <Field label="Interview at" span={2}>
              <input
                className="input"
                type="datetime-local"
                value={interviewAt}
                onChange={(e) => setInterviewAt(e.target.value)}
              />
            </Field>
          )}
          {status === "offer" && (
            <Field label="Offer amount" span={2}>
              <input
                className="input"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="$255k + 0.10%"
              />
            </Field>
          )}
          <Field label="Notes" span={2}>
            <textarea
              className="textarea"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <MotionButton
            type="button"
            variant="primary"
            disabled={pending || !company.trim() || !role.trim()}
            onClick={save}
          >
            {pending ? "Saving…" : "Save changes"}
          </MotionButton>
        </div>
      </motion.div>
    </>
  );
}

function Field({
  label,
  span = 1,
  children,
}: {
  label: string;
  span?: 1 | 2;
  children: React.ReactNode;
}) {
  return (
    <div className="field" style={{ gridColumn: span === 2 ? "1 / -1" : undefined }}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
