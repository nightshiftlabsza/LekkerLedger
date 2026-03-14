import { createClient } from "./supabase/client";
import { cloudRepo } from "./cloud-repository";
import {
    deleteContract,
    deleteDocumentMeta,
    deleteEmployee,
    deleteLeaveRecord,
    deletePayPeriod,
    deletePayslip,
    getAllLeaveRecords,
    getAllPayslips,
    getContracts,
    getDocumentMeta,
    getDocuments,
    getEmployees,
    getHouseholds,
    getPayPeriods,
    hasMeaningfulLocalData,
    saveContract,
    saveDocumentFile,
    saveDocumentMeta,
    saveEmployee,
    saveHousehold,
    saveLeaveRecord,
    savePayPeriod,
    savePayslip,
    saveSettings,
} from "./storage";
import {
    Contract,
    DocumentMeta,
    Employee,
    EmployerSettings,
    Household,
    LeaveRecord,
    PayPeriod,
    PayslipInput,
} from "./schema";
import { syncEngine } from "./sync-engine";

export interface SyncServiceSnapshot {
    userId: string | null;
    ready: boolean;
    syncing: boolean;
    hasError: boolean;
    lastError: string | null;
}

interface SyncedRecordRow {
    table_name: string;
    record_id: string;
    encrypted_data?: string;
    updated_at: string;
}

interface SyncedFileRow {
    file_id: string;
    updated_at: string;
}

type SyncableRecord =
    | Employee
    | PayslipInput
    | LeaveRecord
    | PayPeriod
    | DocumentMeta
    | Contract
    | Household
    | EmployerSettings
    | Record<string, unknown>;

type SyncServiceListener = (snapshot: SyncServiceSnapshot) => void;

function toTimestamp(value?: string | Date): number {
    if (!value) return 0;
    return new Date(value).getTime() || 0;
}

export class SyncService {
    private supabase = createClient();
    private isSyncing = false;
    private userId: string | null = null;
    private isReconciling = false;
    private lastError: string | null = null;
    private readonly listeners = new Set<SyncServiceListener>();
    private snapshot: SyncServiceSnapshot = {
        userId: null,
        ready: false,
        syncing: false,
        hasError: false,
        lastError: null,
    };

    getSnapshot(): SyncServiceSnapshot {
        return this.snapshot;
    }

    subscribe(listener: SyncServiceListener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notifyListeners() {
        const nextSnapshot: SyncServiceSnapshot = {
            userId: this.userId,
            ready: Boolean(this.userId),
            syncing: this.isSyncing || this.isReconciling,
            hasError: Boolean(this.lastError),
            lastError: this.lastError,
        };

        const previous = this.snapshot;
        const didChange = previous.userId !== nextSnapshot.userId
            || previous.ready !== nextSnapshot.ready
            || previous.syncing !== nextSnapshot.syncing
            || previous.hasError !== nextSnapshot.hasError
            || previous.lastError !== nextSnapshot.lastError;

        if (!didChange) {
            return;
        }

        this.snapshot = nextSnapshot;
        const snapshot = this.snapshot;
        this.listeners.forEach((listener) => {
            listener(snapshot);
        });
    }

    private clearError() {
        if (!this.lastError) return;
        this.lastError = null;
        this.notifyListeners();
    }

    private captureError(error: unknown, fallbackMessage: string) {
        this.lastError = error instanceof Error && error.message
            ? error.message
            : fallbackMessage;
        this.notifyListeners();
    }

    init(userId: string, cryptoKey: CryptoKey) {
        this.userId = userId;
        this.lastError = null;
        cloudRepo.setCryptoKey(cryptoKey, userId);
        console.log("SyncService initialized for user", userId);
        this.notifyListeners();
    }

    clearSession() {
        this.userId = null;
        this.isSyncing = false;
        this.isReconciling = false;
        this.lastError = null;
        cloudRepo.clearCryptoKey();
        this.notifyListeners();
    }

    isReady() {
        return Boolean(this.userId);
    }

    setSyncing(value: boolean) {
        if (this.isSyncing === value) return;
        this.isSyncing = value;
        this.notifyListeners();
    }

    isCurrentlySyncing() {
        return this.isSyncing || this.isReconciling;
    }

    async pushLocalChange(table: string, id: string, data: Record<string, unknown>) {
        if (!this.userId || this.isSyncing) return;

        try {
            const normalizedData = {
                ...data,
                updatedAt: typeof data.updatedAt === "string" && data.updatedAt ? data.updatedAt : new Date().toISOString(),
            };
            await cloudRepo.pushRecord(table, id, normalizedData);
            this.clearError();
            console.log(`Pushed ${table}/${id} to cloud`);
        } catch (error) {
            this.captureError(error, `Failed to push ${table}/${id}.`);
            console.error(`Failed to push ${table}/${id}`, error);
        }
    }

    async pushLocalDelete(table: string, id: string) {
        if (!this.userId || this.isSyncing) return;

        try {
            await cloudRepo.deleteRecord(table, id);
            this.clearError();
            console.log(`Deleted ${table}/${id} from cloud`);
        } catch (error) {
            this.captureError(error, `Failed to delete ${table}/${id}.`);
            console.error(`Failed to delete ${table}/${id}`, error);
        }
    }

    async pushLocalFile(fileId: string, blob: Blob, mimeType: string, accessScope: "paid" | "contracts" | "vault" = "paid") {
        if (!this.userId || this.isSyncing) return;

        try {
            await cloudRepo.pushFile(fileId, blob, mimeType, accessScope);
            this.clearError();
            console.log(`Pushed file ${fileId} to cloud`);
        } catch (error) {
            this.captureError(error, `Failed to push file ${fileId}.`);
            console.error(`Failed to push file ${fileId}`, error);
        }
    }

    async pushLocalFileDelete(fileId: string) {
        if (!this.userId || this.isSyncing) return;

        try {
            await cloudRepo.deleteFile(fileId);
            this.clearError();
            console.log(`Deleted file ${fileId} from cloud`);
        } catch (error) {
            this.captureError(error, `Failed to delete file ${fileId}.`);
            console.error(`Failed to delete file ${fileId}`, error);
        }
    }

    async reconcileAfterUnlock() {
        if (!this.userId || this.isReconciling) return;

        this.isReconciling = true;
        this.setSyncing(true);
        try {
            const [remoteRows, localHasData] = await Promise.all([
                cloudRepo.listRecords(),
                hasMeaningfulLocalData(),
            ]);

            if (remoteRows.length > 0) {
                await this.restoreFromCloud(remoteRows);
                return;
            }

            if (localHasData) {
                await syncEngine.runMigration();
            }
            this.clearError();
        } catch (error) {
            this.captureError(error, "Failed to reconcile local and cloud data.");
            console.error("Failed to reconcile local and cloud data.", error);
            throw error;
        } finally {
            this.isReconciling = false;
            this.setSyncing(false);
            this.notifyListeners();
        }
    }

    async restoreFromCloud(remoteRows?: Array<{ table_name: string; record_id: string; updated_at: string }>) {
        if (!this.userId) return;

        this.setSyncing(true);
        try {
            const records = remoteRows ?? await cloudRepo.listRecords();
            for (const row of records) {
                const record = await cloudRepo.pullRecord(row.table_name, row.record_id);
                if (!record) continue;
                if (!(await this.isRemoteNewer(row.table_name, row.record_id, row.updated_at))) {
                    continue;
                }
                await this.applyLocalSave(row.table_name, record);
            }

            const { data: fileRows, error } = await this.supabase
                .from("synced_files")
                .select("file_id, updated_at")
                .eq("user_id", this.userId);

            if (error) {
                throw error;
            }

            for (const fileRow of (fileRows ?? []) as SyncedFileRow[]) {
                await this.applyRemoteFileChange({
                    new: fileRow as unknown as Record<string, unknown>,
                    eventType: "INSERT",
                });
            }
            this.clearError();
        } catch (error) {
            this.captureError(error, "Failed to restore cloud data.");
            console.error("Failed to restore cloud data.", error);
        } finally {
            this.setSyncing(false);
        }
    }

    async applyRemoteChange(payload: { new?: Record<string, unknown>; old?: Record<string, unknown>; eventType: string }) {
        if (!this.userId) return;

        const row = (payload.new || payload.old || {}) as unknown as SyncedRecordRow;
        const { table_name, record_id, updated_at } = row;
        if (!table_name || !record_id) return;

        console.log(`Applying remote ${payload.eventType} on ${table_name}/${record_id}`);

        this.setSyncing(true);
        try {
            if (payload.eventType === "DELETE") {
                await this.applyLocalDelete(table_name, record_id);
                return;
            }

            const record = await cloudRepo.pullRecord(table_name, record_id);
            if (!record) return;
            if (!(await this.isRemoteNewer(table_name, record_id, updated_at))) {
                return;
            }

            await this.applyLocalSave(table_name, record);
            this.clearError();
        } catch (error) {
            this.captureError(error, `Failed to apply remote change for ${table_name}/${record_id}.`);
            console.error(`Failed to apply remote change for ${table_name}/${record_id}`, error);
        } finally {
            this.setSyncing(false);
        }
    }

    async applyRemoteFileChange(payload: { new?: Record<string, unknown>; old?: Record<string, unknown>; eventType: string }) {
        if (!this.userId) return;

        const row = (payload.new || payload.old || {}) as unknown as SyncedFileRow;
        const fileId = row.file_id;
        if (!fileId) return;

        this.setSyncing(true);
        try {
            if (payload.eventType === "DELETE") {
                return;
            }

            let document = await getDocumentMeta(fileId);
            if (!document) {
                await new Promise((resolve) => setTimeout(resolve, 400));
                document = await getDocumentMeta(fileId);
            }

            if (!document) {
                return;
            }

            const file = await cloudRepo.pullFile(fileId);
            if (!file) {
                return;
            }

            await saveDocumentFile(fileId, file.blob);
            this.clearError();
        } catch (error) {
            this.captureError(error, `Failed to restore file ${fileId}.`);
            console.error(`Failed to restore file ${fileId}`, error);
        } finally {
            this.setSyncing(false);
        }
    }

    private async isRemoteNewer(table: string, id: string, remoteUpdatedAt: string): Promise<boolean> {
        if (!remoteUpdatedAt) return true;
        if (table === "settings") return true;

        let localRecord: { updatedAt?: string | Date } | undefined;
        switch (table) {
            case "employees":
                localRecord = (await getEmployees()).find((employee) => employee.id === id);
                break;
            case "payslips":
                localRecord = (await getAllPayslips()).find((payslip) => payslip.id === id);
                break;
            case "leave":
                localRecord = (await getAllLeaveRecords()).find((record) => record.id === id);
                break;
            case "pay_periods":
                localRecord = (await getPayPeriods()).find((period) => period.id === id);
                break;
            case "documents":
                localRecord = (await getDocuments()).find((document) => document.id === id);
                break;
            case "contracts":
                localRecord = (await getContracts()).find((contract) => contract.id === id);
                break;
            case "households":
                localRecord = (await getHouseholds()).find((household) => household.id === id);
                break;
            default:
                localRecord = undefined;
        }

        if (!localRecord || !localRecord.updatedAt) return true;
        return toTimestamp(remoteUpdatedAt) > toTimestamp(localRecord.updatedAt);
    }

    private async applyLocalSave(table: string, data: SyncableRecord) {
        switch (table) {
            case "settings":
                await saveSettings(data as EmployerSettings);
                break;
            case "employees":
                await saveEmployee(data as Employee);
                break;
            case "payslips":
                await savePayslip(data as PayslipInput);
                break;
            case "leave":
                await saveLeaveRecord(data as LeaveRecord);
                break;
            case "pay_periods":
                await savePayPeriod(data as PayPeriod);
                break;
            case "documents":
                await saveDocumentMeta(data as DocumentMeta);
                break;
            case "contracts":
                await saveContract(data as Contract);
                break;
            case "households":
                await saveHousehold(data as Household);
                break;
            default:
                break;
        }
    }

    private async applyLocalDelete(table: string, id: string) {
        switch (table) {
            case "employees":
                await deleteEmployee(id);
                break;
            case "payslips":
                await deletePayslip(id);
                break;
            case "leave":
                await deleteLeaveRecord(id);
                break;
            case "pay_periods":
                await deletePayPeriod(id);
                break;
            case "documents":
                await deleteDocumentMeta(id);
                break;
            case "contracts":
                await deleteContract(id);
                break;
            default:
                break;
        }
    }
}

export const syncService = new SyncService();
