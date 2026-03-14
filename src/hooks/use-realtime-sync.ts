import { useEffect, useEffectEvent, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { syncService } from "@/lib/sync-service";

function getRealtimeFieldValue(
    row: Record<string, unknown> | undefined,
    ...keys: string[]
): string {
    for (const key of keys) {
        const value = row?.[key];
        if (typeof value === "string" || typeof value === "number") {
            return String(value);
        }
    }

    return "unknown";
}

export function useRealtimeSync(userId: string | undefined, onDataChanged: () => void) {
    const emitDataChanged = useEffectEvent(onDataChanged);
    const recentEventKeyRef = useRef<string | null>(null);
    const recentEventAtRef = useRef(0);

    useEffect(() => {
        if (!userId) return;

        const supabase = createClient();
        recentEventKeyRef.current = null;
        recentEventAtRef.current = 0;

        function shouldSkipDuplicateEvent(payload: { eventType: string; new?: Record<string, unknown>; old?: Record<string, unknown> }) {
            const row = payload.new ?? payload.old;
            const eventKey = [
                payload.eventType,
                getRealtimeFieldValue(row, "table_name", "file_id"),
                getRealtimeFieldValue(row, "record_id", "file_id"),
                getRealtimeFieldValue(row, "updated_at"),
            ].join(":");
            const now = Date.now();

            if (recentEventKeyRef.current === eventKey && now - recentEventAtRef.current < 750) {
                return true;
            }

            recentEventKeyRef.current = eventKey;
            recentEventAtRef.current = now;
            return false;
        }

        // Subscribe to changes affecting this user's rows in both synced_records and synced_files
        const recordsSubscription = supabase
            .channel(`public:synced_records:${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "synced_records",
                    filter: `user_id=eq.${userId}`,
                },
                async (payload) => {
                    if (shouldSkipDuplicateEvent(payload)) {
                        return;
                    }
                    await syncService.applyRemoteChange(payload);
                    emitDataChanged();
                },
            )
            .subscribe();

        const filesSubscription = supabase
            .channel(`public:synced_files:${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "synced_files",
                    filter: `user_id=eq.${userId}`,
                },
                async (payload) => {
                    if (shouldSkipDuplicateEvent(payload)) {
                        return;
                    }
                    await syncService.applyRemoteFileChange(payload);
                    emitDataChanged();
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(recordsSubscription);
            supabase.removeChannel(filesSubscription);
        };
    }, [userId]);
}
