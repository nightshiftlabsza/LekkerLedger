import { createClient } from "./supabase/client";
import { cloudRepo } from "./cloud-repository";
import { 
    getEmployees, saveEmployee, 
    getAllPayslips, savePayslip, deletePayslip,
    getAllLeaveRecords, saveLeaveRecord, deleteLeaveRecord,
    getPayPeriods, savePayPeriod, deletePayPeriod,
    getDocuments, saveDocumentMeta, deleteDocumentMeta,
    getContracts, saveContract, deleteContract,
    getHouseholds, saveHousehold
} from "./storage";

export class SyncService {
    private supabase = createClient();
    private isSyncing = false;
    private userId: string| null = null;

    init(userId: string, cryptoKey: CryptoKey) {
        this.userId = userId;
        cloudRepo.setCryptoKey(cryptoKey, userId);
        console.log("SyncService initialized for user", userId);
    }

    setSyncing(value: boolean) {
        this.isSyncing = value;
    }

    isCurrentlySyncing() {
        return this.isSyncing;
    }

    // Called when local storage changes
    async pushLocalChange(table: string, id: string, data: Record<string, unknown>) {
        if (!this.userId) return;
        if (this.isSyncing) return; // Prevent infinite loop

        try {
            if (!data.updatedAt) {
                // Should not happen if schema/storage handles it, but safety check
                data.updatedAt = new Date().toISOString();
            }
            await cloudRepo.pushRecord(table, id, data);
            console.log(`Pushed ${table}/${id} to cloud`);
        } catch (error) {
            console.error(`Failed to push ${table}/${id}`, error);
        }
    }

    async pushLocalDelete(table: string, id: string) {
        if (!this.userId) return;
        if (this.isSyncing) return; // Prevent infinite loop

        try {
            await cloudRepo.deleteRecord(table, id);
            console.log(`Deleted ${table}/${id} from cloud`);
        } catch (error) {
            console.error(`Failed to delete ${table}/${id}`, error);
        }
    }

    // Called by useRealtimeSync when a remote change arrives
    async applyRemoteChange(payload: { new?: Record<string, unknown>; old?: Record<string, unknown>; eventType: string }) {
        if (!this.userId) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { table_name, record_id, encrypted_data, updated_at } = (payload.new || payload.old || {}) as any;
        const eventType = payload.eventType;

        if (!table_name || !record_id) return;

        console.log(`Applying remote ${eventType} on ${table_name}/${record_id}`);

        this.setSyncing(true);
        try {
            if (eventType === 'DELETE') {
                await this.applyLocalDelete(table_name, record_id);
                return;
            }

            // INSERT or UPDATE
            if (!encrypted_data) return;
            const record = await cloudRepo.pullRecord(table_name, record_id);
            if (!record) return;

            // Conflict resolution: Last Write Wins
            const isNewer = await this.isRemoteNewer(table_name, record_id, updated_at as string);
            if (!isNewer) {
                console.log(`Local ${table_name}/${record_id} is newer, ignoring remote.`);
                return;
            }

            await this.applyLocalSave(table_name, record);
        } catch (error) {
            console.error(`Failed to apply remote change for ${table_name}/${record_id}`, error);
        } finally {
            this.setSyncing(false);
        }
    }

    private async isRemoteNewer(table: string, id: string, remoteUpdatedAt: string): Promise<boolean> {
        if (!remoteUpdatedAt) return true;

        let localRecord: { updatedAt?: string | Date } | undefined = undefined;
        switch (table) {
            case 'employees':
                localRecord = (await getEmployees()).find(e => e.id === id) as { updatedAt?: string } | undefined;
                break;
            case 'payslips':
                localRecord = (await getAllPayslips()).find(p => p.id === id) as { updatedAt?: string } | undefined;
                break;
            case 'leave':
                localRecord = (await getAllLeaveRecords()).find(l => l.id === id) as { updatedAt?: string } | undefined;
                break;
            case 'pay_periods':
                localRecord = (await getPayPeriods()).find(p => p.id === id) as { updatedAt?: string } | undefined;
                break;
            case 'documents':
                localRecord = (await getDocuments()).find(d => d.id === id) as { updatedAt?: string } | undefined;
                break;
            case 'contracts':
                localRecord = (await getContracts()).find(c => c.id === id) as { updatedAt?: string } | undefined;
                break;
            case 'households':
                localRecord = (await getHouseholds()).find(h => h.id === id) as { updatedAt?: string } | undefined;
                break;
        }

        if (!localRecord || !localRecord.updatedAt) return true;

        const localTime = new Date(localRecord.updatedAt).getTime();
        const remoteTime = new Date(remoteUpdatedAt).getTime();
        return remoteTime > localTime;
    }

    private async applyLocalSave(table: string, data: Record<string, unknown>) {
        switch (table) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            case 'employees': await saveEmployee(data as any); break;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            case 'payslips': await savePayslip(data as any); break;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            case 'leave': await saveLeaveRecord(data as any); break;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            case 'pay_periods': await savePayPeriod(data as any); break;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            case 'documents': await saveDocumentMeta(data as any); break;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            case 'contracts': await saveContract(data as any); break;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            case 'households': await saveHousehold(data as any); break;
        }
    }

    private async applyLocalDelete(table: string, id: string) {
        switch (table) {
            case 'payslips': await deletePayslip(id); break;
            case 'leave': await deleteLeaveRecord(id); break;
            case 'pay_periods': await deletePayPeriod(id); break;
            case 'documents': await deleteDocumentMeta(id); break;
            case 'contracts': await deleteContract(id); break;
            // Add other deletes if applicable
        }
    }
}

export const syncService = new SyncService();
