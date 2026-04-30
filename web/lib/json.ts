// Robust JSON extraction from a model response that may be wrapped in code fences.
export function extractJSON(text: string): unknown {
  const trimmed = text.trim();
  // Try direct parse first.
  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through
  }
  // Strip markdown code fences.
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1]!);
    } catch {
      /* fall through */
    }
  }
  // Last resort: find the outermost { ... }.
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }
  throw new Error("No JSON found in response");
}
