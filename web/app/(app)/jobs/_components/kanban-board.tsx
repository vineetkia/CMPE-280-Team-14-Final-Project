"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Filter, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import type { Job } from "@/lib/types";
import { Eyebrow } from "@/components/ui/eyebrow";
import { reorderColumnAction, updateJobAction } from "@/app/_actions/jobs";
import { JobCard } from "./job-card";
import { JobDetailDrawer } from "./job-detail-drawer";
import { AddJobModal } from "./add-job-modal";
import { EditJobModal } from "./edit-job-modal";
import { JobColumn } from "./job-column";
import { AnimatePresence } from "@/components/motion";

const STATUSES = ["saved", "applied", "interview", "offer", "rejected"] as const;
type Status = (typeof STATUSES)[number];
const LABEL: Record<Status, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

interface ResumeMeta {
  id: string;
  job_id: string | null;
  ats_score: number | null;
  label: string | null;
  is_active: boolean | null;
}

export function KanbanBoard({
  jobs: initialJobs,
  resumes,
  initialOpen,
}: {
  jobs: Job[];
  resumes: ResumeMeta[];
  initialOpen: string | null;
}) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(initialOpen);
  const [editId, setEditId] = useState<string | null>(null);
  const [adding, setAdding] = useState<false | "saved" | "applied" | "interview">(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Set<Status>>(
    () => new Set(["saved", "applied", "interview", "offer", "rejected"]),
  );
  const [, startTransition] = useTransition();

  // Update local state if server data changes (after revalidation).
  useEffect(() => setJobs(initialJobs), [initialJobs]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) => j.role.toLowerCase().includes(q) || j.company.toLowerCase().includes(q),
    );
  }, [jobs, search]);

  const grouped = useMemo<Record<Status, Job[]>>(() => {
    const out: Record<Status, Job[]> = { saved: [], applied: [], interview: [], offer: [], rejected: [] };
    for (const j of filtered) out[j.status].push(j);
    for (const s of STATUSES) out[s].sort((a, b) => a.position - b.position);
    return out;
  }, [filtered]);

  const counts = useMemo<Record<Status, number>>(() => {
    const out = { saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };
    for (const j of jobs) out[j.status]++;
    return out;
  }, [jobs]);

  const findContainer = (id: string): Status | null => {
    if ((STATUSES as readonly string[]).includes(id)) return id as Status;
    const job = jobs.find((j) => j.id === id);
    return job ? job.status : null;
  };

  /**
   * Custom collision detection for the multi-column kanban.
   *
   * Default `closestCorners` will frequently pick a card in a NEIGHBORING
   * column over the column you're hovering, which breaks cross-column drops.
   * The canonical dnd-kit recipe:
   *   1. First try `pointerWithin` — exact cursor-in-droppable hit.
   *   2. Fall back to `rectIntersection` — overlap of dragged rect.
   *   3. If the matched droppable IS a column, narrow to its child cards
   *      via `closestCorners` against just that column's items so we get the
   *      right insertion index.
   */
  const lastOverColumn = useRef<Status | null>(null);
  const collisionDetection: CollisionDetection = (args) => {
    // 1. Pointer must be inside a droppable.
    const pointerCollisions = pointerWithin(args);
    const intersections = pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
    let overId = getFirstCollision(intersections, "id");

    if (overId != null) {
      // 2. If we're over a column droppable, narrow to its sortable items.
      const overIdStr = String(overId);
      if ((STATUSES as readonly string[]).includes(overIdStr)) {
        lastOverColumn.current = overIdStr as Status;
        const containerItems = grouped[overIdStr as Status]
          .map((j) => j.id)
          .filter((id) => id !== String(args.active.id));
        if (containerItems.length > 0) {
          const narrowed = closestCorners({
            ...args,
            droppableContainers: args.droppableContainers.filter(
              (c) => c.id !== overId && containerItems.includes(String(c.id)),
            ),
          });
          if (narrowed.length > 0) overId = narrowed[0]!.id;
        }
        return [{ id: overId as UniqueIdentifier }];
      }
      // 3. Over a card — remember its column for fallback.
      const job = jobs.find((j) => j.id === overIdStr);
      if (job) lastOverColumn.current = job.status;
      return [{ id: overId as UniqueIdentifier }];
    }

    // 4. Fall back to last known column so the drag still settles somewhere.
    if (lastOverColumn.current) {
      return [{ id: lastOverColumn.current as UniqueIdentifier }];
    }
    return [];
  };

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeContainer = findContainer(String(active.id));
    const overContainer = findContainer(String(over.id));
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setJobs((prev) => {
      const next = [...prev];
      const idx = next.findIndex((j) => j.id === active.id);
      if (idx === -1) return prev;
      next[idx] = { ...next[idx]!, status: overContainer };
      return next;
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const activeContainer = findContainer(String(active.id));
    const overContainer = findContainer(String(over.id));
    if (!activeContainer || !overContainer) return;

    const overItems = jobs
      .filter((j) => j.status === overContainer && j.id !== active.id)
      .sort((a, b) => a.position - b.position);
    const overIndex = overItems.findIndex((j) => j.id === over.id);
    const insertAt = overIndex >= 0 ? overIndex : overItems.length;

    const newColumnIds = [
      ...overItems.slice(0, insertAt).map((j) => j.id),
      String(active.id),
      ...overItems.slice(insertAt).map((j) => j.id),
    ];

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === active.id) return { ...j, status: overContainer };
        return j;
      }),
    );

    // If moving to Offer from elsewhere, prompt for the offer amount so the
    // green offer chip on the card renders. We persist via updateJobAction
    // separately from reorderColumnAction so the patch carries offer_amount.
    let pendingOfferAmount: string | null | undefined;
    if (overContainer === "offer" && activeContainer !== "offer") {
      const movingJob = jobs.find((j) => j.id === active.id);
      const ans = window.prompt(
        'Offer amount (e.g. "$255k + 0.10%"). Leave blank to skip.',
        movingJob?.offer_amount ?? "",
      );
      pendingOfferAmount = ans === null ? null : ans.trim() || null;
    }

    startTransition(async () => {
      const res = await reorderColumnAction({ status: overContainer, ids: newColumnIds });
      if ("error" in res) {
        toast.error(`Couldn't move card: ${res.error}`);
        router.refresh();
        return;
      }
      if (pendingOfferAmount !== undefined) {
        await updateJobAction({
          id: String(active.id),
          patch: { offer_amount: pendingOfferAmount },
        });
        router.refresh();
      } else if (overContainer === "interview" && activeContainer !== "interview") {
        toast(`Moved to Interview — drawer opened to schedule mock`);
        setOpenId(String(active.id));
      } else if (overContainer === "offer") {
        toast("Moved to Offer");
      }
    });
  }

  const activeJob = activeId ? jobs.find((j) => j.id === activeId) ?? null : null;
  const openJob = openId ? jobs.find((j) => j.id === openId) ?? null : null;
  const totalRoles = jobs.length;

  return (
    <>
      {/* Topbar action row */}
      <div
        className="topnav"
        style={{ position: "sticky", top: 0, zIndex: 9, padding: "12px 32px", background: "var(--bg)" }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-4)",
              }}
            />
            <input
              className="input"
              placeholder={`Search ${totalRoles} role${totalRoles === 1 ? "" : "s"}…`}
              style={{ width: 220, padding: "6px 12px 6px 30px", height: 32, fontSize: 12.5 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ position: "relative" }}>
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <Filter className="ic" /> Filters
              {statusFilter.size < 5 && (
                <span
                  className="mono tnum"
                  style={{
                    fontSize: 9,
                    color: "var(--accent)",
                    marginLeft: 4,
                  }}
                >
                  · {statusFilter.size}
                </span>
              )}
            </button>
            {filtersOpen && (
              <div
                style={{
                  position: "absolute",
                  top: 36,
                  left: 0,
                  width: 200,
                  background: "var(--bg-raised)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "var(--r-3)",
                  boxShadow: "var(--shadow-3)",
                  zIndex: 30,
                  padding: 12,
                }}
                onMouseLeave={() => setFiltersOpen(false)}
              >
                <Eyebrow>Show columns</Eyebrow>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                  {STATUSES.map((s) => (
                    <label
                      key={s}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12.5,
                        cursor: "pointer",
                        padding: "4px 0",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={statusFilter.has(s)}
                        onChange={(e) => {
                          const next = new Set(statusFilter);
                          if (e.target.checked) next.add(s);
                          else next.delete(s);
                          if (next.size === 0) next.add(s); // never empty
                          setStatusFilter(next);
                        }}
                      />
                      <span style={{ textTransform: "capitalize" }}>{LABEL[s]}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <button className="btn btn-primary btn-sm" type="button" onClick={() => setAdding("saved")}>
          <Plus className="ic" /> Add job
        </button>
      </div>

      <div
        style={{
          padding: "24px 32px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          minHeight: "calc(100vh - 120px)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <Eyebrow>№ 05 · Job tracker</Eyebrow>
            <h1
              className="serif"
              style={{ fontSize: 36, letterSpacing: "-0.025em", margin: "6px 0 0", fontWeight: 400 }}
            >
              <em style={{ fontStyle: "italic" }}>{totalRoles}</em> role{totalRoles === 1 ? "" : "s"} in motion.
            </h1>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
              OFFER RATE · {totalRoles ? Math.round((counts.offer / totalRoles) * 100) : 0}%
            </span>
            <span style={{ width: 1, height: 18, background: "var(--hairline)" }} />
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
              INTERVIEWS · {counts.interview}
            </span>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${statusFilter.size}, minmax(0, 1fr))`,
              gap: 14,
              flex: 1,
              minHeight: 0,
              transition: "grid-template-columns 360ms cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {STATUSES.filter((s) => statusFilter.has(s)).map((status) => {
              const items = grouped[status];
              const ids = items.map((i) => i.id);
              return (
                <SortableContext key={status} items={ids} strategy={verticalListSortingStrategy} id={status}>
                  <JobColumn
                    status={status}
                    title={LABEL[status]}
                    items={items}
                    count={counts[status]}
                    onCardClick={setOpenId}
                    onEditCard={setEditId}
                    onAddToColumn={(s) => {
                      // The AddJobModal only supports saved/applied/interview;
                      // for offer/rejected we route through saved.
                      if (s === "saved" || s === "applied" || s === "interview") {
                        setAdding(s);
                      } else {
                        setAdding("saved");
                      }
                    }}
                  />
                </SortableContext>
              );
            })}
          </div>
          <DragOverlay>
            {activeJob ? <JobCard job={activeJob} onClick={() => {}} dragging /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <AnimatePresence>
        {openJob && (
          <JobDetailDrawer
            key={openJob.id}
            job={openJob}
            resumes={resumes}
            onClose={() => setOpenId(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {adding && (
          <AddJobModal
            key="add-modal"
            onClose={() => setAdding(false)}
            onCreated={() => router.refresh()}
            defaultStatus={adding}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editId && jobs.find((j) => j.id === editId) && (
          <EditJobModal
            key={editId}
            job={jobs.find((j) => j.id === editId)!}
            onClose={() => setEditId(null)}
            onSaved={() => router.refresh()}
          />
        )}
      </AnimatePresence>
    </>
  );
}
