import { z } from "zod";

export const ParsedResumeSchema = z.object({
  contact: z.object({
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    links: z.array(z.string()).optional(),
  }),
  summary: z.string(),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      start: z.string(),
      end: z.string(),
      bullets: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({ school: z.string(), degree: z.string(), year: z.string() }),
  ),
  skills: z.array(z.string()),
  projects: z
    .array(z.object({ name: z.string(), description: z.string(), link: z.string().optional() }))
    .default([]),
});

export const OptimizedResumeSchema = ParsedResumeSchema.extend({
  bolded_phrases: z.array(z.string()).default([]),
  metrics_added: z.array(z.string()).default([]),
  keywords_used: z.array(z.string()).default([]),
  ats_score: z.number().int().min(0).max(100),
  keyword_coverage: z.number().int().min(0).max(100),
  change_annotations: z
    .array(
      z.object({
        section: z.string(),
        before: z.string(),
        after: z.string(),
        reason: z.string(),
        kind: z.enum(["change", "add"]),
      }),
    )
    .default([]),
});

export type ParsedResume = z.infer<typeof ParsedResumeSchema>;
export type OptimizedResume = z.infer<typeof OptimizedResumeSchema>;
