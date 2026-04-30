/* screens-3.jsx — 07 Pre-call lobby, 08 Live call (hero), 09 Performance Dashboard (hero) */

/* ─────────────── 07 · PRE-CALL LOBBY ─────────────── */
const ScreenInterviewLobby = () => {
  const [voice, setVoice] = React.useState(0);
  const [style, setStyle] = React.useState(1);
  const voices = [
    { name: "Halden", desc: "Neutral · baritone · 0.9× pace" },
    { name: "Mira",   desc: "Warm · alto · 1.0× pace" },
    { name: "Jules",  desc: "Crisp · mid · 1.05× pace" },
  ];
  const styles = ["Friendly","Neutral","Tough"];
  return (
    <div style={{ height: "100%", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--hairline)" }}>
        <Brand size="sm"/>
        <span className="eyebrow">№ 07 · Pre-call lobby</span>
        <button className="btn btn-ghost btn-sm"><Icon.X/> Cancel</button>
      </div>

      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 40 }}>
        <div style={{ width: 720, display: "flex", flexDirection: "column", gap: 28 }}>
          {/* Job context header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "var(--bg-raised)", border: "1px solid var(--hairline)", borderRadius: 12 }}>
            <LogoSq name="Linear" color="#5e6ad2" size={36}/>
            <div style={{ flex: 1 }}>
              <span className="eyebrow">Mock interview · tuned to JD</span>
              <div style={{ fontSize: 14, color: "var(--ink)" }}>Senior Product Designer · Linear</div>
            </div>
            <span className="chip">4 questions</span>
            <span className="chip">2 min</span>
          </div>

          <div style={{ textAlign: "center" }}>
            <Eyebrow>Before we begin</Eyebrow>
            <h1 className="serif" style={{ fontSize: 56, letterSpacing: "-0.03em", margin: "10px 0 6px", lineHeight: 1.05, fontWeight: 400 }}>
              <em style={{ fontStyle: "italic" }}>Compose</em> yourself.
            </h1>
            <p style={{ color: "var(--ink-3)", fontSize: 15, margin: 0, maxWidth: 460, marginInline: "auto" }}>
              Two minutes, four questions, voice only. You can end anytime — your transcript is saved.
            </p>
          </div>

          {/* Mic check */}
          <div className="card" style={{ padding: 22, display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 44, height: 44, borderRadius: 50, background: "var(--positive-soft)", color: "var(--positive)", display: "grid", placeItems: "center" }}>
              <Icon.Mic/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 14, color: "var(--ink)" }}>Microphone · MacBook Pro</span>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--positive)", letterSpacing: "0.1em", textTransform: "uppercase" }}>● Listening</span>
              </div>
              {/* live waveform */}
              <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 8, height: 24 }}>
                {[6,12,18,10,22,16,8,14,20,11,24,18,9,16,21,12,18,14,10,22,16,8,14,20,11,24,18,9,16,21,12,18,14,10,22,16,8,14].map((h,i) => (
                  <span key={i} style={{ width: 2, height: h, background: "var(--ink)", opacity: i % 4 === 0 ? 0.9 : 0.5, borderRadius: 1 }}/>
                ))}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm">Change device</button>
          </div>

          {/* Voice picker */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Eyebrow>Interviewer voice</Eyebrow>
              <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>Tap to preview</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 12 }}>
              {voices.map((v, i) => (
                <button key={i} onClick={() => setVoice(i)} style={{
                  textAlign: "left", padding: 14, borderRadius: 10,
                  background: voice === i ? "var(--ink)" : "var(--bg)",
                  color: voice === i ? "var(--bg)" : "var(--ink)",
                  border: `1px solid ${voice === i ? "var(--ink)" : "var(--hairline)"}`,
                  cursor: "pointer", display: "flex", flexDirection: "column", gap: 6,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="serif" style={{ fontSize: 18, letterSpacing: "-0.015em" }}>{v.name}</span>
                    <span style={{ width: 24, height: 24, borderRadius: 50, border: "1px solid currentColor", display: "grid", placeItems: "center" }}>▶</span>
                  </div>
                  <span className="mono" style={{ fontSize: 10.5, opacity: 0.7, letterSpacing: "0.06em" }}>{v.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "center" }}>
            <div>
              <Eyebrow>Interviewer style</Eyebrow>
              <div className="seg" style={{ marginTop: 8 }}>
                {styles.map((s,i) => <button key={s} aria-pressed={style === i} onClick={() => setStyle(i)}>{s}</button>)}
              </div>
            </div>
            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 6 }}>
              <button className="btn btn-accent btn-lg" style={{ alignSelf: "flex-end", padding: "0 28px" }}>
                Begin interview <Icon.ArrowR/>
              </button>
              <span className="eyebrow" style={{ alignSelf: "flex-end" }}>2 minutes · You can end anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── 08 · LIVE CALL (HERO) ─────────────── */
const ScreenInterviewLive = () => (
  <div style={{ height: "100%", background: "#14130e", color: "#ece7dc", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
    {/* grain overlay */}
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.4, pointerEvents: "none", mixBlendMode: "overlay" }}>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.06 0"/></filter>
      <rect width="100%" height="100%" filter="url(#grain)"/>
    </svg>

    {/* top bar */}
    <div style={{ padding: "20px 32px", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", borderBottom: "1px solid #ece7dc14" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 8, height: 8, borderRadius: 50, background: "#d96b56", boxShadow: "0 0 12px #d96b56" }}/>
        <span className="mono" style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#a8a397" }}>Recording · Thu, 1:47 PM</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span className="eyebrow" style={{ color: "#74706a" }}>Question</span>
        <span className="serif tnum" style={{ fontSize: 18, letterSpacing: "-0.01em" }}>02</span>
        <span className="eyebrow" style={{ color: "#74706a" }}>of 04</span>
      </div>
      <div style={{ textAlign: "right" }}>
        <span className="serif tnum" style={{ fontSize: 22, color: "#d97a4a", letterSpacing: "-0.02em" }}>00:42</span>
        <span className="mono" style={{ fontSize: 11, color: "#74706a", marginLeft: 6 }}>· remaining</span>
      </div>
    </div>

    {/* center stage */}
    <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 40, position: "relative" }}>
      {/* Concentric blob */}
      <div style={{ position: "relative", width: 460, height: 460, display: "grid", placeItems: "center" }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            position: "absolute",
            width: 140 + i * 70, height: 140 + i * 70,
            borderRadius: "50%",
            border: "1px solid #ece7dc14",
            opacity: 1 - i * 0.18,
          }}/>
        ))}
        {/* outer halo */}
        <div style={{
          position: "absolute", width: 380, height: 380, borderRadius: "50%",
          background: "radial-gradient(circle at 40% 35%, #d97a4a44, transparent 65%)",
          filter: "blur(8px)",
        }}/>
        {/* main blob */}
        <div style={{
          position: "absolute", width: 240, height: 240, borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%, #f4d4b8, #d97a4a 55%, #9c4a2c 100%)",
          boxShadow: "0 0 80px #d97a4a40, inset -20px -30px 60px #00000040, inset 20px 20px 50px #ffffff20",
        }}/>
        {/* inner highlight */}
        <div style={{
          position: "absolute", width: 60, height: 60, borderRadius: "50%",
          background: "radial-gradient(circle, #fff8, transparent 70%)",
          top: 130, left: 130,
        }}/>

        <div style={{ position: "absolute", bottom: -40, textAlign: "center" }}>
          <span className="mono" style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#d97a4a" }}>● Halden is speaking</span>
        </div>
      </div>

      {/* Question text overlay */}
      <div style={{ position: "absolute", bottom: 140, left: 0, right: 0, textAlign: "center", padding: "0 80px" }}>
        <div className="serif" style={{ fontSize: 36, lineHeight: 1.2, letterSpacing: "-0.02em", color: "#fff", fontWeight: 400, textWrap: "balance" }}>
          "Walk me through the <em style={{ fontStyle: "italic", color: "#d97a4a" }}>last shipped project</em> you're most proud of — what made it hard?"
        </div>
      </div>
    </div>

    {/* bottom bar */}
    <div style={{ padding: "20px 32px 28px", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 24, borderTop: "1px solid #ece7dc14" }}>
      {/* user mic */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 36, height: 36, borderRadius: 50, background: "#ece7dc14", display: "grid", placeItems: "center", border: "1px solid #ece7dc20" }}>
          <Icon.Mic size="16"/>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 1.5, height: 18 }}>
          {Array.from({length: 22}).map((_,i) => {
            const h = [3,5,4,7,9,12,8,5,3,4,6,9,11,8,5,4,3,5,7,8,5,3][i];
            return <span key={i} style={{ width: 2, height: h, background: "#ece7dc", opacity: 0.6, borderRadius: 1 }}/>;
          })}
        </div>
        <span className="mono" style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "#74706a" }}>Your mic · muted while AI speaks</span>
      </div>

      {/* end button */}
      <button style={{
        width: 78, height: 78, borderRadius: 50,
        background: "#d96b56", color: "#14130e",
        border: "none", cursor: "pointer",
        display: "grid", placeItems: "center",
        boxShadow: "0 0 0 8px #d96b5614, 0 0 28px #d96b5640",
      }}>
        <span style={{ width: 24, height: 24, background: "#14130e", borderRadius: 4 }}/>
      </button>

      {/* transcript toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "flex-end" }}>
        <span className="mono" style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "#74706a" }}>Live transcript</span>
        <span className="toggle" style={{ background: "#d97a4a" }} aria-checked="true"/>
      </div>
    </div>

    {/* Floating live transcript */}
    <div style={{
      position: "absolute", left: 32, top: 120, width: 320,
      background: "#1c1a1480", backdropFilter: "blur(20px)",
      border: "1px solid #ece7dc14", borderRadius: 12,
      padding: 16, display: "flex", flexDirection: "column", gap: 10
    }}>
      <Eyebrow style={{ color: "#74706a" }}>Live transcript</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, lineHeight: 1.55 }}>
        <div>
          <span className="mono" style={{ fontSize: 10, color: "#d97a4a", textTransform: "uppercase", letterSpacing: "0.12em" }}>Halden · 0:18</span>
          <p style={{ margin: "2px 0 0", color: "#d8d3c5" }}>Walk me through the last shipped project you're most proud of — what made it hard?</p>
        </div>
        <div>
          <span className="mono" style={{ fontSize: 10, color: "#a8a397", textTransform: "uppercase", letterSpacing: "0.12em" }}>You · 0:42</span>
          <p style={{ margin: "2px 0 0", color: "#ece7dc" }}>Sure — last quarter we shipped the AI database editor at Notion. The hard part was that the existing model for editing rows assumed a deterministic… <span style={{ color: "#d97a4a", borderBottom: "1px dotted #d97a4a" }}>um</span>, <span style={{ background: "#fff2", color: "#fff", padding: "0 2px" }}>typing…</span></p>
        </div>
      </div>
    </div>
  </div>
);

/* ─────────────── 09 · PERFORMANCE DASHBOARD (HERO) ─────────────── */
const ScreenPerformance = () => {
  const dims = ["Clarity","Confidence","Relevance","Structure","Technical","Pace"];
  const value = [0.86, 0.78, 0.92, 0.74, 0.82, 0.65];
  const compare = [0.72, 0.70, 0.75, 0.65, 0.74, 0.55];

  return (
    <AppShell active="performance" crumbs={["Hyrd","Performance","Linear · Sr Designer"]}
      topnavRight={<><button className="btn btn-secondary btn-sm"><Icon.Download/> Report</button><button className="btn btn-ghost btn-sm">Compare runs (3)</button></>}>
      <div style={{ padding: "32px 56px 80px", display: "flex", flexDirection: "column", gap: 40 }}>
        {/* HERO */}
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr auto", gap: 48, alignItems: "center", paddingBottom: 32, borderBottom: "1px solid var(--ink)" }}>
          <RadialGauge value={84} size={240} label="Overall · 84"/>
          <div>
            <Eyebrow>№ 09 · Performance · Run 03</Eyebrow>
            <h1 className="serif" style={{ fontSize: 64, lineHeight: 1.0, letterSpacing: "-0.035em", margin: "10px 0 16px", fontWeight: 400, textWrap: "balance" }}>
              Strong, with one <em style={{ fontStyle: "italic", color: "var(--accent)" }}>soft edge</em>.
            </h1>
            <p style={{ color: "var(--ink-3)", fontSize: 15, lineHeight: 1.55, margin: 0, maxWidth: "52ch" }}>
              Your second answer landed cleanly — quantified, structured, well-paced. Q4 ran long and lost the through-line; pace dropped to 178 wpm. Detail below.
            </p>
            <div style={{ display: "flex", gap: 22, marginTop: 18 }}>
              <span className="eyebrow">Linear · Sr Product Designer</span>
              <span style={{ width: 1, background: "var(--hairline)" }}/>
              <span className="eyebrow">Apr 29 · 1:47 PM · 1m 58s</span>
              <span style={{ width: 1, background: "var(--hairline)" }}/>
              <span className="eyebrow">Halden · Neutral</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <span className="chip chip-positive">+12 vs last run</span>
            <span className="chip">Top 18% of attempts</span>
          </div>
        </div>

        {/* RADAR + breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 40, alignItems: "center" }}>
          <div className="card" style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ alignSelf: "stretch", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Eyebrow>Six dimensions</Eyebrow>
              <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>Solid line: this run · Dashed: 30d avg</span>
            </div>
            <Radar axes={dims} size={300} value={value} compare={compare}/>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, borderTop: "1px solid var(--hairline)" }}>
            {dims.map((d, i) => {
              const v = Math.round(value[i] * 100);
              const range = v >= 80 ? "high" : v >= 65 ? "mid" : "low";
              return (
                <div key={d} style={{ display: "grid", gridTemplateColumns: "auto 1fr 60px auto", gap: 18, alignItems: "center", padding: "16px 0", borderBottom: "1px solid var(--hairline)" }}>
                  <span className="mono tnum" style={{ fontSize: 11, color: "var(--ink-4)", width: 24 }}>0{i+1}</span>
                  <div>
                    <div style={{ fontSize: 14, color: "var(--ink)" }}>{d}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 2 }}>
                      {["Smooth, well-articulated","Mostly steady, two hesitations","Strongest dimension — every answer on-topic","Two answers without STAR scaffolding","Demonstrated depth on system design","Slowed in answer 4 — 178 wpm"][i]}
                    </div>
                  </div>
                  <span className="serif tnum" style={{ fontSize: 28, letterSpacing: "-0.025em", color: range === "high" ? "var(--positive)" : range === "mid" ? "var(--warning)" : "var(--negative)" }}>{v}</span>
                  <ScoreChip value={v}/>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question-by-question */}
        <div>
          <SectionMark num="04" title="Question by question"
            right={<div className="seg"><button aria-pressed="true">All 4</button><button>Issues only</button></div>}/>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { q: "Tell me about yourself in 60 seconds.", score: 87, time: "0:48", ans: "Senior product designer, seven years across Notion and Mailchimp, lately leading the AI editor at Notion. I gravitate toward technically ambiguous surfaces and care a lot about typographic detail…", suggest: "Your opening line is strong. Tighten the middle by leading with one outcome (the 41% time-to-first-row) before listing companies." },
              { q: "Walk me through your last shipped project — what made it hard?", score: 92, time: "0:42", ans: "Last quarter we shipped the AI database editor at Notion. The hard part was the editing model assumed determinism…", suggest: null },
              { q: "Disagreement with engineering — what did you do?", score: 76, time: "0:38", ans: "There was a moment where the staff engineer wanted to ship without the empty state. I, um, pushed back and we…", suggest: "Use STAR more explicitly. Two clear sentences for Situation and Task before Action; Result was buried at the end." },
              { q: "Why Linear?", score: 68, time: "0:50", ans: "Linear feels like a place where the bar for craft is genuinely held — uh, the editor team in particular…", suggest: "This answer ran long and lost the through-line. Lead with one specific Linear surface that maps to your strength, then bridge.", warn: true },
            ].map((it, i) => {
              const range = it.score >= 80 ? "high" : it.score >= 65 ? "mid" : "low";
              return (
                <div key={i} className="card" style={{ padding: 22, display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, borderColor: it.warn ? "var(--warning)" : "var(--hairline)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", paddingRight: 24, borderRight: "1px solid var(--hairline)", minWidth: 90 }}>
                    <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)", letterSpacing: "0.12em" }}>Q{i+1}</span>
                    <span className="serif tnum" style={{ fontSize: 40, letterSpacing: "-0.03em", color: range === "high" ? "var(--positive)" : range === "mid" ? "var(--warning)" : "var(--negative)" }}>{it.score}</span>
                    <span className="mono tnum" style={{ fontSize: 10.5, color: "var(--ink-4)" }}>{it.time}</span>
                  </div>
                  <div>
                    <div className="serif" style={{ fontSize: 20, letterSpacing: "-0.018em", lineHeight: 1.25, color: "var(--ink)" }}>"{it.q}"</div>
                    <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 12, lineHeight: 1.55, padding: "10px 14px", background: "var(--bg-sunk)", borderRadius: 8, fontStyle: "italic" }}>
                      {it.ans}
                      <span style={{ color: "var(--ink-4)", fontStyle: "normal", marginLeft: 6, fontFamily: "var(--font-mono)", fontSize: 11 }}>· transcript →</span>
                    </div>
                    {it.suggest && (
                      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, marginTop: 12, padding: "12px 14px", background: "var(--accent-soft)", borderRadius: 8 }}>
                        <span className="mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.14em", textTransform: "uppercase" }}>A better answer would have…</span>
                        <span/>
                        <span/>
                        <span style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>{it.suggest}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filler + pace */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Eyebrow>Filler words</Eyebrow>
              <span className="serif tnum" style={{ fontSize: 28, letterSpacing: "-0.025em" }}>14<span style={{ color: "var(--ink-4)", fontSize: 14 }}> total</span></span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              {[["um", 6, 0.42],["uh", 4, 0.28],["like", 2, 0.14],["you know", 2, 0.14]].map(([w, n, p], i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 12, alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>"{w}"</span>
                  <div className="slider-track"><div className="slider-fill" style={{ width: `${p * 100}%`, background: "var(--negative)" }}/></div>
                  <span className="mono tnum" style={{ fontSize: 11, color: "var(--ink-3)" }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Eyebrow>Words per minute · over time</Eyebrow>
              <span className="serif tnum" style={{ fontSize: 28, letterSpacing: "-0.025em" }}>164<span style={{ color: "var(--ink-4)", fontSize: 14 }}> wpm avg</span></span>
            </div>
            <div style={{ marginTop: 16 }}>
              <Sparkline values={[148,162,168,172,176,168,158,162,170,172,174,178,176,182,178,168,158,150,148,142,138]} width={420} height={72} accent="var(--ink)"/>
              <div className="eyebrow" style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span>Q1</span><span>Q2</span><span>Q3</span><span style={{ color: "var(--warning)" }}>Q4 · slowed</span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 14, padding: "10px 12px", background: "var(--bg-sunk)", borderRadius: 6 }}>
              Sweet spot for interviews: <b>140–170 wpm</b>. You drifted under 140 in Q4 — usually a sign of searching for structure.
            </div>
          </div>
        </div>

        {/* Improvement plan */}
        <div>
          <SectionMark num="05" title="Personalized improvement plan"
            right={<span className="eyebrow">Tuned to your run · ~45 min total</span>}/>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {[
              { p: "01", t: "Anchor every answer in STAR.", desc: "Two answers skipped Situation/Task. Drill: pick 5 random behavioral prompts and write 60-second outlines.", time: "15 min", drill: "5 prompts" },
              { p: "02", t: "Tighten 'Why Linear' to 30 seconds.", desc: "Lead with one specific surface. Use the editor team's typography focus as your bridge.", time: "10 min", drill: "Re-run Q4" },
              { p: "03", t: "Trim filler words.", desc: "14 in 1:58 reads as nervous. Try a 3-second pause before answering — sounds composed, not slow.", time: "20 min", drill: "Pace prompt" },
            ].map((p, i) => (
              <div key={i} className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.12em" }}>FOCUS · {p.p}</span>
                <div className="serif" style={{ fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{p.t}</div>
                <p style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.55, margin: 0 }}>{p.desc}</p>
                <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid var(--hairline)" }}>
                  <span className="eyebrow">{p.time} · {p.drill}</span>
                  <span style={{ color: "var(--ink)", fontSize: 12 }}>Begin →</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* footer actions */}
        <div className="card" style={{ padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--ink)", color: "var(--bg)", borderColor: "var(--ink)" }}>
          <div>
            <span className="eyebrow" style={{ color: "#a8a397" }}>What's next</span>
            <div className="serif" style={{ fontSize: 24, marginTop: 4, letterSpacing: "-0.02em" }}>Apply learnings to your résumé, or run it back.</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary"><Icon.Mic/> Retake interview</button>
            <button className="btn btn-accent btn-lg"><Icon.Sparkle/> Apply to résumé</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

Object.assign(window, { ScreenInterviewLobby, ScreenInterviewLive, ScreenPerformance });
