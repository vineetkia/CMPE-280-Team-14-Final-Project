import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

interface CookieToSet {
  name: string;
  value: string;
  options?: CookieOptions;
}

/**
 * Server-side Supabase URL. In Docker, the web container can't reach
 * NEXT_PUBLIC_SUPABASE_URL (which points at the host's `localhost:KONG_PORT`),
 * so we prefer SUPABASE_URL_INTERNAL — the in-network hostname like
 * `http://kong:8000`. Browser code keeps using NEXT_PUBLIC_SUPABASE_URL.
 */
function serverSupabaseUrl(): string {
  return (
    process.env.SUPABASE_URL_INTERNAL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  );
}

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    serverSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* called from a Server Component — ignore */
          }
        },
      },
    },
  );
}

export function createServiceRoleClient() {
  // For server-side operations that need to bypass RLS (seed, agent writes).
  const { createClient: create } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
  return create(
    serverSupabaseUrl(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
