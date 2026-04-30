"use client";

import { useDroppable } from "@dnd-kit/core";
import { Mic, Plus } from "lucide-react";
import type { Job } from "@/lib/types";
import { JobCard } from "./job-card";

export function JobColumn({
  status,
  title,
  items,
  count,
  onCardClick,
  onEditCard,
  onAddToColumn,
}: {
  status: Job["status"];
  title: string;
  items: Job[];
  count: number;
  onCardClick: (id: string) => void;
  onEditCard: (id: string) => void;
  onAddToColumn: (status: Job["status"]) => void;
}) {
  const accent = status === "interview";
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        background: accent
          ? "linear-gradient(180deg, var(--accent-soft), transparent 200px)"
          : isOver
            ? "var(--hairline-2)"
            : "transparent",
        padding: accent ? 12 : 4,
        borderRadius: 10,
        border: accent ? "1px solid var(--accent)" : "1px solid transparent",
        transition: "background 200ms cubic-bezier(0.32,0.72,0,1)",
        minHeight: 200,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            className="serif"
            style={{ fontSize: 18, letterSpacing: "-0.015em", color: accent ? "var(--accent)" : "var(--ink)" }}
          >
            {title}
          </span>
          <span className="mono tnum" style={{ fontSize: 11, color: "var(--ink-4)" }}>
            {count}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-icon btn-ghost btn-sm"
          style={{ width: 22, height: 22 }}
          aria-label={`Add to ${title}`}
          onClick={() => onAddToColumn(status)}
        >
          <Plus size={14} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it) => (
          <JobCard
            key={it.id}
            job={it}
            onClick={() => onCardClick(it.id)}
            onEdit={() => onEditCard(it.id)}
          />
        ))}
        {accent && (
          <div
            style={{
              border: "1px dashed var(--accent)",
              borderRadius: 10,
              padding: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              color: "var(--accent)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <Mic size={14} /> Move card here to schedule mock
          </div>
        )}
        {items.length === 0 && !accent && (
          <div style={{ fontSize: 11, color: "var(--ink-4)", textAlign: "center", padding: "20px 0" }}>
            Drag a card here
          </div>
        )}
      </div>
    </div>
  );
}
