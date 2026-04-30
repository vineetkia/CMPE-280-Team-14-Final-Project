/* screens-2.jsx — 04 Optimizer Output (hero), 05 Kanban (hero), 06 Job Detail Drawer */

/* ─────────────── 04 · OPTIMIZER OUTPUT (HERO) ─────────────── */
const ScreenOptimizerOutput = () => {
  const sections = [
    { id: "summary", name: "Summary", changes: 2, kind: "change" },
    { id: "exp", name: "Experience", changes: 7, kind: "change" },
    { id: "skills", name: "Skills", changes: 4, kind: "add" },
    { id: "edu", name: "Education", changes: 0, kind: "kept" },
    { id: "proj", name: "Projects", changes: 1, kind: "add" },
  ];
  return (
    <AppShell active="optimizer" crumbs={["Hyrd","Resume optimizer","Linear · Sr Designer"]}
      topnavRight={<><button className="btn btn-ghost btn-sm">Diff</button><button className="btn btn-secondary btn-sm"><Icon.Download/> PDF</button><button className="btn btn-primary btn-sm">Save version</button></>}>
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 360px", height: "calc(100% - 0px)", minHeight: 0 }}>
        {/* LEFT — section nav */}
        <div style={{ borderRight: "1px solid var(--hairline)", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 18, overflowY: "auto" }}>
          <Eyebrow>Sections</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {sections.map((s, i) => (
              <div key={s.id} style={{
                display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 10, alignItems: "center",
                padding: "10px 10px", borderRadius: 8,
                background: i === 1 ? "var(--bg-raised)" : "transparent",
                cursor: "pointer"
              }}>
                <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>0{i+1}</span>
                <span style={{ fontSize: 13, color: "var(--ink)" }}>{s.name}</span>
                {s.changes > 0 ? (
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 10,
                    background: s.kind === "add" ? "var(--diff-add-bg)" : "var(--diff-change-bg)",
                    color: s.kind === "add" ? "var(--diff-add)" : "var(--diff-change)",
                    padding: "2px 6px", borderRadius: 3, letterSpacing: "0.06em"
                  }}>{s.kind === "add" ? "+" : "~"}{s.changes}</span>
                ) : <span className="mono" style={{ fontSize: 10, color: "var(--ink-5)" }}>kept</span>}
              </div>
            ))}
          </div>

          <div className="rule"/>
          <Eyebrow>Diff legend</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, background: "var(--diff-add-bg)", border: "1px solid var(--diff-add)", borderRadius: 2 }}/>Added by Hyrd
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, background: "var(--diff-change-bg)", border: "1px solid var(--diff-change)", borderRadius: 2 }}/>Rewritten
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, background: "var(--bg-sunk)", border: "1px solid var(--diff-kept)", borderRadius: 2 }}/>Kept verbatim
            </div>
          </div>
        </div>

        {/* CENTER — résumé */}
        <div style={{ padding: "32px 48px", overflowY: "auto", background: "var(--bg-sunk)" }}>
          <div className="card" style={{ background: "#fffdf7", maxWidth: 720, margin: "0 auto", padding: "44px 56px", boxShadow: "var(--shadow-3)" }}>
            <div style={{ borderBottom: "1px solid var(--ink)", paddingBottom: 16 }}>
              <h1 className="serif" style={{ fontSize: 32, letterSpacing: "-0.025em", margin: 0, fontWeight: 500 }}>Maya Rivera</h1>
              <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>Senior Product Designer · Brooklyn, NY · maya.rivera@gmail.com · linkedin.com/in/mrivera</div>
            </div>

            <div style={{ marginTop: 24 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Summary</div>
              <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, color: "var(--ink-2)" }}>
                Senior product designer with <span style={{ background: "var(--diff-change-bg)", color: "var(--diff-change)", padding: "1px 3px", borderRadius: 2 }}>7 years shipping consumer and developer-tool surfaces at Notion and Mailchimp</span>. I lead end-to-end design on ambiguous, technically complex products — partnering closely with engineering to ship work that holds a high typographic and motion bar.
              </p>
            </div>

            <div style={{ marginTop: 24 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Experience</div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div className="serif" style={{ fontSize: 15, fontWeight: 500 }}>Senior Product Designer · Notion</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>2022 — Present</div>
                </div>
                <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, lineHeight: 1.55 }}>
                  <li style={{ paddingLeft: 14, position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, top: 8, width: 4, height: 4, background: "var(--ink)", borderRadius: 50 }}/>
                    Led design of <b>AI-assisted database editor</b> shipped to <span style={{ background: "var(--diff-change-bg)", color: "var(--diff-change)", padding: "0 3px", borderRadius: 2, fontWeight: 600 }}>4.2M weekly users</span>; <span style={{ background: "var(--diff-change-bg)", color: "var(--diff-change)", padding: "0 3px", borderRadius: 2, fontWeight: 600 }}>cut time-to-first-row by 41%</span>.
                  </li>
                  <li style={{ paddingLeft: 14, position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, top: 8, width: 4, height: 4, background: "var(--ink)", borderRadius: 50 }}/>
                    <span style={{ background: "var(--diff-add-bg)", padding: "1px 3px", borderRadius: 2 }}>Drove design quality bar across 14 product surfaces — typography, motion, and detail — establishing a reusable component vocabulary adopted by 3 PM teams.</span>
                  </li>
                  <li style={{ paddingLeft: 14, position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, top: 8, width: 4, height: 4, background: "var(--ink)", borderRadius: 50 }}/>
                    Mentored <b>5 designers</b> through career-ladder reviews; co-authored craft rubric now used company-wide.
                  </li>
                </ul>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div className="serif" style={{ fontSize: 15, fontWeight: 500 }}>Product Designer · Mailchimp</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>2019 — 2022</div>
                </div>
                <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, lineHeight: 1.55 }}>
                  <li style={{ paddingLeft: 14, position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, top: 8, width: 4, height: 4, background: "var(--ink)", borderRadius: 50 }}/>
                    Designed onboarding flow that <span style={{ background: "var(--diff-change-bg)", color: "var(--diff-change)", padding: "0 3px", borderRadius: 2, fontWeight: 600 }}>lifted 7-day activation by 23%</span> across SMB segments (~880k accounts).
                  </li>
                  <li style={{ paddingLeft: 14, position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, top: 8, width: 4, height: 4, background: "var(--ink)", borderRadius: 50 }}/>
                    Partnered with research on a 6-week generative study; outputs shaped 2024 roadmap.
                  </li>
                </ul>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Skills</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {["Design systems","Typography","Motion","Figma","Prototyping","User research"].map(s => (
                  <span key={s} style={{ fontSize: 11.5, padding: "3px 8px", background: "var(--bg-sunk)", borderRadius: 3, fontFamily: "var(--font-mono)", color: "var(--ink-2)" }}>{s}</span>
                ))}
                {["Linear","SwiftUI","Pricing & PLG"].map(s => (
                  <span key={s} style={{ fontSize: 11.5, padding: "3px 8px", background: "var(--diff-add-bg)", color: "var(--diff-add)", borderRadius: 3, fontFamily: "var(--font-mono)" }}>+ {s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — annotations */}
        <div style={{ borderLeft: "1px solid var(--hairline)", padding: "32px 28px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
          {/* scores */}
          <div>
            <Eyebrow>Match scores</Eyebrow>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              {[
                { name: "ATS match", val: 94, kind: "high" },
                { name: "Keyword coverage", val: 86, kind: "high" },
                { name: "Readability (FK)", val: 11, max: "grade", kind: "mid", note: "11th grade" },
                { name: "Quantification", val: 78, kind: "mid" },
              ].map((m,i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{m.name}</span>
                    <span className="serif tnum" style={{ fontSize: 18, color: m.kind === "high" ? "var(--positive)" : "var(--warning)", letterSpacing: "-0.02em" }}>
                      {m.note ?? `${m.val}${m.max === "grade" ? "" : "%"}`}
                    </span>
                  </div>
                  <div className="slider-track" style={{ marginTop: 6 }}>
                    <div className="slider-fill" style={{
                      width: `${typeof m.val === "number" && !m.max ? m.val : 70}%`,
                      background: m.kind === "high" ? "var(--positive)" : "var(--warning)"
                    }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rule"/>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Eyebrow>Why we changed this</Eyebrow>
              <span className="chip">9 notes</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              {[
                { kind: "change", line: "Quantified your Notion bullet", body: "JD calls out 'principled product decisions' and you led a measurable shift. We made the metrics the lede." },
                { kind: "add", line: "Added 'craft rubric' phrasing", body: "JD weights typographic and motion bar — your existing line buried this. We surfaced it." },
                { kind: "add", line: "Inserted 'Linear' as a skill", body: "Direct keyword match — appears 4× in JD. ATS systems index this verbatim." },
                { kind: "change", line: "Tightened summary to 38 words", body: "Recruiter glance test: 6-second comprehension. Yours was running long at 71." },
              ].map((n, i) => (
                <div key={i} style={{
                  border: "1px solid var(--hairline)",
                  borderLeft: `2px solid ${n.kind === "add" ? "var(--diff-add)" : "var(--diff-change)"}`,
                  borderRadius: 6, padding: "10px 12px", background: "var(--bg-raised)",
                  cursor: "pointer"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 500 }}>{n.line}</span>
                    <span className="mono" style={{ fontSize: 9.5, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{n.kind === "add" ? "added" : "rewrote"}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4, lineHeight: 1.5 }}>{n.body}</div>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-secondary" style={{ marginTop: 4 }}>
            <Icon.Download/> Download .pdf · .docx
          </button>
        </div>
      </div>
    </AppShell>
  );
};

/* ─────────────── 05 · KANBAN (HERO) ─────────────── */
const ScreenKanban = () => {
  const cols = [
    {
      name: "Saved", count: 6, accent: false, items: [
        { co: "Vercel", role: "Design Lead, Platform", loc: "Remote", sal: "$215–245k", days: 2, color: "#000", links: { resume: 1 }, },
        { co: "Notion", role: "Sr Designer, Calendar", loc: "NYC · Hybrid", sal: "$190–225k", days: 4, color: "#000", links: { resume: 1, notes: 2 } },
        { co: "Ramp",   role: "Sr Designer, Spend", loc: "NYC · Hybrid", sal: "$200–230k", days: 5, color: "#f5d04a" },
      ],
    },
    {
      name: "Applied", count: 4, accent: false, items: [
        { co: "Stripe", role: "Staff Engineer, Payments", loc: "SF · Hybrid", sal: "$240–290k", days: 7, color: "#635bff", links: { resume: 2, notes: 3 } },
        { co: "Anthropic", role: "Sr Product Designer", loc: "SF · Hybrid", sal: "$210–260k", days: 3, color: "#d97757", links: { resume: 1 } },
        { co: "Mercury", role: "Sr Designer, Banking", loc: "Remote", sal: "$185–220k", days: 9, color: "#1c1c1c" },
      ],
    },
    {
      name: "Interview", count: 3, accent: true, items: [
        { co: "Linear", role: "Sr Product Designer", loc: "Remote", sal: "$200–240k", days: 1, color: "#5e6ad2", links: { resume: 2, notes: 5, interview: true }, interview: "Thu 2:00 PM" },
        { co: "Figma",  role: "Sr Designer, Editor", loc: "SF · Hybrid", sal: "$215–255k", days: 5, color: "#a259ff", links: { resume: 1, notes: 2, interview: true }, interview: "Mon 9:30 AM" },
      ],
    },
    {
      name: "Offer", count: 1, accent: false, items: [
        { co: "Arc", role: "Sr Designer, Browser", loc: "NYC · On-site", sal: "$220–250k", days: 14, color: "#f06038", offer: "$235k + 0.08%" },
      ],
    },
    {
      name: "Rejected", count: 2, accent: false, items: [
        { co: "Airbnb", role: "Sr Designer, Trips", loc: "SF · Hybrid", sal: "$210–245k", days: 22, color: "#ff385c", muted: true },
      ],
    },
  ];

  const Card = ({ it, muted, accent }) => (
    <div className="card" style={{
      padding: 14, background: "var(--bg-raised)",
      borderColor: accent && it.interview ? "var(--accent)" : "var(--hairline)",
      borderRadius: 10,
      opacity: muted ? 0.55 : 1,
      cursor: "grab",
      display: "flex", flexDirection: "column", gap: 10
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <LogoSq name={it.co} color={it.color} size={28}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "var(--ink)", letterSpacing: "-0.005em", lineHeight: 1.25 }}>{it.role}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 2 }}>{it.co} · {it.loc}</div>
        </div>
        <button className="btn btn-icon btn-ghost btn-sm" style={{ width: 22, height: 22 }}><Icon.More size="14"/></button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="mono tnum" style={{ fontSize: 11, color: "var(--ink-2)" }}>{it.sal}</span>
        <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>{it.days}d</span>
      </div>

      {it.interview && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--accent-soft)", color: "var(--accent)", borderRadius: 6, marginTop: -2 }}>
          <Icon.Mic size="14"/>
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>{it.interview}</span>
          <span style={{ marginLeft: "auto", fontSize: 11 }}>→</span>
        </div>
      )}

      {it.offer && (
        <div style={{ padding: "8px 10px", background: "var(--positive-soft)", color: "var(--positive)", borderRadius: 6 }}>
          <div className="mono" style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.1em" }}>Offer</div>
          <div className="serif tnum" style={{ fontSize: 16, marginTop: 2, letterSpacing: "-0.01em" }}>{it.offer}</div>
        </div>
      )}

      {it.links && (
        <div style={{ display: "flex", gap: 12, color: "var(--ink-4)", borderTop: "1px solid var(--hairline)", paddingTop: 10 }}>
          {it.links.resume && <span style={{ display:"flex",alignItems:"center",gap:4,fontSize:11 }}><Icon.Doc size="12"/> {it.links.resume}</span>}
          {it.links.notes && <span style={{ display:"flex",alignItems:"center",gap:4,fontSize:11 }}><Icon.Note size="12"/> {it.links.notes}</span>}
          {it.links.interview && <span style={{ display:"flex",alignItems:"center",gap:4,fontSize:11, color: "var(--accent)" }}><Icon.Mic size="12"/> booked</span>}
        </div>
      )}
    </div>
  );

  return (
    <AppShell active="tracker" crumbs={["Hyrd","Job tracker","All roles"]}
      topnavRight={<>
        <div style={{ position:"relative" }}>
          <Icon.Search size="14" style={{ position:"absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)" }}/>
          <input className="input" placeholder="Search 14 roles…" style={{ width: 220, padding: "6px 12px 6px 30px", height: 32, fontSize: 12.5 }}/>
        </div>
        <button className="btn btn-secondary btn-sm"><Icon.Filter/> Filters · 2</button>
        <button className="btn btn-primary btn-sm"><Icon.Plus/> Add job</button>
      </>}>
      <div style={{ padding: "32px 32px", display: "flex", flexDirection: "column", gap: 20, height: "100%", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <Eyebrow>№ 05 · Job tracker</Eyebrow>
            <h1 className="serif" style={{ fontSize: 36, letterSpacing: "-0.025em", margin: "6px 0 0", fontWeight: 400 }}>
              <em style={{ fontStyle: "italic" }}>14</em> roles in motion.
            </h1>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>OFFER RATE · 7%</span>
            <span style={{ width: 1, height: 18, background: "var(--hairline)" }}/>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>AVG DAYS-TO-INTERVIEW · 11</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, flex: 1, minHeight: 0 }}>
          {cols.map((col, i) => (
            <div key={i} style={{
              display: "flex", flexDirection: "column", gap: 12,
              background: col.accent ? "linear-gradient(180deg, var(--accent-soft), transparent 200px)" : "transparent",
              padding: col.accent ? 12 : 0,
              borderRadius: 10,
              border: col.accent ? "1px solid var(--accent)" : "1px solid transparent",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: col.accent ? "0 4px" : "0 4px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span className="serif" style={{ fontSize: 18, letterSpacing: "-0.015em", color: col.accent ? "var(--accent)" : "var(--ink)" }}>{col.name}</span>
                  <span className="mono tnum" style={{ fontSize: 11, color: "var(--ink-4)" }}>{col.count}</span>
                </div>
                <button className="btn btn-icon btn-ghost btn-sm" style={{ width: 22, height: 22 }}><Icon.Plus size="14"/></button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", flex: 1 }}>
                {col.items.map((it, j) => <Card key={j} it={it} muted={it.muted} accent={col.accent}/>)}
                {col.accent && <div style={{
                  border: "1px dashed var(--accent)", borderRadius: 10, padding: 14,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  color: "var(--accent)", fontSize: 12, cursor: "pointer"
                }}><Icon.Mic size="14"/> Move card here to schedule mock</div>}
                {col.items.length < col.count && (
                  <div style={{ fontSize: 11, color: "var(--ink-4)", textAlign: "center", padding: "6px 0" }}>+ {col.count - col.items.length} more</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
};

/* ─────────────── 06 · JOB DETAIL DRAWER ─────────────── */
const ScreenJobDetail = () => {
  /* Background = kanban frozen, drawer overlays from right */
  const [tab, setTab] = React.useState("overview");
  return (
    <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
      {/* dim background sketch */}
      <div style={{ position: "absolute", inset: 0, background: "var(--bg)", opacity: 1 }}>
        <div style={{ filter: "blur(0.5px)", opacity: 0.5, height: "100%", pointerEvents: "none" }}>
          <ScreenKanban/>
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,14,10,0.32)" }}/>

      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0, width: 600,
        background: "var(--bg)", boxShadow: "var(--shadow-4)", borderLeft: "1px solid var(--hairline)",
        display: "flex", flexDirection: "column"
      }}>
        {/* header */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="btn btn-icon btn-ghost btn-sm"><Icon.X/></button>
            <span className="eyebrow">Job · Interview</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm"><Icon.Link size="14"/> Source</button>
            <button className="btn btn-ghost btn-sm"><Icon.More/></button>
          </div>
        </div>

        {/* hero */}
        <div style={{ padding: "28px 28px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <LogoSq name="Linear" color="#5e6ad2" size={48}/>
            <div style={{ flex: 1 }}>
              <span className="eyebrow">Linear · Remote · Posted 8d</span>
              <h2 className="serif" style={{ fontSize: 28, letterSpacing: "-0.025em", margin: "4px 0 6px", fontWeight: 500 }}>Senior Product Designer</h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className="chip">$200–240k</span>
                <span className="chip">Full-time</span>
                <span className="chip">+ equity</span>
                <span className="chip chip-accent">Interview · Thu 2:00 PM</span>
              </div>
            </div>
          </div>

          {/* Mock interview CTA */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center",
            padding: "16px 18px", background: "var(--ink)", color: "var(--bg)", borderRadius: 12, marginTop: 8
          }}>
            <div>
              <span className="eyebrow" style={{ color: "#a8a397" }}>Recommended</span>
              <div className="serif" style={{ fontSize: 18, marginTop: 4, letterSpacing: "-0.015em" }}>Take a 2-minute mock interview.</div>
              <div style={{ fontSize: 12, color: "#c8c2b3", marginTop: 4 }}>Tuned to this JD · 4 questions · 11 candidates have run this prep.</div>
            </div>
            <button className="btn btn-accent btn-lg"><Icon.Mic size="14"/> Start mock</button>
          </div>
        </div>

        {/* tabs */}
        <div style={{ padding: "0 28px" }}>
          <div className="tabs">
            {[["overview","Overview"],["jd","JD"],["resumes","Résumé versions",2],["notes","Notes",5],["timeline","Timeline"]].map(([id, label, count]) => (
              <span key={id} className="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
                {label}{count && <span className="count tnum">{count}</span>}
              </span>
            ))}
          </div>
        </div>

        {/* tab body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <Eyebrow>Active résumé version</Eyebrow>
                <div className="card" style={{ padding: 16, marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14, color: "var(--ink)" }}>Linear · v3 (Apr 28)</div>
                    <div style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 2 }}>ATS 94 · 9 changes from base</div>
                  </div>
                  <ScoreChip value={94}/>
                </div>
              </div>

              <div>
                <Eyebrow>People at Linear</Eyebrow>
                <div style={{ display: "flex", flexDirection: "column", marginTop: 10, border: "1px solid var(--hairline)", borderRadius: 10, overflow: "hidden" }}>
                  {[
                    ["Karri Saarinen","CEO · Replied 2d ago",true],
                    ["Linnea Gunnarsson","Design lead · Interview Thu",true],
                    ["Tom Moor","Eng manager","—"],
                  ].map(([n, role, status], i) => (
                    <div key={i} className="row" style={{ gridTemplateColumns: "auto 1fr auto", padding: "12px 14px", borderBottom: i < 2 ? "1px solid var(--hairline)" : "none" }}>
                      <span className="logo-sq" style={{ width: 28, height: 28, fontSize: 11 }}>{n.split(" ").map(s => s[0]).join("")}</span>
                      <div>
                        <div style={{ fontSize: 13 }}>{n}</div>
                        <div style={{ fontSize: 11.5, color: "var(--ink-4)" }}>{role}</div>
                      </div>
                      {status === true && <span className="chip chip-positive">Connected</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Eyebrow>Notes · most recent</Eyebrow>
                <div className="card" style={{ padding: 16, marginTop: 10, fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16, lineHeight: 1.45, color: "var(--ink-2)" }}>
                  "Linnea mentioned the editor team is the highest-craft pod and they care most about typographic detail. Lead with the Notion typography rubric work."
                  <div style={{ fontFamily: "var(--font-mono)", fontStyle: "normal", fontSize: 10.5, color: "var(--ink-4)", marginTop: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Apr 27 · After recruiter call</div>
                </div>
              </div>
            </div>
          )}

          {tab === "resumes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Eyebrow>Tailored versions for this role</Eyebrow>
              {[
                { name: "v3 · Editor-team angle", date: "Apr 28", score: 94, active: true },
                { name: "v2 · Quantified leadership", date: "Apr 22", score: 87 },
                { name: "v1 · Base résumé", date: "Apr 19", score: 71 },
              ].map((r,i) => (
                <div key={i} className="card" style={{ padding: 16, display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 16, alignItems: "center", borderColor: r.active ? "var(--ink)" : "var(--hairline)" }}>
                  <Icon.Doc/>
                  <div>
                    <div style={{ fontSize: 14 }}>{r.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-4)" }}>Saved {r.date} · 1 page</div>
                  </div>
                  <ScoreChip value={r.score}/>
                  <span className="toggle" aria-checked={r.active ? "true" : "false"}/>
                </div>
              ))}
              <button className="btn btn-secondary" style={{ alignSelf: "flex-start", marginTop: 4 }}><Icon.Plus/> New version</button>
            </div>
          )}

          {tab === "timeline" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0, paddingLeft: 14, position: "relative" }}>
              <div style={{ position: "absolute", left: 4, top: 6, bottom: 6, width: 1, background: "var(--hairline-3)" }}/>
              {[
                { d: "Apr 29", t: "Recruiter scheduled interview · Thu 2pm", k: "accent" },
                { d: "Apr 28", t: "Saved tailored résumé v3 (ATS 94)" },
                { d: "Apr 27", t: "Replied to Linnea — confirmed availability" },
                { d: "Apr 24", t: "Recruiter call · 28 min" },
                { d: "Apr 22", t: "Applied via referral" },
                { d: "Apr 19", t: "Saved role" },
              ].map((e, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 14, padding: "10px 0", position: "relative" }}>
                  <span style={{ position: "absolute", left: -10, top: 14, width: 7, height: 7, borderRadius: 50, background: e.k === "accent" ? "var(--accent)" : "var(--ink)" }}/>
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{e.d}</span>
                  <span style={{ fontSize: 13.5, color: e.k === "accent" ? "var(--accent)" : "var(--ink-2)" }}>{e.t}</span>
                </div>
              ))}
            </div>
          )}

          {tab === "jd" && (
            <div style={{ fontFamily: "var(--font-body)", fontSize: 13, lineHeight: 1.6, color: "var(--ink-2)" }}>
              <div className="serif" style={{ fontSize: 18, color: "var(--ink)", marginBottom: 8 }}>About the role</div>
              <p>Linear is looking for a Senior Product Designer to lead the design of a major surface area end-to-end — from research through visual polish — partnering closely with engineering and PM. You'll raise the design quality bar across <mark style={{ background: "var(--accent-soft)", color: "var(--accent)", padding: "0 3px", borderRadius: 2 }}>typography</mark>, <mark style={{ background: "var(--accent-soft)", color: "var(--accent)", padding: "0 3px", borderRadius: 2 }}>motion</mark>, and detail.</p>
            </div>
          )}

          {tab === "notes" && (
            <div className="quote-rule">No notes yet — start a thought, anything.<br/><span style={{ fontStyle: "normal", fontSize: 12, color: "var(--ink-4)", letterSpacing: "0.04em" }}>⌘ + N to add</span></div>
          )}
        </div>

        <div style={{ padding: 20, borderTop: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between" }}>
          <button className="btn btn-ghost"><Icon.Drag/> Move column</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary">Edit details</button>
            <button className="btn btn-primary">Save changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenOptimizerOutput, ScreenKanban, ScreenJobDetail });
