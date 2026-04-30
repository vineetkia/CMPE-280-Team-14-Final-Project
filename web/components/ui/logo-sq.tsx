import { initials } from "@/lib/utils";

export function LogoSq({
  name,
  color,
  size = 32,
}: {
  name: string;
  color?: string | null;
  size?: number;
}) {
  return (
    <span
      className="logo-sq"
      style={{
        width: size,
        height: size,
        background: color ?? "var(--bg-sunk)",
        color: color ? "#fbf8f1" : "var(--ink-2)",
        fontSize: Math.round(size * 0.42),
      }}
    >
      {initials(name)}
    </span>
  );
}
