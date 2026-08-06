import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
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

        const { data: existingProfile, error: profileReadError } = await supabase
            .from("user_profiles")
            .select("key_setup_complete, recent_recovery_event_kind, updated_at")
            .eq("id", user.id)
            .maybeSingle<{
                key_setup_complete?: boolean | null;
                recent_recovery_event_kind?: string | null;
                updated_at?: string | null;
            }>();

        if (profileReadError) {
            return NextResponse.json({ error: profileReadError.message }, { status: 500 });
        }

        // A completed profile is authoritative. Never replace its key material
        // with a newly generated key merely because a client retried setup.
        if (existingProfile?.key_setup_complete) {
            return NextResponse.json({ ok: true, alreadyComplete: true }, {
                headers: { "Cache-Control": "no-store" },
            });
        }

        const existingEvent = existingProfile?.recent_recovery_event_kind || null;
        const existingUpdatedAt = existingProfile?.updated_at ? Date.parse(existingProfile.updated_at) : 0;
        const leaseIsFresh = existingEvent?.startsWith("setup_in_progress:")
            && Number.isFinite(existingUpdatedAt)
            && Date.now() - existingUpdatedAt < 10 * 60 * 1000;

        if (leaseIsFresh) {
            return NextResponse.json({ error: "Secure setup is already being completed in another tab. Please refresh shortly." }, { status: 409 });
        }

        const setupLease = `setup_in_progress:${randomUUID()}`;
        let leaseAcquired = false;

        // Initialize only the missing row. This does not touch an existing
        // profile's encryption data and makes a later retry safe.
        if (!existingProfile) {
            const { error: profileInitError } = await supabase
                .from("user_profiles")
                .insert({
                    id: user.id,
                    encryption_mode: "recoverable",
                    mode_version: 1,
                    key_setup_complete: false,
                    recent_recovery_event_kind: setupLease,
                    updated_at: now,
                });

            if (profileInitError && profileInitError.code !== "23505") {
                return NextResponse.json({ error: profileInitError.message }, { status: 500 });
            }

            // A duplicate means another request created or claimed the row.
            // Leave its data untouched and make the caller retry safely.
            if (profileInitError) {
                return NextResponse.json({ error: "Secure setup is already being completed. Please refresh shortly." }, { status: 409 });
            }

            leaseAcquired = true;
        } else {
            let leaseQuery = supabase
                .from("user_profiles")
                .update({ recent_recovery_event_kind: setupLease, updated_at: now })
                .eq("id", user.id)
                .eq("key_setup_complete", false);

            leaseQuery = existingEvent === null
                ? leaseQuery.is("recent_recovery_event_kind", null)
                : leaseQuery.eq("recent_recovery_event_kind", existingEvent);

            const { data: leasedProfile, error: leaseError } = await leaseQuery
                .select("id")
                .maybeSingle<{ id: string }>();

            if (leaseError) {
                return NextResponse.json({ error: leaseError.message }, { status: 500 });
            }

            if (!leasedProfile) {
                return NextResponse.json({ error: "Secure setup is already being completed. Please refresh shortly." }, { status: 409 });
            }

            leaseAcquired = true;
        }

        if (!leaseAcquired) {
            return NextResponse.json({ error: "Secure setup could not obtain an account lock." }, { status: 409 });
        }

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
            await supabase
                .from("user_profiles")
                .update({ recent_recovery_event_kind: existingEvent, updated_at: new Date().toISOString() })
                .eq("id", user.id)
                .eq("recent_recovery_event_kind", setupLease);
            return NextResponse.json({ error: recoveryError.message }, { status: 500 });
        }

        const { data: updatedProfile, error: profileError } = await supabase
            .from("user_profiles")
            .update({
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
            })
            .eq("id", user.id)
            .eq("key_setup_complete", false)
            .eq("recent_recovery_event_kind", setupLease)
            .select("id")
            .maybeSingle<{ id: string }>();

        if (profileError) {
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        if (!updatedProfile) {
            // Another setup request completed this same account first. Do not
            // let this request unlock the newly generated, losing key.
            return NextResponse.json({ ok: true, alreadyComplete: true }, {
                headers: { "Cache-Control": "no-store" },
            });
        }

        return NextResponse.json({ ok: true, alreadyComplete: false }, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Recoverable setup failed.", error);
        return NextResponse.json({ error: "Recoverable setup could not be completed." }, { status: 500 });
    }
}
