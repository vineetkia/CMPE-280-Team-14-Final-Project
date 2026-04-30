import type { ReactNode } from "react";

export function QuoteRule({ children, attribution }: { children: ReactNode; attribution?: string }) {
  return (
    <div>
      <div className="quote-rule">{children}</div>
      {attribution && (
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--ink-4)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            paddingLeft: 21,
            marginTop: 12,
          }}
        >
          {attribution}
        </div>
      )}
    </div>
  );
}
