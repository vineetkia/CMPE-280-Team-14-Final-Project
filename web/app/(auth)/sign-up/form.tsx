"use client";

import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { signUpAction } from "@/app/_actions/auth";

export function SignUpForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const res = await signUpAction(fd);
          if (res?.error) setError(res.error);
        });
      }}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <div className="field">
        <label className="label" htmlFor="full_name">Full name</label>
        <input id="full_name" className="input" name="full_name" type="text" autoComplete="name" />
      </div>
      <div className="field">
        <label className="label" htmlFor="email">Email</label>
        <input id="email" className="input" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="field">
        <label className="label" htmlFor="password">Password</label>
        <input id="password" className="input" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>

      {error && (
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 13,
            color: "var(--negative)",
          }}
        >
          {error}
        </div>
      )}

      <button type="submit" className="btn btn-primary btn-lg" style={{ justifyContent: "center" }} disabled={pending}>
        {pending ? "Creating…" : "Create account"} <ArrowRight className="ic" />
      </button>
    </form>
  );
}
