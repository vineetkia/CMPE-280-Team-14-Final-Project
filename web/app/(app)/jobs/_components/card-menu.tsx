"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Trash2, ArrowRightCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { Job } from "@/lib/types";
import { deleteJobAction, updateJobAction } from "@/app/_actions/jobs";
import { tween, DUR, EASE_OUT } from "@/components/motion";

const STATUS_LABELS: Array<[Job["status"], string]> = [
  ["saved", "Saved"],
  ["applied", "Applied"],
  ["interview", "Interview"],
  ["offer", "Offer"],
  ["rejected", "Rejected"],
];

export function CardMenu({
  job,
  onEdit,
  onChange,
}: {
  job: Job;
  onEdit: () => void;
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [submenu, setSubmenu] = useState<"root" | "move">("root");
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function move(status: Job["status"]) {
    if (status === job.status) {
      setOpen(false);
      return;
    }
    // Special case: moving to Offer prompts for the amount so the green
    // offer chip renders. The seed data populates this via SQL, but for
    // user-driven moves we have to ask explicitly.
    let offerAmount: string | null | undefined = undefined;
    if (status === "offer") {
      const ans = window.prompt(
        "Offer amount (e.g. \"$255k + 0.10%\"). Leave blank to skip.",
        job.offer_amount ?? "",
      );
      if (ans === null) {
        setOpen(false);
        return;
      }
      offerAmount = ans.trim() || null;
    }
    start(async () => {
      const patch: Parameters<typeof updateJobAction>[0]["patch"] = { status, position: 0 };
      if (offerAmount !== undefined) patch.offer_amount = offerAmount;
      const res = await updateJobAction({ id: job.id, patch });
      setOpen(false);
      if ("error" in res) {
        toast.error(res.error);
      } else {
        toast(`Moved to ${STATUS_LABELS.find(([s]) => s === status)?.[1] ?? status}`);
        onChange();
      }
    });
  }

  function remove() {
    if (!confirm(`Delete ${job.role} at ${job.company}?`)) return;
    start(async () => {
      const res = await deleteJobAction({ id: job.id });
      setOpen(false);
      if ("error" in res) toast.error(res.error);
      else {
        toast("Job deleted");
        onChange();
      }
    });
  }

  return (
    <div ref={ref} style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="btn btn-icon btn-ghost btn-sm"
        style={{ width: 22, height: 22 }}
        aria-label="More actions"
        onClick={(e) => {
          e.stopPropagation();
          setSubmenu("root");
          setOpen((v) => !v);
        }}
      >
        <MoreHorizontal size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={tween(DUR.base, EASE_OUT)}
            style={{
              position: "absolute",
              top: 26,
              right: 0,
              minWidth: 180,
              background: "var(--bg-raised)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--r-3)",
              boxShadow: "var(--shadow-3)",
              zIndex: 30,
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {submenu === "root" && (
              <div style={{ padding: 4 }}>
                <MenuItem
                  icon={<Pencil size={13} />}
                  label="Edit details"
                  onClick={() => {
                    setOpen(false);
                    onEdit();
                  }}
                />
                <MenuItem
                  icon={<ArrowRightCircle size={13} />}
                  label="Move to…"
                  trailing="›"
                  onClick={() => setSubmenu("move")}
                />
                <div className="rule" style={{ margin: "4px 0" }} />
                <MenuItem
                  icon={<Trash2 size={13} />}
                  label="Delete"
                  destructive
                  onClick={remove}
                />
              </div>
            )}
            {submenu === "move" && (
              <div style={{ padding: 4 }}>
                <div
                  className="eyebrow"
                  style={{ padding: "8px 10px 4px" }}
                >
                  Move to column
                </div>
                {STATUS_LABELS.map(([s, label]) => (
                  <MenuItem
                    key={s}
                    label={label}
                    active={s === job.status}
                    onClick={() => move(s)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  trailing,
  active,
  destructive,
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
  active?: boolean;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "8px 10px",
        background: "transparent",
        border: "none",
        borderRadius: "var(--r-2)",
        textAlign: "left",
        cursor: "pointer",
        fontSize: 13,
        color: destructive ? "var(--negative)" : "var(--ink)",
        fontFamily: "var(--font-body)",
        transition: "background 200ms cubic-bezier(0.32,0.72,0,1)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hairline-2)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {icon && <span style={{ display: "inline-flex" }}>{icon}</span>}
      <span style={{ flex: 1 }}>{label}</span>
      {active && (
        <span className="mono" style={{ fontSize: 9, color: "var(--accent)" }}>●</span>
      )}
      {trailing && <span style={{ color: "var(--ink-4)" }}>{trailing}</span>}
    </button>
  );
}
