export function parseResumePrompt(rawText: string) {
  return {
    system:
      "You convert raw résumé text into a structured JSON object. Respond ONLY with the JSON object — no prose, no markdown fences. " +
      "The JSON must match this schema: " +
      `{
        "contact": { "name": string, "email": string?, "phone": string?, "location": string?, "links": string[]? },
        "summary": string,
        "experience": [{ "company": string, "role": string, "start": string, "end": string, "bullets": string[] }],
        "education": [{ "school": string, "degree": string, "year": string }],
        "skills": string[],
        "projects": [{ "name": string, "description": string, "link": string? }]
      }. ` +
      "Bullets stay verbatim from the source. If a section is missing, return an empty array. Never invent content.",
    user: rawText.slice(0, 12000),
  };
}

export function optimizeResumePrompt({
  resume,
  jd,
  tone,
  length,
  emphasis,
}: {
  resume: unknown;
  jd: string;
  tone: "concise" | "impactful" | "executive";
  length: "1 page" | "2 pages";
  emphasis: "quantify" | "leadership" | "craft";
}) {
  return {
    system: `You are a senior technical recruiter and résumé strategist. You rewrite résumés to win interviews for a specific job description.

You operate with surgical care:
- Never invent metrics, jobs, or credentials. If a claim isn't in the source, it cannot appear.
- Quantify when raw numbers exist or can be inferred from clear context. Otherwise, sharpen the phrasing.
- Mirror the JD's vocabulary precisely (case-sensitive for product names like "Linear", "Figma", "SwiftUI").
- Cut filler words; raise verb energy.
- Maintain the same factual scope — same companies, same dates, same scope.
- Tone: ${tone}. Length: ${length}. Emphasis: ${emphasis}.

Output STRICTLY this JSON shape — no markdown, no prose, no explanations outside the JSON:

{
  "contact": { "name": string, "email": string?, "phone": string?, "location": string?, "links": string[]? },
  "summary": string,
  "experience": [{ "company": string, "role": string, "start": string, "end": string, "bullets": string[] }],
  "education": [{ "school": string, "degree": string, "year": string }],
  "skills": string[],
  "projects": [{ "name": string, "description": string, "link": string? }],
  "bolded_phrases": string[],          // exact phrases from your output to render bold (metrics, achievements)
  "metrics_added": string[],           // metrics you surfaced or sharpened
  "keywords_used": string[],           // JD keywords you incorporated, verbatim
  "ats_score": number,                 // 0–100, your honest estimate of ATS match
  "keyword_coverage": number,          // 0–100, percentage of priority JD keywords now present
  "change_annotations": [
    {
      "section": "Summary" | "Experience" | "Skills" | "Projects" | "Education",
      "before": string,                // original phrase (truncated if long)
      "after": string,                 // your replacement
      "reason": string,                // 1–2 sentences, recruiter voice
      "kind": "change" | "add"
    }
  ]
}

Annotate every meaningful change. Keep change_annotations between 4 and 12 entries — the most impactful ones.`,
    user: JSON.stringify({ resume, jd: jd.slice(0, 8000) }),
  };
}
