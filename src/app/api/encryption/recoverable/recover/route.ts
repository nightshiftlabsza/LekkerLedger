import { NextResponse } from "next/server";
import { exportAccountMasterKey, type WrappedKeyPayload, unwrapMasterKeyWithServerSecret } from "@/lib/crypto";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

function isWrappedKeyPayload(value: unknown): value is WrappedKeyPayload {
    return Boolean(
        value
        && typeof value === "object"
        && "ciphertext" in value
        && "iv" in value
        && "salt" in value
        && "kdf" in value,
    );
}

export async function POST(request: Request) {
    try {
        if (!env.RECOVERABLE_WRAP_SECRET) {
            return NextResponse.json({ error: "Recoverable encryption is not configured on this server yet." }, { status: 503 });
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "You need to sign in again before account recovery can continue." }, { status: 401 });
        }

        const body = await request.json().catch(() => ({})) as { reason?: "password_reset" | "manual_recovery" };
        const reason = body.reason === "manual_recovery" ? "manual_recovery" : "password_reset";

        const { data: profileRow, error: profileError } = await supabase
            .from("user_profiles")
            .select("encryption_mode")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) {
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        if (profileRow?.encryption_mode !== "recoverable") {
            return NextResponse.json({ error: "This account is not using recoverable encryption." }, { status: 400 });
        }

        const { data: recoveryRow, error: recoveryError } = await supabase
            .from("account_key_recovery")
            .select("wrapped_master_key_server")
            .eq("user_id", user.id)
            .maybeSingle();

        if (recoveryError) {
            return NextResponse.json({ error: recoveryError.message }, { status: 500 });
        }

        if (!isWrappedKeyPayload(recoveryRow?.wrapped_master_key_server)) {
            return NextResponse.json({ error: "Recovery data is missing for this account." }, { status: 404 });
        }

        const masterKey = await unwrapMasterKeyWithServerSecret(
            recoveryRow.wrapped_master_key_server,
            env.RECOVERABLE_WRAP_SECRET,
            user.id,
        );
        const rawMasterKey = await exportAccountMasterKey(masterKey);
        const now = new Date().toISOString();

        const { error: updateRecoveryError } = await supabase
            .from("account_key_recovery")
            .update({
                last_recovered_at: now,
                last_recovery_reason: reason,
                updated_at: now,
            })
            .eq("user_id", user.id);

        if (updateRecoveryError) {
            return NextResponse.json({ error: updateRecoveryError.message }, { status: 500 });
        }

        const { error: updateProfileError } = await supabase
            .from("user_profiles")
            .update({
                recent_recovery_notice_at: now,
                recent_recovery_event_kind: reason,
                updated_at: now,
            })
            .eq("id", user.id);

        if (updateProfileError) {
            return NextResponse.json({ error: updateProfileError.message }, { status: 500 });
        }

        return NextResponse.json({ rawMasterKey }, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Recoverable recovery failed.", error);
        return NextResponse.json({ error: "Account recovery could not be completed." }, { status: 500 });
    }
}
