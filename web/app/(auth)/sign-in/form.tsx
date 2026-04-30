"use client";

import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { signInAction } from "@/app/_actions/auth";
import { Eyebrow } from "@/components/ui/eyebrow";
import { MotionButton } from "@/components/ui/motion-button";
import { motion, AnimatePresence, tween, DUR, EASE_OUT } from "@/components/motion";

export function SignInForm({ next }: { next?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <button type="button" className="btn btn-secondary btn-lg" style={{ justifyContent: "center", width: "100%" }} disabled>
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22 12.2c0-.7-.1-1.5-.2-2.2H12v4.2h5.6a4.8 4.8 0 0 1-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.7z" />
            <path fill="#34A853" d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7V16A10 10 0 0 0 12 22z" />
            <path fill="#FBBC05" d="M6.2 13.6a6 6 0 0 1 0-3.8V7.2H2.7a10 10 0 0 0 0 9z" />
            <path fill="#EA4335" d="M12 5.9c1.5 0 2.9.5 4 1.5l3-3A10 10 0 0 0 12 2 10 10 0 0 0 2.7 7.2l3.5 2.6c.8-2.5 3.1-3.9 5.8-3.9z" />
          </svg>
          Continue with Google
        </button>
        <button type="button" className="btn btn-secondary btn-lg" style={{ justifyContent: "center", width: "100%" }} disabled>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.4 1.7c0 1.3-.5 2.6-1.4 3.5-.9 1-2.4 1.7-3.6 1.6-.1-1.3.5-2.6 1.4-3.5.9-1 2.4-1.7 3.6-1.6zM20 17.5c-.5 1.2-.8 1.8-1.5 2.9-1 1.5-2.4 3.4-4.1 3.4s-2.2-1.1-4.5-1.1-2.9 1.1-4.5 1.1-3-1.7-4-3.2C-1 17.6-.5 11.4 3 9c1.3-.9 2.7-1.4 4-1.4 1.7 0 2.9 1 4.4 1s2.5-1 4.6-1c1.2 0 2.6.4 3.6 1.2-3.1 1.7-2.6 6.2.4 7.7z" />
          </svg>
          Continue with Apple
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div className="rule" style={{ flex: 1 }} />
        <Eyebrow>or</Eyebrow>
        <div className="rule" style={{ flex: 1 }} />
      </div>

      <form
        action={(fd) => {
          setError(null);
          startTransition(async () => {
            const res = await signInAction(fd);
            if (res?.error) setError(res.error);
          });
        }}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <input type="hidden" name="next" value={next ?? "/dashboard"} />
        <div className="field">
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" name="email" type="email" required defaultValue="demo@sjsu.edu" autoComplete="email" />
        </div>
        <div className="field">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <label className="label" htmlFor="password">Password</label>
            <span style={{ fontSize: 11.5, color: "var(--ink-4)", textDecoration: "underline", textUnderlineOffset: 2 }}>Forgot?</span>
          </div>
          <input id="password" className="input" name="password" type="password" required defaultValue="demo1234" autoComplete="current-password" />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={tween(DUR.slow, EASE_OUT)}
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: 13,
                color: "var(--negative)",
                overflow: "hidden",
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <MotionButton
          type="submit"
          variant="primary"
          size="lg"
          style={{ justifyContent: "center" }}
          disabled={pending}
        >
          {pending ? "Signing in…" : "Sign in"} <ArrowRight className="ic" />
        </MotionButton>
      </form>
    </>
  );
}
