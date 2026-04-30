import { AppShell } from "@/components/app-shell";
import { Eyebrow } from "@/components/ui/eyebrow";
import { SectionMark } from "@/components/ui/section-mark";
import { signOutAction } from "@/app/_actions/auth";
import { getShellContext } from "@/lib/get-shell-context";

export default async function SettingsPage() {
  const ctx = await getShellContext();
  return (
    <AppShell
      active="home"
      crumbs={["Hyrd", "Settings", "Profile"]}
      user={ctx.user}
      upNext={ctx.upNext}
    >
      <div style={{ padding: "40px 56px", display: "grid", gridTemplateColumns: "200px 1fr", gap: 56 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            ["Profile", true],
            ["Voice & interview"],
            ["Notifications"],
            ["Integrations"],
            ["Billing"],
            ["Security"],
            ["Export"],
          ].map(([n, on]) => (
            <span key={n as string} className="side-link" aria-current={on ? "page" : undefined}>
              {n}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <SectionMark num="10" title="Profile" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label className="label">Name</label>
              <input className="input" defaultValue={ctx.user.name} />
            </div>
            <div className="field">
              <label className="label">Email</label>
              <input className="input" defaultValue={ctx.user.email} disabled />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label className="label">Headline</label>
              <input className="input" defaultValue="Senior Product Designer · 7 yrs · ex-Notion" />
            </div>
          </div>

          <div className="rule" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="serif" style={{ fontSize: 20, letterSpacing: "-0.02em" }}>
                Default voice
              </div>
              <div style={{ color: "var(--ink-4)", fontSize: 12.5, marginTop: 2 }}>
                Used for AI mock interviews unless changed per session.
              </div>
            </div>
            <select className="select" style={{ width: 220 }} defaultValue="Halden">
              <option>Halden — neutral, baritone</option>
              <option>Mira — warm, alto</option>
              <option>Jules — crisp, mid</option>
            </select>
          </div>

          <div className="rule" />

          <form action={signOutAction} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="serif" style={{ fontSize: 20, letterSpacing: "-0.02em" }}>
                Sign out
              </div>
              <Eyebrow style={{ marginTop: 2 }}>End this session</Eyebrow>
            </div>
            <button type="submit" className="btn btn-secondary">
              Sign out
            </button>
          </form>

          <div className="rule" />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="serif" style={{ fontSize: 20, letterSpacing: "-0.02em", color: "var(--negative)" }}>
                Delete account
              </div>
              <div style={{ color: "var(--ink-4)", fontSize: 12.5, marginTop: 2 }}>
                Removes everything — résumés, interviews, transcripts. Irreversible.
              </div>
            </div>
            <button className="btn btn-secondary">Delete</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
