import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

function getSupabaseStorageKey(supabaseUrl: string): string | null {
    try {
        const hostname = new URL(supabaseUrl).hostname;
        const projectRef = hostname.split(".")[0];
        return projectRef ? `sb-${projectRef}-auth-token` : null;
    } catch {
        return null;
    }
}

function healSupabaseSessionStorage(storageKey: string | null) {
    if (typeof globalThis.window === "undefined" || !storageKey) return;

    const jsonKeys = [storageKey, `${storageKey}-user`];
    for (const key of jsonKeys) {
        try {
            const rawValue = globalThis.window.localStorage.getItem(key);
            if (!rawValue) continue;
            JSON.parse(rawValue);
        } catch {
            try {
                globalThis.window.localStorage.removeItem(key);
            } catch {
                // Ignore storage cleanup failures. The safe adapter below is still best-effort.
            }
        }
    }
}

export function createClient() {
    if (browserClient) {
        return browserClient;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase client configuration is missing.");
    }

    const storageKey = getSupabaseStorageKey(supabaseUrl);
    healSupabaseSessionStorage(storageKey);

    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);

    return browserClient;
}
