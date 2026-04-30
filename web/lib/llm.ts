// Provider-agnostic JSON LLM helper.
//
// Routes a (system, user) prompt to either Anthropic Claude or Azure AI
// Foundry (Azure OpenAI v1) based on LLM_PROVIDER env. The shape of the
// returned text is provider-agnostic; callers feed it into zod schemas.
//
// Two model tiers per provider:
//   - "heavy"  -> Opus 4.7  (Anthropic) | OPENAI_CHAT_MODEL   (Azure)
//   - "light"  -> Haiku 4.5 (Anthropic) | OPENAI_SURVEY_MODEL (Azure)
import { z } from "zod";
import { anthropic, CLAUDE_HAIKU, CLAUDE_OPUS } from "@/lib/anthropic";
import { azureOpenAI, AZURE_CHAT_MODEL, AZURE_SURVEY_MODEL } from "@/lib/azure-openai";
import { extractJSON } from "@/lib/json";

export type Tier = "heavy" | "light";

export type LLMProvider = "anthropic" | "azure";

export function getProvider(): LLMProvider {
  const v = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();
  return v === "azure" ? "azure" : "anthropic";
}

export interface LLMPrompt {
  system: string;
  user: string;
  maxTokens?: number;
}

async function runAnthropic(prompt: LLMPrompt, tier: Tier): Promise<string> {
  const msg = await anthropic.messages.create({
    model: tier === "heavy" ? CLAUDE_OPUS : CLAUDE_HAIKU,
    max_tokens: prompt.maxTokens ?? 4096,
    system: prompt.system,
    messages: [{ role: "user", content: prompt.user }],
  });
  return msg.content.map((c) => (c.type === "text" ? c.text : "")).join("");
}

async function runAzure(prompt: LLMPrompt, tier: Tier): Promise<string> {
  const client = azureOpenAI();
  // GPT-5 / o-series models on Azure require `max_completion_tokens` (not `max_tokens`).
  // The OpenAI SDK accepts both; we send the new field so we work on every model.
  const completion = await client.chat.completions.create({
    model: tier === "heavy" ? AZURE_CHAT_MODEL : AZURE_SURVEY_MODEL,
    max_completion_tokens: prompt.maxTokens ?? 4096,
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    response_format: { type: "json_object" },
  });
  return completion.choices[0]?.message?.content ?? "";
}

/**
 * Run a JSON-shaped LLM call against the configured provider, validate with
 * the supplied zod schema, and return the parsed object. On schema-parse
 * failure, retry once with a corrective system suffix.
 */
export async function runJsonLLM<T>(
  prompt: LLMPrompt,
  schema: z.ZodSchema<T>,
  tier: Tier,
): Promise<T> {
  const provider = getProvider();
  const run = provider === "azure" ? runAzure : runAnthropic;

  const attempt = async (correction?: string): Promise<T> => {
    const finalPrompt: LLMPrompt = {
      ...prompt,
      system: correction ? `${prompt.system}\n\n${correction}` : prompt.system,
    };
    const text = await run(finalPrompt, tier);
    const parsed = extractJSON(text);
    return schema.parse(parsed);
  };

  try {
    return await attempt();
  } catch {
    return await attempt(
      "Your previous attempt produced invalid JSON. Respond with ONLY the JSON object, exactly matching the schema. No prose, no markdown.",
    );
  }
}
