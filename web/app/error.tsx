"use client";

import { useEffect } from "react";
import { QuoteRule } from "@/components/ui/quote-rule";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 40,
      }}
    >
      <QuoteRule attribution="Refresh, or try again in a moment.">Something went sideways on our end.</QuoteRule>
      <button onClick={reset} className="btn btn-primary">Try again</button>
    </div>
  );
}
