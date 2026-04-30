/* screens-extra.jsx — auxiliary states: empty, loading, dark variant card */

const ScreenEmptyOptimizer = () => (
  <AppShell active="optimizer" crumbs={["Hyrd","Resume optimizer","Drafts"]}>
    <div style={{ padding: "120px 56px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
      <div>
        <Eyebrow>№ 03 · Empty state</Eyebrow>
        <h2 className="serif" style={{ fontSize: 56, letterSpacing: "-0.03em", margin: "16px 0 16px", lineHeight: 1, fontWeight: 400, textWrap: "balance" }}>
          Nothing optimized<br/>just <em style={{ fontStyle: "italic", color: "var(--accent)" }}>yet</em>.
        </h2>
        <p style={{ color: "var(--ink-3)", fontSize: 16, lineHeight: 1.55, maxWidth: "44ch" }}>
          Drop a JD on the right — or upload a résumé to start with — and we'll calibrate to your level. Your first three drafts are on us.
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
          <button className="btn btn-accent btn-lg"><Icon.Sparkle/> Start a draft</button>
          <button className="btn btn-ghost">See sample output →</button>
        </div>
      </div>
      <div style={{ borderLeft: "1px solid var(--hairline)", paddingLeft: 60 }}>
        <div className="quote-rule">
          "The best résumé is the one written for the room you want to be in."
          <div style={{ fontFamily: "var(--font-mono)", fontStyle: "normal", fontSize: 11, marginTop: 14, color: "var(--ink-4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>— Hyrd house style</div>
        </div>
      </div>
    </div>
  </AppShell>
);

const ScreenLoadingOptimizer = () => (
  <AppShell active="optimizer" crumbs={["Hyrd","Resume optimizer","Generating…"]}>
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 360px", height: "100%" }}>
      <div style={{ borderRight: "1px solid var(--hairline)", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <Eyebrow>Sections</Eyebrow>
        {[60,90,75,80,70].map((w,i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px" }}>
            <span className="mono" style={{ fontSize: 10, color: "var(--ink-5)" }}>0{i+1}</span>
            <div className="skel" style={{ height: 10, width: `${w}%` }}/>
          </div>
        ))}
      </div>
      <div style={{ padding: "32px 48px", background: "var(--bg-sunk)", display: "grid", placeItems: "start center" }}>
        <div className="card" style={{ background: "#fffdf7", maxWidth: 720, width: "100%", padding: "44px 56px", boxShadow: "var(--shadow-3)", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ borderBottom: "1px solid var(--hairline)", paddingBottom: 16 }}>
            <div className="skel" style={{ height: 28, width: "40%" }}/>
            <div className="skel" style={{ height: 10, width: "70%", marginTop: 10 }}/>
          </div>
          {[0,1,2].map(i => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="skel" style={{ height: 12, width: 80 }}/>
              <div className="skel" style={{ height: 12, width: "92%" }}/>
              <div className="skel" style={{ height: 12, width: "85%" }}/>
              <div className="skel" style={{ height: 12, width: "78%" }}/>
            </div>
          ))}
          <div style={{ position: "absolute" }}/>
        </div>
      </div>
      <div style={{ borderLeft: "1px solid var(--hairline)", padding: "32px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
        <Eyebrow>Generating</Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {["Parsing résumé","Cross-referencing JD keywords","Quantifying bullets","Composing draft"].map((s, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "16px 1fr auto", alignItems: "center", gap: 10, fontSize: 13 }}>
              {i < 2 ? <Icon.Check/> : i === 2 ? (<span style={{ width: 12, height: 12, borderRadius: 50, border: "1.5px solid var(--accent)", borderTopColor: "transparent", animation: "spin 1s linear infinite" }}/>) : <span style={{ width: 6, height: 6, background: "var(--ink-5)", borderRadius: 50, marginLeft: 3 }}/>}
              <span style={{ color: i < 2 ? "var(--ink-4)" : i === 2 ? "var(--ink)" : "var(--ink-4)" }}>{s}</span>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>{i < 2 ? "✓" : i === 2 ? "0:18" : "—"}</span>
            </div>
          ))}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div className="rule"/>
        <span className="quote-rule" style={{ fontSize: 17, lineHeight: 1.4 }}>"Quantification first. Then the verbs. Then the cuts." </span>
      </div>
    </div>
  </AppShell>
);

const ScreenDashboardDark = () => (
  <div data-theme="dark" style={{ height: "100%", background: "var(--bg)" }}>
    <ScreenDashboard/>
  </div>
);

Object.assign(window, { ScreenEmptyOptimizer, ScreenLoadingOptimizer, ScreenDashboardDark });
