import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
const url = env.PUBLIC_SUPABASE_URL?.trim();
const anonKey = env.PUBLIC_SUPABASE_ANON_KEY?.trim();

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

function isPublishableKey(key: string): boolean {
  return key.startsWith("sb_publishable_");
}

/**
 * Publishable keys (`sb_publishable_…`) must go on the `apikey` header only.
 * Sending them as `Authorization: Bearer …` makes PostgREST reject writes with Invalid JWT,
 * so shares look fine on one device (demo/local) or fail silently — never land in the shared DB.
 */
function clientFetch(key: string): typeof fetch | undefined {
  if (!isPublishableKey(key)) return undefined;
  return (input, init = {}) => {
    const headers = new Headers(init.headers);
    headers.set("apikey", key);
    const auth = headers.get("Authorization");
    if (auth && /Bearer\s+sb_/i.test(auth)) {
      headers.delete("Authorization");
    }
    return fetch(input, { ...init, headers });
  };
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: clientFetch(anonKey!) ?? fetch,
      },
    });
  }
  return client;
}

/** Lightweight check used by the Prayer UI to confirm the shared wall is reachable. */
export async function probePrayerWall(): Promise<{ ok: boolean; detail?: string }> {
  const sb = getSupabase();
  if (!sb) {
    return {
      ok: false,
      detail: "Supabase is not configured. Requests stay on this device only.",
    };
  }
  const { error } = await sb.from("prayer_requests").select("id").limit(1);
  if (error) {
    return {
      ok: false,
      detail: error.message || "Could not reach the prayer wall database.",
    };
  }
  return { ok: true };
}
