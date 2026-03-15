import { NextResponse } from "next/server";
import { importAccountMasterKey, type EncryptedPayload, type WrappedKeyPayload, wrapMasterKeyWithServerSecret } from "@/lib/crypto";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

function isEncryptedPayload(value: unknown): value is EncryptedPayload {
    return Boolean(
        value
        && typeof value === "object"
        && "ciphertext" in value
        && "iv" in value
        && typeof (value as EncryptedPayload).ciphertext === "string"
        && typeof (value as EncryptedPayload).iv === "string",
    );
}

function isWrappedKeyPayload(value: unknown): value is WrappedKeyPayload {
    return isEncryptedPayload(value)
        && typeof (value as WrappedKeyPayload).salt === "string"
        && typeof (value as WrappedKeyPayload).kdf === "string";
}

export async function POST(request: Request) {
    try {
        if (!env.RECOVERABLE_WRAP_SECRET) {
            return NextResponse.json({ error: "Recoverable encryption is not configured on this server yet." }, { status: 503 });
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "You need to sign in again before secure setup can continue." }, { status: 401 });
        }

        const body = await request.json() as {
            rawMasterKey?: string;
            validationPayload?: unknown;
            wrappedMasterKeyUser?: unknown;
            source?: "setup" | "migration";
        };

        if (!body.rawMasterKey || !isEncryptedPayload(body.validationPayload) || !isWrappedKeyPayload(body.wrappedMasterKeyUser)) {
            return NextResponse.json({ error: "Recoverable setup data is incomplete." }, { status: 400 });
        }

        const masterKey = await importAccountMasterKey(body.rawMasterKey);
        const wrappedMasterKeyServer = await wrapMasterKeyWithServerSecret(masterKey, env.RECOVERABLE_WRAP_SECRET, user.id);
        const now = new Date().toISOString();

        const { error: recoveryError } = await supabase
            .from("account_key_recovery")
            .upsert({
                user_id: user.id,
                wrapped_master_key_server: wrappedMasterKeyServer,
                recovery_version: 1,
                last_recovery_reason: body.source === "migration" ? "migration" : null,
                updated_at: now,
            }, {
                onConflict: "user_id",
            });

        if (recoveryError) {
            return NextResponse.json({ error: recoveryError.message }, { status: 500 });
        }

        const { error: profileError } = await supabase
            .from("user_profiles")
            .upsert({
                id: user.id,
                encryption_mode: "recoverable",
                mode_version: 1,
                key_setup_complete: true,
                validation_payload: body.validationPayload,
                wrapped_master_key_user: body.wrappedMasterKeyUser,
                user_wrap_salt: body.wrappedMasterKeyUser.salt,
                user_wrap_kdf: body.wrappedMasterKeyUser.kdf,
                recent_recovery_notice_at: null,
                recent_recovery_event_kind: body.source === "migration" ? "migrated_to_recoverable" : null,
                updated_at: now,
            }, {
                onConflict: "id",
            });

        if (profileError) {
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true }, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Recoverable setup failed.", error);
        return NextResponse.json({ error: "Recoverable setup could not be completed." }, { status: 500 });
    }
}
