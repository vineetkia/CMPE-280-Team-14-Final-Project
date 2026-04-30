import Link from "next/link";
import { QuoteRule } from "@/components/ui/quote-rule";
import { Brand } from "@/components/ui/brand";
import { Eyebrow } from "@/components/ui/eyebrow";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        padding: 40,
      }}
    >
      <Brand size="lg" />
      <Eyebrow>404 · Not found</Eyebrow>
      <QuoteRule attribution="Try again from home.">
        The page you opened is missing — or never existed.
      </QuoteRule>
      <Link href="/dashboard" className="btn btn-primary">
        Return home
      </Link>
    </div>
  );
}
