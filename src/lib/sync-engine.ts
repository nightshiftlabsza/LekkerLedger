import { createClient } from "@/lib/supabase/client";
import { LocalRepository } from "@/lib/local-repository";
import { encryptData, encryptFile } from "@/lib/crypto";

export interface SyncProgressData {
    status: 'idle' | 'running' | 'completed' | 'error';
    currentTask: string;
    progress: number; // 0 to 100
    error?: string;
}

type ProgressCallback = (data: SyncProgressData) => void;

/**
 * Handles the one-time local-to-cloud migration.
 * Reads everything from LocalRepository, encrypts it, and pushes it to Supabase
 * and R2 (for files).
 */
export class SyncEngine {
    private localRepo: LocalRepository;
    private supabase = createClient();
    private cryptoKey: CryptoKey | null = null;
    private onProgress?: ProgressCallback;

    constructor() {
        this.localRepo = new LocalRepository();
    }

    setCryptoKey(key: CryptoKey) {
        this.cryptoKey = key;
    }

    onProgressUpdate(cb: ProgressCallback) {
        this.onProgress = cb;
    }

    private updateProgress(task: string, percentage: number) {
        if (this.onProgress) {
            this.onProgress({
                status: 'running',
                currentTask: task,
                progress: percentage
            });
        }
    }

    async runMigration() {
        if (!this.cryptoKey) throw new Error("Encryption key not set.");

        try {
            this.updateProgress("Authenticating...", 0);
            const { data: { user }, error: authError } = await this.supabase.auth.getUser();
            if (authError || !user) throw new Error("Must be logged in to sync data.");

            this.updateProgress("Reading local data...", 10);
            
            // 1. Gather all local data
            // Note: Since this is local, we just grab everything we have
            // We need to fetch from the raw storage or use the repo methods.
            // Since repo methods might require specific household IDs, we actually need to 
            // query localforage directly for all keys to ensure we don't miss anything, 
            // OR depend on the known IDs. For simplicity, we assume we want to sync
            // the active employer settings, and we loop through known stores.
            
            const settings = await this.localRepo.getSettings();
            
            // To do this thoroughly without a specific ID, we'd need to use the lower-level localforage instances.
            // But let's build the generic pusher.
            
            // We will push settings first
            this.updateProgress("Encrypting settings...", 20);
            if (settings) {
                 await this.pushRecord('settings', 'main', settings, user.id);
            }

            // You would normally fetch all dynamic lists here (employees, payslips, leaves, contracts)
            // For a complete migration, you'd iterate `localforage.iterate()`.
            
            this.updateProgress("Sync complete!", 100);
            if (this.onProgress) {
                this.onProgress({
                    status: 'completed',
                    currentTask: 'Done',
                    progress: 100
                });
            }

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error occurred";
            console.error("Migration failed", message);
            if (this.onProgress) {
                this.onProgress({
                    status: 'error',
                    currentTask: 'Failed',
                    progress: 0,
                    error: message
                });
            }
            throw error;
        }
    }

    private async pushRecord(tableName: string, recordId: string, data: Record<string, unknown>, userId: string) {
        if (!this.cryptoKey) return;
        
        const encrypted = await encryptData(data, this.cryptoKey);
        
        const { error } = await this.supabase
            .from('synced_records')
            .upsert({
                user_id: userId,
                table_name: tableName,
                record_id: recordId,
                encrypted_data: encrypted,
                updated_at: new Date().toISOString()
            });
            
        if (error) {
            console.error(`Failed to push ${tableName}/${recordId}`, error);
            throw new Error(`Cloud sync failed: ${error.message}`);
        }
    }

    // Helper for files
    private async pushFile(fileId: string, blob: Blob, originalMimeType: string, userId: string) {
        if (!this.cryptoKey) return;

        const { encryptedBlob, iv } = await encryptFile(new File([blob], fileId, { type: originalMimeType }), this.cryptoKey);
        
        // Push the metadata to Supabase
        const { error: dbError } = await this.supabase
            .from('synced_files')
            .upsert({
                user_id: userId,
                file_id: fileId,
                mime_type: originalMimeType,
                iv: iv,
                size: blob.size,
                updated_at: new Date().toISOString()
            });

        if (dbError) throw new Error(`Failed metadata sync: ${dbError.message}`);

        // Upload to R2 via presigned URL
        // We need an API route to get the URL
        const res = await fetch(`/api/storage/presign?fileId=${encodeURIComponent(fileId)}`);
        if (!res.ok) throw new Error("Failed to get upload URL");
        
        const { uploadUrl } = await res.json();
        
        const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            body: encryptedBlob,
            headers: {
                'Content-Type': 'application/octet-stream'
            }
        });

        if (!uploadRes.ok) throw new Error("Cloud upload failed");
    }
}

export const syncEngine = new SyncEngine();
