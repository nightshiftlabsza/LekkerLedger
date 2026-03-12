import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { syncService } from '@/lib/sync-service';

export function useRealtimeSync(userId: string | undefined, onDataChanged: () => void) {
    useEffect(() => {
        if (!userId) return;

        const supabase = createClient();

        // Subscribe to changes affecting this user's rows in both synced_records and synced_files
        const recordsSubscription = supabase
            .channel('public:synced_records')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'synced_records',
                    filter: `user_id=eq.${userId}`
                },
                async (payload) => {
                    console.log('Realtime update received (records):', payload);
                    await syncService.applyRemoteChange(payload);
                    onDataChanged();
                }
            )
            .subscribe();

        const filesSubscription = supabase
            .channel('public:synced_files')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'synced_files',
                    filter: `user_id=eq.${userId}`
                },
                async (payload) => {
                    console.log('Realtime update received (files):', payload);
                    await syncService.applyRemoteFileChange(payload);
                    onDataChanged();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(recordsSubscription);
            supabase.removeChannel(filesSubscription);
        };
    }, [userId, onDataChanged]);
}
