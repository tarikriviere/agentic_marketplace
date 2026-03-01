import { createClient } from "@supabase/supabase-js";

// Lazy client creation — avoids errors during Next.js build when env vars aren't set
let _supabase: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase env vars not set");
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// Named export for convenience (matches original usage)
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return (getSupabaseClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Server-side Supabase client (uses service role key — only use in API routes)
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) {
    // During build: return a stub that will throw at runtime
    return createClient(
      url ?? "https://placeholder.supabase.co",
      serviceKey ?? "placeholder-service-key",
      { auth: { persistSession: false } }
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
