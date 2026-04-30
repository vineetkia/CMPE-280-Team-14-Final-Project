import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Latest Claude model IDs available at build time.
// Opus 4.7 — highest capability for resume optimization & feedback synthesis.
// Haiku 4.5 — low-latency model for inline parsing and the live interview.
export const CLAUDE_OPUS = "claude-opus-4-7";
export const CLAUDE_HAIKU = "claude-haiku-4-5-20251001";
