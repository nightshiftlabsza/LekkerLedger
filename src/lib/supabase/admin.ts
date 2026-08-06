import { createClient } from "@supabase/supabase-js";
import { getRequiredEnvValue } from "../env";

let adminClient: ReturnType<typeof createClient> | null = null;

export function createAdminClient() {
    if (adminClient) {
        return adminClient;
    }

    adminClient = createClient(
        getRequiredEnvValue("NEXT_PUBLIC_SUPABASE_URL"),
        getRequiredEnvValue("SUPABASE_SERVICE_ROLE_KEY")
            .replaceAll(/[^\x20-\x7E]/g, "")
            .replace(/^Bearer\s+/i, "")
            .replace(/^(["'])(.*)\1$/, "$2")
            .trim(),
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        },
    );

    return adminClient;
}
