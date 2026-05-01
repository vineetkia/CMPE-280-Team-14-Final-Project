// Generates a one-sentence personalized acknowledgement for the candidate's
// answer to a single interview question. Used between turns in the live call:
// after the candidate finishes speaking, the front-end POSTs the question + the
// transcribed answer here and plays the returned `ack` text via Cartesia before
// queuing the next question.
//
// Tuned to the editorial voice from globals.css: composed, second-person, warm
// with light humor, never an exclamation mark, never gamification. The ack
// must reference something specific the candidate said — generic "thanks for
// that" responses are rejected at the prompt level.
import { NextResponse } from "next/server";
import { z } from "zod";
import { runJsonLLM } from "@/lib/llm";

const Schema = z.object({
  ack: z.string().min(8).max(280),
});

const SYSTEM = `You are a senior interviewer giving a brief one-sentence acknowledgement of a candidate's answer in a mock interview. Voice: composed, warm, lightly humorous in the style of a thoughtful editor — second person, no exclamation marks, no gamification, no corporate cheerleading.

Hard rules:
- Output exactly one sentence, 12 to 28 words.
- Reference one specific concrete detail the candidate actually said. If they mentioned SJSU, name it. If they mentioned Python, name it. Specifics earn trust; generic acknowledgements lose it.
- A touch of dry humor is welcome but optional — never forced.
- Do not ask a follow-up question. Do not give advice. Do not preview the next question. Just acknowledge.
- Do not start with "Thanks" or "Thank you" — those are reserved for the wrap-up.
- Output strict JSON: { "ack": "<your one sentence>" }`;

export async function POST(req: Request) {
  let body: { question?: unknown; answer?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const question = String(body.question ?? "").slice(0, 600);
  const answer = String(body.answer ?? "").slice(0, 2000);
  if (!question || !answer) {
    return NextResponse.json({ error: "Missing question or answer" }, { status: 400 });
  }

  const userPrompt = `INTERVIEW QUESTION:
${question}

CANDIDATE'S ANSWER:
${answer}

Write the one-sentence acknowledgement now. Reference at least one specific thing they said.`;

  try {
    const result = await runJsonLLM(
      { system: SYSTEM, user: userPrompt, maxTokens: 200 },
      Schema,
      "light",
    );
    return NextResponse.json({ ack: result.ack });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "LLM call failed" },
      { status: 502 },
    );
  }
}
