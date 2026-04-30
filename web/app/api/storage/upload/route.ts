// Local Storage shim — persists résumé uploads as bytea rows in public.storage_objects.
// Mirrors a subset of the Supabase Storage interface so swapping back to Supabase Cloud
// is a one-line change (use supabase.storage.from('resumes').upload).
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());

  const { data, error } = await supabase
    .from("storage_objects")
    .insert({
      user_id: user.id,
      bucket: "resumes",
      name: file.name,
      mime: file.type || "application/octet-stream",
      size_bytes: file.size,
      data: `\\x${buf.toString("hex")}`,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, name: file.name, size: file.size });
}
