/* screens-1.jsx — Screens 01 Auth, 02 Dashboard, 03 Optimizer Input, 10 Settings */

/* ─────────────── 01 · AUTH / ONBOARDING ─────────────── */
const ScreenAuth = () => (
  <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", height: "100%", background: "var(--bg)" }}>
    {/* Left — editorial pane */}
    <div style={{ padding: "56px 64px", display: "flex", flexDirection: "column", justifyContent: "space-between", borderRight: "1px solid var(--hairline)", position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Brand size="lg" />
        <span className="eyebrow">Vol. 01 · The Career Desk</span>
      </div>
      <div>
        <span className="eyebrow">A premium career platform</span>
        <h1 className="serif" style={{ fontSize: 84, lineHeight: 0.95, letterSpacing: "-0.035em", margin: "20px 0 24px", fontWeight: 400, textWrap: "balance" }}>
          Job hunting,<br/><em style={{ fontStyle: "italic", color: "var(--accent)" }}>composed.</em>
        </h1>
        <p style={{ fontSize: 17, color: "var(--ink-3)", maxWidth: 46, lineHeight: 1.55, maxWidth: "44ch", margin: 0 }}>
          A quiet workspace for serious candidates. Optimize a résumé, track every application, rehearse with AI, and arrive prepared. No streaks, no badges — just signal.
        </p>
      </div>
      <div style={{ display: "flex", gap: 40, alignItems: "baseline" }}>
        <div>
          <div className="serif" style={{ fontSize: 44, letterSpacing: "-0.03em" }}>14k</div>
          <div className="eyebrow" style={{ marginTop: 2 }}>offers in the last 12mo</div>
        </div>
        <div style={{ width: 1, alignSelf: "stretch", background: "var(--hairline)" }}/>
        <div>
          <div className="serif" style={{ fontSize: 44, letterSpacing: "-0.03em" }}>+38<span style={{ fontSize: 22 }}>%</span></div>
          <div className="eyebrow" style={{ marginTop: 2 }}>median ATS score lift</div>
        </div>
        <div style={{ width: 1, alignSelf: "stretch", background: "var(--hairline)" }}/>
        <div>
          <div className="serif" style={{ fontSize: 44, letterSpacing: "-0.03em" }}>4.9</div>
          <div className="eyebrow" style={{ marginTop: 2 }}>across 2,800 reviews</div>
        </div>
      </div>
    </div>

    {/* Right — sign-in card */}
    <div style={{ padding: "56px 64px", display: "flex", flexDirection: "column", gap: 28, justifyContent: "center", maxWidth: 520, width: "100%" }}>
      <div>
        <span className="eyebrow">№ 01 · Sign in</span>
        <h2 className="serif" style={{ fontSize: 36, letterSpacing: "-0.025em", margin: "8px 0 8px" }}>Welcome back.</h2>
        <p style={{ color: "var(--ink-3)", margin: 0, fontSize: 14 }}>Pick up where you left off — 3 active interviews, 2 résumés awaiting review.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <button className="btn btn-secondary btn-lg" style={{ justifyContent: "center", width: "100%" }}>
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.5-.2-2.2H12v4.2h5.6a4.8 4.8 0 0 1-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.7z"/><path fill="#34A853" d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7V16A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.2 13.6a6 6 0 0 1 0-3.8V7.2H2.7a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.9.5 4 1.5l3-3A10 10 0 0 0 12 2 10 10 0 0 0 2.7 7.2l3.5 2.6c.8-2.5 3.1-3.9 5.8-3.9z"/></svg>
          Continue with Google
        </button>
        <button className="btn btn-secondary btn-lg" style={{ justifyContent: "center", width: "100%" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 1.7c0 1.3-.5 2.6-1.4 3.5-.9 1-2.4 1.7-3.6 1.6-.1-1.3.5-2.6 1.4-3.5.9-1 2.4-1.7 3.6-1.6zM20 17.5c-.5 1.2-.8 1.8-1.5 2.9-1 1.5-2.4 3.4-4.1 3.4s-2.2-1.1-4.5-1.1-2.9 1.1-4.5 1.1-3-1.7-4-3.2C-1 17.6-.5 11.4 3 9c1.3-.9 2.7-1.4 4-1.4 1.7 0 2.9 1 4.4 1s2.5-1 4.6-1c1.2 0 2.6.4 3.6 1.2-3.1 1.7-2.6 6.2.4 7.7z"/></svg>
          Continue with Apple
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div className="rule" style={{ flex: 1 }}/>
        <span className="eyebrow">or</span>
        <div className="rule" style={{ flex: 1 }}/>
      </div>

      <div className="field">
        <label className="label">Email</label>
        <input className="input" defaultValue="maya.rivera@gmail.com"/>
      </div>
      <div className="field">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <label className="label">Password</label>
          <span style={{ fontSize: 11.5, color: "var(--ink-4)", textDecoration: "underline", textUnderlineOffset: 2 }}>Forgot?</span>
        </div>
        <input className="input" type="password" defaultValue="••••••••••••"/>
      </div>

      <button className="btn btn-primary btn-lg" style={{ justifyContent: "center" }}>
        Sign in <Icon.ArrowR />
      </button>

      <p style={{ fontSize: 12.5, color: "var(--ink-4)", margin: 0, textAlign: "center" }}>
        New here? <span style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: 2 }}>Create an account</span> · 14-day trial, no card.
      </p>
    </div>
  </div>
);

/* ─────────────── 01b · ONBOARDING ─────────────── */
const ScreenOnboarding = () => (
  <div style={{ background: "var(--bg)", height: "100%", display: "flex", flexDirection: "column" }}>
    {/* top bar */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 56px", borderBottom: "1px solid var(--hairline)" }}>
      <Brand />
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <span className="eyebrow">Step</span>
        <span className="serif tnum" style={{ fontSize: 18 }}>02</span>
        <span className="eyebrow">/ 03</span>
      </div>
      <span style={{ fontSize: 12.5, color: "var(--ink-4)" }}>Skip for now</span>
    </div>

    {/* progress */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "16px 56px" }}>
      <div style={{ height: 2, background: "var(--ink)" }}/>
      <div style={{ height: 2, background: "var(--ink)" }}/>
      <div style={{ height: 2, background: "var(--hairline-3)" }}/>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 64, padding: "48px 96px", alignItems: "start", flex: 1 }}>
      {/* left — copy */}
      <div>
        <span className="eyebrow">№ 02 · Tell us your shape</span>
        <h2 className="serif" style={{ fontSize: 56, letterSpacing: "-0.03em", margin: "16px 0 16px", lineHeight: 1.0, fontWeight: 400, textWrap: "balance" }}>
          Where are you<br/>aiming, <em style={{ fontStyle: "italic", color: "var(--accent)" }}>Maya</em>?
        </h2>
        <p style={{ color: "var(--ink-3)", fontSize: 16, lineHeight: 1.55, maxWidth: "44ch" }}>
          A 60-second sketch — role, seniority, and one résumé. We'll calibrate the optimizer to your level and tone, then put everything together for you.
        </p>

        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 14, maxWidth: 460 }}>
          <div className="field">
            <label className="label">Target role</label>
            <input className="input" defaultValue="Senior Product Designer"/>
          </div>
          <div className="field">
            <label className="label">Years of experience</label>
            <div className="seg" role="radiogroup">
              {["0–2", "3–5", "6–8", "9–12", "13+"].map((s, i) => (
                <button key={s} aria-pressed={i === 2}>{s}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <label className="label">Industry focus</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["Fintech", "Developer tools", "Consumer", "Healthcare", "AI / ML", "Enterprise SaaS", "Climate"].map((t, i) => (
                <span key={t} className={`chip ${[1,4].includes(i) ? "chip-ink" : ""}`} style={{ height: 28, fontSize: 11.5, padding: "0 12px", cursor: "pointer" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* right — résumé upload */}
      <div className="card" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 16 }}>
        <span className="eyebrow">Initial résumé</span>
        <h3 className="serif" style={{ fontSize: 22, margin: 0, letterSpacing: "-0.02em" }}>Drop your most recent CV.</h3>
        <p style={{ color: "var(--ink-3)", fontSize: 13.5, margin: 0, lineHeight: 1.55 }}>
          PDF or DOCX, under 8MB. We parse it locally and never share it. You'll be able to revise this for every role.
        </p>

        <div style={{
          marginTop: 8,
          border: "1px dashed var(--hairline-3)",
          borderRadius: 14,
          padding: "44px 24px",
          textAlign: "center",
          background: "var(--bg)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 14
        }}>
          <div style={{ width: 56, height: 64, background: "var(--bg-raised)", border: "1px solid var(--hairline-3)", borderRadius: 6, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 8, position: "relative" }}>
            <div style={{ position: "absolute", top: 6, left: 6, right: 6, height: 1, background: "var(--hairline-3)" }}/>
            <div style={{ position: "absolute", top: 12, left: 6, right: 16, height: 1, background: "var(--hairline-3)" }}/>
            <div style={{ position: "absolute", top: 18, left: 6, right: 10, height: 1, background: "var(--hairline-3)" }}/>
            <span className="mono" style={{ fontSize: 9, color: "var(--ink-4)" }}>PDF</span>
          </div>
          <div className="serif" style={{ fontSize: 18 }}>Drop file here</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-4)" }}>or <span style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: 2 }}>browse files</span></div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <button className="btn btn-ghost"><Icon.ArrowL/> Back</button>
          <button className="btn btn-primary btn-lg">Continue <Icon.ArrowR/></button>
        </div>
      </div>
    </div>
  </div>
);

/* ─────────────── 02 · DASHBOARD ─────────────── */
const ScreenDashboard = () => {
  const upcoming = [
    { co: "Linear", role: "Senior Product Designer", when: "Thu, 2:00 PM", in: "1d 4h", color: "#5e6ad2" },
    { co: "Stripe", role: "Staff Engineer, Payments", when: "Fri, 11:00 AM", in: "2d 1h", color: "#635bff" },
    { co: "Figma",  role: "Product Designer, Editor", when: "Mon, 9:30 AM", in: "5d", color: "#a259ff" },
  ];
  const trend = [62, 68, 71, 70, 76, 79, 78, 82, 85, 84, 86, 88, 86, 89];
  return (
    <AppShell active="home" crumbs={["Hyrd", "Home"]}
      topnavRight={<><button className="btn btn-secondary btn-sm"><Icon.Plus/> Add job</button><button className="btn btn-accent btn-sm"><Icon.Sparkle/> Optimize résumé</button></>}>
      <div style={{ padding: "40px 56px 64px", display: "flex", flexDirection: "column", gap: 40 }}>
        {/* Greeting */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid var(--ink)", paddingBottom: 24 }}>
          <div>
            <span className="eyebrow">Wednesday, 29 April · 9:42 AM</span>
            <h1 className="serif" style={{ fontSize: 64, lineHeight: 1.0, letterSpacing: "-0.035em", margin: "10px 0 0", fontWeight: 400, textWrap: "balance" }}>
              Good morning, <em style={{ fontStyle: "italic" }}>Maya</em>.<br/>
              <span style={{ color: "var(--ink-3)" }}>14 active applications.</span> <em style={{ fontStyle: "italic", color: "var(--accent)" }}>3 interviews</em> this week.
            </h1>
          </div>
        </div>

        {/* Top row: Primary action + Up next + Performance */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1fr", gap: 16 }}>
          {/* Primary CTA */}
          <div className="card" style={{ padding: 28, background: "var(--ink)", color: "var(--bg)", borderColor: "var(--ink)", display: "flex", flexDirection: "column", gap: 18, position: "relative", overflow: "hidden" }}>
            <span className="eyebrow" style={{ color: "#a8a397" }}>Primary action</span>
            <div className="serif" style={{ fontSize: 32, lineHeight: 1.05, letterSpacing: "-0.025em" }}>
              Tailor a résumé to a job description.
            </div>
            <p style={{ color: "#c8c2b3", fontSize: 13.5, margin: 0, maxWidth: "42ch", lineHeight: 1.55 }}>
              Drop in any JD and we'll quantify your bullets, weave in the right keywords, and return a recruiter-grade draft in about 30 seconds.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button className="btn btn-accent">Start optimizing <Icon.ArrowR/></button>
              <button className="btn btn-ghost" style={{ color: "#c8c2b3" }}>See last result</button>
            </div>
            {/* decorative serif numeral */}
            <div className="serif" aria-hidden="true" style={{ position: "absolute", right: -12, bottom: -56, fontSize: 280, lineHeight: 1, color: "#ffffff08", letterSpacing: "-0.05em", fontStyle: "italic", pointerEvents: "none" }}>R</div>
          </div>

          {/* Up next */}
          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span className="eyebrow">Up next · Interviews</span>
              <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>3 this week</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {upcoming.map((u, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14, alignItems: "center", padding: "14px 0", borderBottom: i < 2 ? "1px solid var(--hairline)" : "none" }}>
                  <LogoSq name={u.co} color={u.color} size={36}/>
                  <div>
                    <div style={{ fontSize: 14, color: "var(--ink)" }}>{u.role}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 2 }}>{u.co} · {u.when}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="serif tnum" style={{ fontSize: 18, color: i === 0 ? "var(--accent)" : "var(--ink)", letterSpacing: "-0.02em" }}>{u.in}</div>
                    <div className="eyebrow" style={{ fontSize: 9.5 }}>until</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trend */}
          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="eyebrow">Recent performance</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span className="serif tnum" style={{ fontSize: 56, letterSpacing: "-0.04em", lineHeight: 1 }}>86</span>
              <span style={{ color: "var(--ink-4)", fontSize: 13 }}>avg score</span>
              <span className="chip chip-positive" style={{ marginLeft: "auto" }}>+8 vs prior</span>
            </div>
            <Sparkline values={trend} width={240} height={48} accent="var(--accent)"/>
            <div className="eyebrow" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>14 mock interviews · 30d</span>
              <span style={{ color: "var(--ink-3)" }}>see all →</span>
            </div>
          </div>
        </div>

        {/* Kanban preview */}
        <div>
          <SectionMark num="01" title="Job tracker" right={<button className="btn btn-ghost btn-sm">Open board <Icon.ArrowR/></button>}/>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
            {[
              { name: "Saved", count: 6, items: [["Notion","Sr Designer"],["Vercel","Design Lead"]] },
              { name: "Applied", count: 4, items: [["Stripe","Staff Eng"],["Anthropic","Sr Designer"]] },
              { name: "Interview", count: 3, items: [["Linear","Sr Designer", true]], accent: true },
              { name: "Offer", count: 1, items: [["Figma","Sr Designer"]] },
              { name: "Rejected", count: 2, items: [["Airbnb","Sr Designer"]] },
            ].map((col, i) => (
              <div key={i} className="card" style={{ padding: 14, background: col.accent ? "var(--bg-raised)" : "var(--bg)", borderColor: col.accent ? "var(--accent)" : "var(--hairline)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span className="label">{col.name}</span>
                  <span className="serif tnum" style={{ fontSize: 14 }}>{col.count}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {col.items.map((it, j) => (
                    <div key={j} style={{ background: "var(--bg-raised)", border: "1px solid var(--hairline)", borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 12.5, color: "var(--ink)", letterSpacing: "-0.005em" }}>{it[1]}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 2 }}>{it[0]}</div>
                      {it[2] && <span className="chip chip-accent" style={{ marginTop: 8 }}>Thu 2pm</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

/* ─────────────── 03 · OPTIMIZER INPUT ─────────────── */
const ScreenOptimizerInput = () => (
  <AppShell active="optimizer" crumbs={["Hyrd","Resume optimizer","New draft"]}
    topnavRight={<><button className="btn btn-ghost btn-sm">Drafts (3)</button></>}>
    <div style={{ padding: "32px 56px 64px" }}>
      <SectionMark num="03" title="Tailor a résumé"
        right={<span className="eyebrow">Untitled draft · auto-saved</span>}/>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Résumé upload */}
        <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Eyebrow>Your résumé</Eyebrow>
            <Eyebrow style={{ color: "var(--positive)" }}>● Parsed</Eyebrow>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "center", background: "var(--bg)", border: "1px solid var(--hairline)", borderRadius: 10, padding: 16 }}>
            <div style={{ width: 48, height: 60, background: "var(--bg-raised)", border: "1px solid var(--hairline-3)", borderRadius: 4, position: "relative", overflow: "hidden" }}>
              {[8,14,20,28,34,40,48].map((y,i) => (
                <div key={i} style={{ position: "absolute", left: 5, right: i%2 ? 12 : 8, top: y, height: 1, background: "var(--hairline-3)" }}/>
              ))}
              <span className="mono" style={{ position: "absolute", bottom: 4, left: 5, fontSize: 8, color: "var(--ink-4)" }}>PDF</span>
            </div>
            <div>
              <div style={{ fontSize: 14, color: "var(--ink)" }}>maya-rivera-resume-v4.pdf</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 2 }}>248KB · 1 page · 412 words · 16 bullets</div>
            </div>
            <button className="btn btn-ghost btn-sm">Replace</button>
          </div>

          <div style={{
            border: "1px dashed var(--hairline-3)",
            borderRadius: 10, padding: "20px 16px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            color: "var(--ink-4)", fontSize: 12.5
          }}>
            <Icon.Upload/> Drop another version to compare
          </div>
        </div>

        {/* JD paste */}
        <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Eyebrow>Job description</Eyebrow>
            <span className="chip chip-accent">Auto-detected · Senior PD</span>
          </div>
          <textarea className="textarea" rows="9" defaultValue={`About the role
Linear is looking for a Senior Product Designer to join our small, opinionated design team. You'll lead the design of a major surface area end-to-end — from research through visual polish — partnering closely with engineering and PM.

What you'll do
• Drive design for one or more product areas across web and desktop
• Translate ambiguous problems into focused, principled product decisions
• Raise the design quality bar with attention to typography, motion, and detail
• Run user research and usability testing alongside cross-functional teammates`}/>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5, color: "var(--ink-4)" }}>
            <span>1,284 / 8,000 characters</span>
            <span>14 keywords detected · 3 priority terms</span>
          </div>
        </div>
      </div>

      {/* Tone + length */}
      <div className="card" style={{ padding: 24, marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 32, alignItems: "center" }}>
        <div>
          <Eyebrow>Tone</Eyebrow>
          <div className="seg" style={{ marginTop: 8 }} role="radiogroup">
            {["Concise","Impactful","Executive"].map((t,i) => <button key={t} aria-pressed={i === 1}>{t}</button>)}
          </div>
        </div>
        <div>
          <Eyebrow>Length</Eyebrow>
          <div className="seg" style={{ marginTop: 8 }} role="radiogroup">
            {["1 page","2 pages"].map((t,i) => <button key={t} aria-pressed={i === 0}>{t}</button>)}
          </div>
        </div>
        <div>
          <Eyebrow>Emphasis</Eyebrow>
          <div className="seg" style={{ marginTop: 8 }} role="radiogroup">
            {["Quantify","Leadership","Craft"].map((t,i) => <button key={t} aria-pressed={i === 0}>{t}</button>)}
          </div>
        </div>
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="btn btn-accent btn-lg" style={{ padding: "0 24px" }}>
            <Icon.Sparkle/> Optimize résumé
          </button>
          <span className="eyebrow" style={{ alignSelf: "flex-end" }}>~30 seconds · 1 of 50 today</span>
        </div>
      </div>
    </div>
  </AppShell>
);

/* ─────────────── 10 · SETTINGS ─────────────── */
const ScreenSettings = () => (
  <AppShell active="settings" crumbs={["Hyrd","Settings","Profile"]}>
    <div style={{ padding: "40px 56px", display: "grid", gridTemplateColumns: "200px 1fr", gap: 56 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {[["Profile",true],["Voice & interview"],["Notifications"],["Integrations"],["Billing"],["Security"],["Export"]].map(([n, on]) => (
          <a key={n} className="side-link" aria-current={on ? "page" : undefined}>{n}</a>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <SectionMark num="10" title="Profile"/>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="field"><label className="label">First name</label><input className="input" defaultValue="Maya"/></div>
          <div className="field"><label className="label">Last name</label><input className="input" defaultValue="Rivera"/></div>
          <div className="field"><label className="label">Email</label><input className="input" defaultValue="maya.rivera@gmail.com"/></div>
          <div className="field"><label className="label">Pronouns</label><input className="input" defaultValue="she / her"/></div>
          <div className="field" style={{ gridColumn: "1 / -1" }}><label className="label">Headline</label><input className="input" defaultValue="Senior Product Designer · 7 yrs · ex-Notion"/></div>
        </div>

        <div className="rule"/>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="serif" style={{ fontSize: 20, letterSpacing: "-0.02em" }}>Two-factor authentication</div>
              <div style={{ color: "var(--ink-4)", fontSize: 12.5, marginTop: 2 }}>Required for paid plans. Authenticator app preferred.</div>
            </div>
            <span className="toggle" aria-checked="true"></span>
          </div>
        </div>

        <div className="rule"/>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="serif" style={{ fontSize: 20, letterSpacing: "-0.02em" }}>Default voice</div>
              <div style={{ color: "var(--ink-4)", fontSize: 12.5, marginTop: 2 }}>Used for AI mock interviews unless you change it per session.</div>
            </div>
            <select className="select" style={{ width: 220 }} defaultValue="Halden">
              <option>Halden — neutral, baritone</option>
              <option>Mira — warm, alto</option>
              <option>Jules — crisp, mid</option>
            </select>
          </div>
        </div>

        <div className="rule"/>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="serif" style={{ fontSize: 20, letterSpacing: "-0.02em", color: "var(--negative)" }}>Delete account</div>
            <div style={{ color: "var(--ink-4)", fontSize: 12.5, marginTop: 2 }}>Removes everything — résumés, interviews, transcripts. Irreversible.</div>
          </div>
          <button className="btn btn-secondary">Delete</button>
        </div>
      </div>
    </div>
  </AppShell>
);

Object.assign(window, { ScreenAuth, ScreenOnboarding, ScreenDashboard, ScreenOptimizerInput, ScreenSettings });
