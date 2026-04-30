"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import type { Job } from "@/lib/types";
import { LogoSq } from "@/components/ui/logo-sq";
import { formatDaysAgo } from "@/lib/utils";
import { CardMenu } from "./card-menu";

function fmtSalary(min: number | null, max: number | null) {
  if (!min && !max) return "—";
  const k = (n: number) => `$${Math.round(n / 1000)}k`;
  if (min && max) return `${k(min)}–${k(max).replace("$", "")}`;
  return k((min ?? max)!);
}

function fmtInterviewTime(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso)
    .toLocaleDateString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })
    .replace(",", "");
}

export function JobCard({
  job,
  onClick,
  onEdit,
  dragging,
}: {
  job: Job;
  onClick: () => void;
  onEdit?: () => void;
  dragging?: boolean;
}) {
  const router = useRouter();
  const sortable = useSortable({ id: job.id });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging || dragging ? 0.6 : job.status === "rejected" ? 0.55 : 1,
  };

  const accent = job.status === "interview";
  const interviewTime = fmtInterviewTime(job.interview_at);

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      {...sortable.attributes}
      {...sortable.listeners}
      onClick={(e) => {
        // Prevent click during drag.
        if (sortable.isDragging) return;
        e.stopPropagation();
        onClick();
      }}
      className="card"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick();
      }}
    >
      <div
        style={{
          padding: 14,
          background: "var(--bg-raised)",
          borderColor: accent && interviewTime ? "var(--accent)" : "var(--hairline)",
          borderRadius: 10,
          cursor: dragging ? "grabbing" : "grab",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <LogoSq name={job.company} color={job.brand_color} size={28} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                color: "var(--ink)",
                letterSpacing: "-0.005em",
                lineHeight: 1.25,
              }}
            >
              {job.role}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: "var(--ink-4)",
                marginTop: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {job.company}
              {job.location ? ` · ${job.location}` : ""}
            </div>
          </div>
          <CardMenu job={job} onEdit={onEdit ?? onClick} onChange={() => router.refresh()} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="mono tnum" style={{ fontSize: 11, color: "var(--ink-2)" }}>
            {fmtSalary(job.salary_min, job.salary_max)}
          </span>
          <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>
            {formatDaysAgo(job.created_at)}
          </span>
        </div>

        {accent && interviewTime && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              background: "var(--accent-soft)",
              color: "var(--accent)",
              borderRadius: 6,
            }}
          >
            <Mic size={14} />
            <span
              className="mono"
              style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              {interviewTime}
            </span>
            <span style={{ marginLeft: "auto", fontSize: 11 }}>→</span>
          </div>
        )}

        {job.status === "offer" && job.offer_amount && (
          <div style={{ padding: "8px 10px", background: "var(--positive-soft)", color: "var(--positive)", borderRadius: 6 }}>
            <div className="mono" style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Offer
            </div>
            <div className="serif tnum" style={{ fontSize: 16, marginTop: 2, letterSpacing: "-0.01em" }}>
              {job.offer_amount}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
