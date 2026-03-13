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
    if (typeof window === "undefined" || !storageKey) return;

    const jsonKeys = [storageKey, `${storageKey}-user`];
    for (const key of jsonKeys) {
        try {
            const rawValue = window.localStorage.getItem(key);
            if (!rawValue) continue;
            JSON.parse(rawValue);
        } catch {
            try {
                window.localStorage.removeItem(key);
            } catch {
                // Ignore storage cleanup failures. The safe adapter below is still best-effort.
            }
        }
    }
}

function createSafeStorage() {
    return {
        getItem(key: string) {
            try {
                return window.localStorage.getItem(key);
            } catch {
                return null;
            }
        },
        setItem(key: string, value: string) {
            try {
                window.localStorage.setItem(key, value);
            } catch {
                // Ignore quota or access failures so auth reads do not hard-crash the app.
            }
        },
        removeItem(key: string) {
            try {
                window.localStorage.removeItem(key);
            } catch {
                // Ignore storage access failures so cleanup remains best-effort.
            }
        },
    };
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

    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            storage: typeof window === "undefined" ? undefined : createSafeStorage(),
        },
    });

    return browserClient;
}
