import Link from "next/link";
import { Bell, ChevronRight, Cog, Search } from "lucide-react";
import type { ReactNode } from "react";
import { Brand } from "@/components/ui/brand";
import { Eyebrow } from "@/components/ui/eyebrow";
import { SidebarNav, type NavId } from "@/components/sidebar-nav";

interface UpNext {
  company: string;
  role: string;
  when: string;
  jobId: string;
}

interface User {
  name: string;
  initials: string;
  plan: string;
}

export function AppShell({
  active,
  crumbs,
  topnavRight,
  upNext,
  user,
  children,
}: {
  active: NavId;
  crumbs: string[];
  topnavRight?: ReactNode;
  upNext?: UpNext | null;
  user: User;
  children: ReactNode;
}) {
  return (
    <div className="app-shell" style={{ background: "var(--bg)" }}>
      <aside className="side">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px 12px" }}>
          <Brand size="md" />
          <button className="btn btn-icon btn-ghost" aria-label="Search">
            <Search className="ic" />
          </button>
        </div>

        <div className="side-section">
          <Eyebrow style={{ padding: "0 10px 8px" }}>Workspace</Eyebrow>
          <SidebarNav activeId={active} />
        </div>

        {upNext && (
          <div className="side-section">
            <Eyebrow style={{ padding: "0 10px 8px" }}>Up next</Eyebrow>
            <div className="card" style={{ padding: 14, marginTop: 4 }}>
              <Eyebrow style={{ color: "var(--accent)" }}>{upNext.when}</Eyebrow>
              <div className="serif" style={{ fontSize: 18, marginTop: 4, lineHeight: 1.15 }}>
                {upNext.role}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                {upNext.company} · Mock interview
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <Link
                  href={`/interview/${upNext.jobId}`}
                  className="btn btn-sm btn-accent"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Start mock
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="side-section" style={{ marginTop: "auto" }}>
          <Link href="/settings" className="side-link">
            <Cog className="ic" />
            <span>Settings</span>
          </Link>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 10px",
              marginTop: 4,
              borderTop: "1px solid var(--hairline)",
            }}
          >
            <span
              className="logo-sq"
              style={{
                width: 28,
                height: 28,
                background: "var(--ink)",
                color: "var(--bg)",
                fontSize: 11,
                fontFamily: "var(--font-display)",
              }}
            >
              {user.initials}
            </span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 12.5, color: "var(--ink)" }}>{user.name}</span>
              <span style={{ fontSize: 11, color: "var(--ink-4)" }}>{user.plan}</span>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div className="topnav">
          <div className="crumbs">
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {i > 0 && <ChevronRight size={11} className="sep" style={{ color: "var(--ink-5)" }} />}
                <span className={i === crumbs.length - 1 ? "now" : ""}>{c}</span>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {topnavRight}
            <button className="btn btn-icon btn-ghost" aria-label="Notifications">
              <Bell className="ic" />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
      </main>
    </div>
  );
}
