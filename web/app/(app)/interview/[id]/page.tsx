import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/lib/types";
import { InterviewExperience } from "./_components/interview-experience";

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // The id route param is a job id. Look it up and prepare context.
  const { data: job } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
  if (!job) notFound();

  return <InterviewExperience job={job as Job} />;
}
