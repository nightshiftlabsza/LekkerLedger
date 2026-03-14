import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVerifiedEntitlementsForUser } from "@/lib/billing-server";

export type StorageAccessScope = "paid" | "contracts" | "vault";

export class StorageAccessError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

export function parseStorageAccessScope(value: string | null | undefined): StorageAccessScope {
    if (value === "contracts" || value === "vault") return value;
    return "paid";
}

export async function requireStorageAccess(request: NextRequest, requiredScope = parseStorageAccessScope(request.nextUrl.searchParams.get("scope"))) {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        throw new StorageAccessError("Unauthorized", 401);
    }

    const entitlements = await getVerifiedEntitlementsForUser(session.user.id);
    if (!entitlements.isActive || entitlements.planId === "free") {
        throw new StorageAccessError("A paid plan is required for encrypted file storage.", 403);
    }

    if (requiredScope === "vault" && entitlements.planId !== "pro") {
        throw new StorageAccessError("Vault uploads require the Pro plan.", 403);
    }

    return {
        session,
        entitlements,
        scope: requiredScope,
    };
}
