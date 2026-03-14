import { createClient } from "./supabase/client";
import { decryptData, decryptFile, encryptData, encryptFile } from "./crypto";

export class CloudRepository {
    private supabase = createClient();
    private cryptoKey: CryptoKey | null = null;
    private userId: string | null = null;

    setCryptoKey(key: CryptoKey, userId: string) {
        this.cryptoKey = key;
        this.userId = userId;
    }

    clearCryptoKey() {
        this.cryptoKey = null;
        this.userId = null;
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

    async listRecords(): Promise<Array<{ table_name: string; record_id: string; updated_at: string }>> {
        if (!this.userId) throw new Error("Sync not initialized");

        const { data, error } = await this.supabase
            .from('synced_records')
            .select('table_name, record_id, updated_at')
            .eq('user_id', this.userId);

        if (error) throw new Error(`List failed: ${error.message}`);
        return data ?? [];
    }

    async pushFile(fileId: string, blob: Blob, mimeType: string, accessScope: "paid" | "contracts" | "vault" = "paid") {
        if (!this.cryptoKey || !this.userId) throw new Error("Sync not initialized");

        const { encryptedBlob, iv } = await encryptFile(new File([blob], fileId, { type: mimeType }), this.cryptoKey);
        const updatedAt = new Date().toISOString();
        const { error: metadataError } = await this.supabase
            .from('synced_files')
            .upsert({
                user_id: this.userId,
                file_id: fileId,
                mime_type: mimeType,
                iv,
                size: blob.size,
                updated_at: updatedAt,
            });

        if (metadataError) throw new Error(`File metadata sync failed: ${metadataError.message}`);

        const presignResponse = await fetch(`/api/storage/presign?fileId=${encodeURIComponent(fileId)}&scope=${encodeURIComponent(accessScope)}`);
        if (!presignResponse.ok) {
            throw new Error("Failed to get an upload URL for the document.");
        }

        const { uploadUrl } = await presignResponse.json();
        const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            body: encryptedBlob,
            headers: {
                "Content-Type": "application/octet-stream",
            },
        });

        if (!uploadResponse.ok) {
            throw new Error("Document upload failed.");
        }
    }

    async pullFile(fileId: string): Promise<{ blob: Blob; mimeType: string } | null> {
        if (!this.cryptoKey || !this.userId) throw new Error("Sync not initialized");

        const { data, error } = await this.supabase
            .from('synced_files')
            .select('mime_type, iv')
            .match({ user_id: this.userId, file_id: fileId })
            .maybeSingle();

        if (error) throw new Error(`File lookup failed: ${error.message}`);
        if (!data) return null;

        const downloadResponse = await fetch(`/api/storage/download?fileId=${encodeURIComponent(fileId)}`);
        if (!downloadResponse.ok) {
            throw new Error("Failed to download the encrypted document.");
        }

        const { downloadUrl } = await downloadResponse.json();
        const encryptedResponse = await fetch(downloadUrl);
        if (!encryptedResponse.ok) {
            throw new Error("Encrypted document could not be fetched.");
        }

        const encryptedBlob = await encryptedResponse.blob();
        const decryptedBlob = await decryptFile(encryptedBlob, data.iv, this.cryptoKey, data.mime_type || "application/octet-stream");
        return {
            blob: decryptedBlob,
            mimeType: data.mime_type || decryptedBlob.type || "application/octet-stream",
        };
    }

    async deleteFile(fileId: string) {
        if (!this.userId) throw new Error("Sync not initialized");
        const { error } = await this.supabase
            .from('synced_files')
            .delete()
            .match({ user_id: this.userId, file_id: fileId });

        if (error) throw new Error(`File delete failed: ${error.message}`);

        const response = await fetch(`/api/storage/delete?fileId=${encodeURIComponent(fileId)}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error("Encrypted file deletion failed.");
        }
    }
}

export const cloudRepo = new CloudRepository();
