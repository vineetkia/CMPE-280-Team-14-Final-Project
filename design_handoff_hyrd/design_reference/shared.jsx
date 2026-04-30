/* shared.jsx — small reusable UI atoms used across screens */

const Brand = ({ size = "md" }) => {
  const fs = size === "lg" ? 28 : size === "sm" ? 16 : 22;
  return (
    <span className="brand" style={{ fontSize: fs }}>
      Hyrd
    </span>
  );
};

const Eyebrow = ({ children, style }) => (
  <span className="eyebrow" style={style}>{children}</span>
);

const SectionMark = ({ num, title, right }) => (
  <div className="section-mark" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
      <span className="num">№ {num}</span>
      <span className="ttl">{title}</span>
    </div>
    {right}
  </div>
);

const Chip = ({ children, kind = "default", style }) => (
  <span className={`chip ${kind !== "default" ? `chip-${kind}` : ""}`} style={style}>{children}</span>
);

const ScoreChip = ({ value, max = 100 }) => {
  const range = value >= 80 ? "high" : value >= 60 ? "mid" : "low";
  return (
    <span className="score-chip" data-range={range}>
      <span className="num tnum">{value}</span>
      <span className="max">/ {max}</span>
    </span>
  );
};

/* Logo square — initials over hairline */
const LogoSq = ({ name, color, size = 32 }) => {
  const initials = name.split(" ").map(s => s[0]).slice(0, 2).join("");
  return (
    <span className="logo-sq" style={{
      width: size, height: size,
      background: color || "var(--bg-sunk)",
      color: color ? "#fbf8f1" : "var(--ink-2)",
      fontSize: size * 0.42,
    }}>{initials}</span>
  );
};

/* App shell with sidebar */
const AppShell = ({ active, children, topnavRight, crumbs }) => {
  const items = [
    { id: "home", label: "Home", icon: Icon.Home },
    { id: "optimizer", label: "Resume Optimizer", icon: Icon.Doc, badge: "3" },
    { id: "tracker", label: "Job Tracker", icon: Icon.Kanban, badge: "14" },
    { id: "interview", label: "AI Interview", icon: Icon.Mic },
    { id: "performance", label: "Performance", icon: Icon.Chart },
  ];
  const lower = [
    { id: "settings", label: "Settings", icon: Icon.Cog },
  ];
  return (
    <div className="app-shell" style={{ minHeight: "100%", background: "var(--bg)" }}>
      <aside className="side">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"4px 6px 12px" }}>
          <Brand size="md" />
          <button className="btn btn-icon btn-ghost" aria-label="Search"><Icon.Search /></button>
        </div>

        <div className="side-section">
          <div className="eyebrow" style={{ padding: "0 10px 8px" }}>Workspace</div>
          {items.map(it => (
            <a key={it.id} className="side-link" aria-current={active === it.id ? "page" : undefined}>
              <it.icon />
              <span>{it.label}</span>
              {it.badge && <span className="badge tnum">{it.badge}</span>}
            </a>
          ))}
        </div>

        <div className="side-section">
          <div className="eyebrow" style={{ padding: "0 10px 8px" }}>Up next</div>
          <div className="card" style={{ padding: 14, marginTop: 4 }}>
            <div className="eyebrow" style={{ color: "var(--accent)" }}>Thu · 2:00 PM</div>
            <div className="serif" style={{ fontSize: 18, marginTop: 4, lineHeight: 1.15 }}>Senior Product Designer</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>Linear · Mock interview</div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <button className="btn btn-sm btn-accent" style={{ flex: 1 }}>Start mock</button>
            </div>
          </div>
        </div>

        <div className="side-section" style={{ marginTop: "auto" }}>
          {lower.map(it => (
            <a key={it.id} className="side-link" aria-current={active === it.id ? "page" : undefined}>
              <it.icon />
              <span>{it.label}</span>
            </a>
          ))}
          <div style={{ display:"flex", alignItems:"center", gap: 10, padding: "10px 10px", marginTop: 4, borderTop: "1px solid var(--hairline)" }}>
            <span className="logo-sq" style={{ width: 28, height: 28, background: "var(--ink)", color: "var(--bg)", fontSize: 11, fontFamily: "var(--font-display)" }}>MR</span>
            <div style={{ display:"flex", flexDirection:"column" }}>
              <span style={{ fontSize: 12.5, color:"var(--ink)" }}>Maya Rivera</span>
              <span style={{ fontSize: 11, color:"var(--ink-4)" }}>Pro · trial 12d left</span>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div className="topnav">
          <div className="crumbs">
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="sep">/</span>}
                <span className={i === crumbs.length - 1 ? "now" : ""}>{c}</span>
              </React.Fragment>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems:"center" }}>
            {topnavRight}
            <button className="btn btn-icon btn-ghost" aria-label="Notifications"><Icon.Bell /></button>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
      </main>
    </div>
  );
};

/* Simple radial gauge */
const RadialGauge = ({ value = 82, size = 220, label = "Overall" }) => {
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const dash = c * (value / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--hairline-3)" strokeWidth="2"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={value >= 80 ? "var(--positive)" : value >= 60 ? "var(--warning)" : "var(--negative)"}
        strokeWidth="3" strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="48%" textAnchor="middle"
        fontFamily="var(--font-display)" fontSize={size*0.34} fill="var(--ink)" letterSpacing="-0.04em">
        {value}
      </text>
      <text x="50%" y="68%" textAnchor="middle"
        fontFamily="var(--font-mono)" fontSize="11" fill="var(--ink-4)" letterSpacing="0.16em">
        {label.toUpperCase()}
      </text>
    </svg>
  );
};

/* Radar chart (6 axes) */
const Radar = ({ axes = [], size = 260, value = [], compare = [] }) => {
  const cx = size/2, cy = size/2, r = size/2 - 30;
  const n = axes.length;
  const pt = (i, v) => {
    const a = (Math.PI * 2 * i) / n - Math.PI/2;
    const rr = r * v;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  };
  const polygon = (vals) => vals.map((v,i) => pt(i, v).join(",")).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map((g,i) => (
        <polygon key={i} points={polygon(Array(n).fill(g))} fill="none" stroke="var(--hairline-3)" strokeWidth="1"/>
      ))}
      {axes.map((_, i) => {
        const [x,y] = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--hairline-2)" strokeWidth="1" />;
      })}
      {compare.length > 0 && (
        <polygon points={polygon(compare)} fill="var(--ink)" fillOpacity="0.04" stroke="var(--ink-4)" strokeDasharray="3 3" strokeWidth="1"/>
      )}
      <polygon points={polygon(value)} fill="var(--accent)" fillOpacity="0.14" stroke="var(--accent)" strokeWidth="1.5"/>
      {axes.map((label, i) => {
        const [x,y] = pt(i, 1.18);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-3)" letterSpacing="0.1em">
            {label.toUpperCase()}
          </text>
        );
      })}
      {value.map((v,i) => {
        const [x,y] = pt(i,v);
        return <circle key={i} cx={x} cy={y} r="3" fill="var(--accent)"/>;
      })}
    </svg>
  );
};

/* Sparkline */
const Sparkline = ({ values = [], width = 200, height = 40, accent = "var(--ink)" }) => {
  if (!values.length) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const norm = (v) => height - ((v - min) / Math.max(1, max - min)) * (height - 8) - 4;
  const step = width / (values.length - 1);
  const d = values.map((v,i) => `${i === 0 ? "M" : "L"} ${i * step} ${norm(v)}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <path d={d} stroke={accent} strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={(values.length-1) * step} cy={norm(values[values.length-1])} r="2.5" fill={accent}/>
    </svg>
  );
};

Object.assign(window, { Brand, Eyebrow, SectionMark, Chip, ScoreChip, LogoSq, AppShell, RadialGauge, Radar, Sparkline });
