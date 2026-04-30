import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Brand } from "@/components/ui/brand";
import { Eyebrow } from "@/components/ui/eyebrow";
import { SignInForm } from "./form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Editorial pane */}
      <div
        style={{
          padding: "56px 64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRight: "1px solid var(--hairline)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Brand size="lg" />
          <Eyebrow>Vol. 01 · The Career Desk</Eyebrow>
        </div>
        <div>
          <Eyebrow>A premium career platform</Eyebrow>
          <h1
            className="serif"
            style={{
              fontSize: 84,
              lineHeight: 0.95,
              letterSpacing: "-0.035em",
              margin: "20px 0 24px",
              fontWeight: 400,
              textWrap: "balance",
            }}
          >
            Job hunting,
            <br />
            <em style={{ fontStyle: "italic", color: "var(--accent)" }}>composed.</em>
          </h1>
          <p style={{ fontSize: 17, color: "var(--ink-3)", maxWidth: "44ch", lineHeight: 1.55, margin: 0 }}>
            A quiet workspace for serious candidates. Optimize a résumé, track every application, rehearse with AI, and arrive prepared. No streaks, no badges — just signal.
          </p>
        </div>
        <div style={{ display: "flex", gap: 40, alignItems: "baseline" }}>
          <div>
            <div className="serif" style={{ fontSize: 44, letterSpacing: "-0.03em" }}>14k</div>
            <Eyebrow style={{ marginTop: 2 }}>offers in the last 12mo</Eyebrow>
          </div>
          <div style={{ width: 1, alignSelf: "stretch", background: "var(--hairline)" }} />
          <div>
            <div className="serif" style={{ fontSize: 44, letterSpacing: "-0.03em" }}>
              +38<span style={{ fontSize: 22 }}>%</span>
            </div>
            <Eyebrow style={{ marginTop: 2 }}>median ATS score lift</Eyebrow>
          </div>
          <div style={{ width: 1, alignSelf: "stretch", background: "var(--hairline)" }} />
          <div>
            <div className="serif" style={{ fontSize: 44, letterSpacing: "-0.03em" }}>4.9</div>
            <Eyebrow style={{ marginTop: 2 }}>across 2,800 reviews</Eyebrow>
          </div>
        </div>
      </div>

      {/* Sign-in pane */}
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
          <Eyebrow>№ 01 · Sign in</Eyebrow>
          <h2 className="serif" style={{ fontSize: 36, letterSpacing: "-0.025em", margin: "8px 0 8px" }}>
            Welcome back.
          </h2>
          <p style={{ color: "var(--ink-3)", margin: 0, fontSize: 14 }}>
            Pick up where you left off — three active interviews, two résumés awaiting review.
          </p>
        </div>

        <SignInForm next={next} />

        <p style={{ fontSize: 12.5, color: "var(--ink-4)", margin: 0, textAlign: "center" }}>
          New here?{" "}
          <Link
            href="/sign-up"
            style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: 2 }}
          >
            Create an account
          </Link>{" "}
          · 14-day trial, no card.
        </p>
      </div>
    </div>
  );
}
