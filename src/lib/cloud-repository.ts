import { createClient } from "./supabase/client";
import { encryptData, decryptData, encryptFile, decryptFile } from "./crypto";

export class CloudRepository {
    private supabase = createClient();
    private cryptoKey: CryptoKey | null = null;
    private userId: string | null = null;

    setCryptoKey(key: CryptoKey, userId: string) {
        this.cryptoKey = key;
        this.userId = userId;
    }

    async pushRecord(tableName: string, recordId: string, data: any) {
        if (!this.cryptoKey || !this.userId) throw new Error("Sync not initialized");
        const encrypted = await encryptData(data, this.cryptoKey);
        
        const { error } = await this.supabase
            .from('synced_records')
            .upsert({
                user_id: this.userId,
                table_name: tableName,
                record_id: recordId,
                encrypted_data: encrypted,
                updated_at: new Date().toISOString()
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

    async pullRecord(tableName: string, recordId: string): Promise<any> {
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
