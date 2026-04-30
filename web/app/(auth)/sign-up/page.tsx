import Link from "next/link";
import { Brand } from "@/components/ui/brand";
import { Eyebrow } from "@/components/ui/eyebrow";
import { SignUpForm } from "./form";

export default function SignUpPage() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", minHeight: "100vh" }}>
      <div
        style={{
          padding: "56px 64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRight: "1px solid var(--hairline)",
        }}
      >
        <Brand size="lg" />
        <div>
          <Eyebrow>A premium career platform</Eyebrow>
          <h1
            className="serif"
            style={{
              fontSize: 76,
              lineHeight: 0.96,
              letterSpacing: "-0.035em",
              margin: "20px 0 24px",
              fontWeight: 400,
              textWrap: "balance",
            }}
          >
            A quiet workspace,
            <br />
            <em style={{ fontStyle: "italic", color: "var(--accent)" }}>built for signal.</em>
          </h1>
          <p style={{ fontSize: 16, color: "var(--ink-3)", maxWidth: "44ch", margin: 0 }}>
            Optimize a résumé, track every application, rehearse with AI. Fourteen days, no card.
          </p>
        </div>
        <div />
      </div>

      <div
        style={{
          padding: "56px 64px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
          justifyContent: "center",
          maxWidth: 520,
          width: "100%",
        }}
      >
        <div>
          <Eyebrow>№ 01 · Create account</Eyebrow>
          <h2 className="serif" style={{ fontSize: 36, letterSpacing: "-0.025em", margin: "8px 0 8px" }}>
            Begin a draft.
          </h2>
          <p style={{ color: "var(--ink-3)", margin: 0, fontSize: 14 }}>
            Two minutes to set up. You can sketch a résumé before you upload anything.
          </p>
        </div>

        <SignUpForm />

        <p style={{ fontSize: 12.5, color: "var(--ink-4)", margin: 0, textAlign: "center" }}>
          Already have an account?{" "}
          <Link
            href="/sign-in"
            style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: 2 }}
          >
            Sign in
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
