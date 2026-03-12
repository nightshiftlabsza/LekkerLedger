import { createClient } from "@/lib/supabase/client";
import { cloudRepo } from "@/lib/cloud-repository";
import { getSyncMigrationSnapshot } from "@/lib/storage";

export interface SyncProgressData {
    status: "idle" | "running" | "completed" | "error";
    currentTask: string;
    progress: number;
    error?: string;
}

type ProgressCallback = (data: SyncProgressData) => void;

export class SyncEngine {
    private supabase = createClient();
    private cryptoKey: CryptoKey | null = null;
    private onProgress?: ProgressCallback;

    setCryptoKey(key: CryptoKey | null) {
        this.cryptoKey = key;
    }

    onProgressUpdate(cb: ProgressCallback) {
        this.onProgress = cb;
    }

    private updateProgress(task: string, percentage: number) {
        this.onProgress?.({
            status: "running",
            currentTask: task,
            progress: percentage,
        });
    }

    async runMigration() {
        if (!this.cryptoKey) throw new Error("Encryption key not set.");

        try {
            this.updateProgress("Authenticating...", 0);
            const { data: { user }, error: authError } = await this.supabase.auth.getUser();
            if (authError || !user) throw new Error("Must be logged in to sync data.");

            this.updateProgress("Reading local data...", 10);
            const snapshot = await getSyncMigrationSnapshot();
            const tasks = [
                ...snapshot.households.map((record) => ({ label: `Household ${record.name}`, run: () => cloudRepo.pushRecord("households", record.id, record as unknown as Record<string, unknown>) })),
                { label: "Settings", run: () => cloudRepo.pushRecord("settings", "main", { ...snapshot.settings, updatedAt: new Date().toISOString() }) },
                ...snapshot.employees.map((record) => ({ label: `Employee ${record.name}`, run: () => cloudRepo.pushRecord("employees", record.id, record as unknown as Record<string, unknown>) })),
                ...snapshot.payslips.map((record) => ({ label: `Payslip ${record.id}`, run: () => cloudRepo.pushRecord("payslips", record.id, record as unknown as Record<string, unknown>) })),
                ...snapshot.leaveRecords.map((record) => ({ label: `Leave ${record.id}`, run: () => cloudRepo.pushRecord("leave", record.id, record as unknown as Record<string, unknown>) })),
                ...snapshot.payPeriods.map((record) => ({ label: `Pay period ${record.name}`, run: () => cloudRepo.pushRecord("pay_periods", record.id, record as unknown as Record<string, unknown>) })),
                ...snapshot.documents.map((record) => ({ label: `Document ${record.fileName}`, run: () => cloudRepo.pushRecord("documents", record.id, record as unknown as Record<string, unknown>) })),
                ...snapshot.contracts.map((record) => ({ label: `Contract ${record.id}`, run: () => cloudRepo.pushRecord("contracts", record.id, record as unknown as Record<string, unknown>) })),
                ...snapshot.documentFiles.map((record) => ({ label: `Uploaded file ${record.id}`, run: () => cloudRepo.pushFile(record.id, record.blob, record.mimeType) })),
            ];

            if (tasks.length === 0) {
                this.onProgress?.({
                    status: "completed",
                    currentTask: "Nothing new to back up.",
                    progress: 100,
                });
                return;
            }

            for (let index = 0; index < tasks.length; index += 1) {
                const task = tasks[index];
                const progress = 10 + Math.round(((index + 1) / tasks.length) * 90);
                this.updateProgress(task.label, progress);
                await task.run();
            }

            this.onProgress?.({
                status: "completed",
                currentTask: "Backup complete",
                progress: 100,
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error occurred";
            console.error("Migration failed", message);
            this.onProgress?.({
                status: "error",
                currentTask: "Failed",
                progress: 0,
                error: message,
            });
            throw error;
        }
    }
}

export const syncEngine = new SyncEngine();
