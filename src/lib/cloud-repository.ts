import { createClient } from "./supabase/client";
import { encryptData, decryptData } from "./crypto";

export class CloudRepository {
    private supabase = createClient();
    private cryptoKey: CryptoKey | null = null;
    private userId: string | null = null;

    setCryptoKey(key: CryptoKey, userId: string) {
        this.cryptoKey = key;
        this.userId = userId;
    }

    async pushRecord(tableName: string, recordId: string, data: Record<string, unknown>) {
        if (!this.cryptoKey || !this.userId) throw new Error("Sync not initialized");

        // Conflict resolution: Check if cloud is already newer
        const { data: existing, error: pullError } = await this.supabase
            .from('synced_records')
            .select('updated_at')
            .match({ user_id: this.userId, table_name: tableName, record_id: recordId })
            .maybeSingle();

        if (pullError) console.warn("LWW check failed, proceeding with push", pullError);
        
        const incomingUpdatedAt = (data.updatedAt as string) || new Date().toISOString();
        
        if (existing?.updated_at) {
            const cloudTime = new Date(existing.updated_at).getTime();
            const localTime = new Date(incomingUpdatedAt).getTime();
            if (cloudTime >= localTime) {
                console.log(`Cloud version of ${tableName}/${recordId} is newer or same. Skipping push.`);
                return;
            }
        }

        const encrypted = await encryptData(data, this.cryptoKey);
        
        const { error } = await this.supabase
            .from('synced_records')
            .upsert({
                user_id: this.userId,
                table_name: tableName,
                record_id: recordId,
                encrypted_data: encrypted,
                updated_at: incomingUpdatedAt
            });
            
        if (error) throw new Error(`Push failed: ${error.message}`);
    }

    async deleteRecord(tableName: string, recordId: string) {
        if (!this.cryptoKey || !this.userId) throw new Error("Sync not initialized");
        const { error } = await this.supabase
            .from('synced_records')
            .delete()
            .match({ user_id: this.userId, table_name: tableName, record_id: recordId });
            
        if (error) throw new Error(`Delete failed: ${error.message}`);
    }

    async pullRecord(tableName: string, recordId: string): Promise<Record<string, unknown> | null> {
        if (!this.cryptoKey || !this.userId) throw new Error("Sync not initialized");
        const { data, error } = await this.supabase
            .from('synced_records')
            .select('encrypted_data')
            .match({ user_id: this.userId, table_name: tableName, record_id: recordId })
            .maybeSingle();
            
        if (error) throw new Error(`Pull failed: ${error.message}`);
        if (!data) return null;
        
        return await decryptData(data.encrypted_data, this.cryptoKey);
    }
}

export const cloudRepo = new CloudRepository();
