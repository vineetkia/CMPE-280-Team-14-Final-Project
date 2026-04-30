export function Sparkline({
  values,
  width = 200,
  height = 40,
  accent = "var(--ink)",
}: {
  values: number[];
  width?: number;
  height?: number;
  accent?: string;
}) {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const norm = (v: number) => height - ((v - min) / Math.max(1, max - min)) * (height - 8) - 4;
  const step = width / (values.length - 1);
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${norm(v)}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <path d={d} stroke={accent} strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={(values.length - 1) * step}
        cy={norm(values[values.length - 1]!)}
        r="2.5"
        fill={accent}
      />
    </svg>
  );
}
