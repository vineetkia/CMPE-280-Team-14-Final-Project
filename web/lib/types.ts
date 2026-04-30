export type JobStatus = "saved" | "applied" | "interview" | "offer" | "rejected";

export interface Job {
  id: string;
  user_id: string;
  company: string;
  role: string;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  jd_text: string | null;
  source_url: string | null;
  status: JobStatus;
  position: number;
  notes: string | null;
  brand_color: string | null;
  interview_at: string | null;
  offer_amount: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParsedResume {
  contact: { name: string; email?: string; phone?: string; location?: string; links?: string[] };
  summary: string;
  experience: Array<{
    company: string;
    role: string;
    start: string;
    end: string;
    bullets: string[];
  }>;
  education: Array<{ school: string; degree: string; year: string }>;
  skills: string[];
  projects: Array<{ name: string; description: string; link?: string }>;
}

export interface OptimizedResume extends ParsedResume {
  bolded_phrases: string[];
  metrics_added: string[];
  keywords_used: string[];
  ats_score: number;
  keyword_coverage: number;
  change_annotations: Array<{
    section: string;
    before: string;
    after: string;
    reason: string;
    kind: "change" | "add";
  }>;
}

export interface InterviewQuestionScore {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  better_answer: string | null;
  time_seconds: number;
}

export interface InterviewDimensions {
  clarity: number;
  confidence: number;
  relevance: number;
  structure: number;
  technical_depth: number;
  pace: number;
}

export interface InterviewImprovement {
  focus_area: string;
  why: string;
  drills: Array<{ name: string; description: string; est_minutes: number }>;
  priority: number;
}

export interface InterviewResult {
  interview_id: string;
  overall_score: number;
  dimensions: InterviewDimensions;
  question_scores: InterviewQuestionScore[];
  filler_count: number;
  wpm: number;
  improvement_plan: InterviewImprovement[];
  transcript: Array<{ role: "interviewer" | "candidate"; text: string; t: number }>;
}
