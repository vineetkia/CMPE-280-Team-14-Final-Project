"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChartLine, FileText, Home, Mic, Trello } from "lucide-react";
import { tween, DUR, EASE } from "@/components/motion";

export type NavId = "home" | "optimizer" | "tracker" | "interview" | "performance";

interface NavItem {
  id: NavId;
  label: string;
  href: string;
}

// Icon map lives client-side: lucide components are functions and functions
// can't cross the RSC server -> client boundary as props.
const ICON: Record<NavId, typeof Home> = {
  home: Home,
  optimizer: FileText,
  tracker: Trello,
  interview: Mic,
  performance: ChartLine,
};

export const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", href: "/dashboard" },
  { id: "optimizer", label: "Resume Optimizer", href: "/optimize" },
  { id: "tracker", label: "Job Tracker", href: "/jobs" },
  { id: "interview", label: "AI Interview", href: "/interview" },
  { id: "performance", label: "Performance", href: "/performance" },
];

export function SidebarNav({ activeId }: { activeId: NavId }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, position: "relative" }}>
      {NAV_ITEMS.map((it) => {
        const isActive = activeId === it.id;
        const Icon = ICON[it.id];
        return (
          <Link
            key={it.id}
            href={it.href}
            className="side-link"
            aria-current={isActive ? "page" : undefined}
            style={{
              position: "relative",
              background: isActive ? "transparent" : undefined,
              boxShadow: isActive ? "none" : undefined,
              color: isActive ? "var(--ink)" : "var(--ink-3)",
              transition: "color 200ms cubic-bezier(0.32,0.72,0,1)",
            }}
          >
            {isActive && (
              <motion.span
                layoutId="sidebar-active-pill"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "var(--bg-raised)",
                  borderRadius: "var(--r-2)",
                  boxShadow: "var(--shadow-1)",
                  zIndex: 0,
                }}
                transition={tween(DUR.slow, EASE)}
              />
            )}
            <span style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", gap: 10 }}>
              <Icon className="ic" />
              <span>{it.label}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
