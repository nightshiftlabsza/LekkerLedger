import { StorageAdapter } from "./storage-adapter";
import * as localStore from "./storage";
import {
    AuditLog,
    Contract,
    DocumentMeta,
    Employee,
    EmployerSettings,
    Household,
    LeaveCarryOver,
    LeaveRecord,
    PayPeriod,
    PayslipInput,
} from "./schema";

/**
 * Implementation of StorageAdapter that reads/writes directly from IndexedDB via localforage.
 * This wraps the existing functions in `src/lib/storage.ts`.
 */
export class LocalRepository implements StorageAdapter {
    async getHouseholds(): Promise<Household[]> {
        return localStore.getHouseholds();
    }
    async saveHousehold(household: Household): Promise<void> {
        return localStore.saveHousehold(household);
    }

    async getSettings(): Promise<EmployerSettings> {
        return localStore.getSettings();
    }
    async saveSettings(settings: EmployerSettings): Promise<void> {
        return localStore.saveSettings(settings);
    }

    async getEmployees(): Promise<Employee[]> {
        return localStore.getEmployees();
    }
    async getEmployee(id: string): Promise<Employee | null> {
        return localStore.getEmployee(id);
    }
    async saveEmployee(employee: Employee): Promise<void> {
        return localStore.saveEmployee(employee);
    }
    async deleteEmployee(id: string): Promise<void> {
        return localStore.deleteEmployee(id);
    }

    async getAllPayslips(): Promise<PayslipInput[]> {
        return localStore.getAllPayslips();
    }
    async getPayslipsForEmployee(employeeId: string): Promise<PayslipInput[]> {
        return localStore.getPayslipsForEmployee(employeeId);
    }
    async getLatestPayslip(employeeId: string): Promise<PayslipInput | null> {
        return localStore.getLatestPayslip(employeeId);
    }
    async savePayslip(payslip: PayslipInput): Promise<void> {
        return localStore.savePayslip(payslip);
    }
    async deletePayslip(id: string): Promise<void> {
        return localStore.deletePayslip(id);
    }

    async getAllLeaveRecords(): Promise<LeaveRecord[]> {
        return localStore.getAllLeaveRecords();
    }
    async getLeaveForEmployee(employeeId: string): Promise<LeaveRecord[]> {
        return localStore.getLeaveForEmployee(employeeId);
    }
    async saveLeaveRecord(record: LeaveRecord): Promise<void> {
        return localStore.saveLeaveRecord(record);
    }
    async deleteLeaveRecord(id: string): Promise<void> {
        return localStore.deleteLeaveRecord(id);
    }

    async getLeaveCarryOversForEmployee(employeeId: string): Promise<LeaveCarryOver[]> {
        return localStore.getLeaveCarryOversForEmployee(employeeId);
    }

    async getPayPeriods(): Promise<PayPeriod[]> {
        return localStore.getPayPeriods();
    }
    async getPayPeriod(id: string): Promise<PayPeriod | null> {
        return localStore.getPayPeriod(id);
    }
    async savePayPeriod(period: PayPeriod): Promise<void> {
        return localStore.savePayPeriod(period);
    }
    async deletePayPeriod(id: string): Promise<void> {
        return localStore.deletePayPeriod(id);
    }

    async getDocuments(): Promise<DocumentMeta[]> {
        return localStore.getDocuments();
    }
    async getDocumentMeta(id: string): Promise<DocumentMeta | null> {
        return localStore.getDocumentMeta(id);
    }
    async saveDocumentMeta(doc: DocumentMeta): Promise<void> {
        return localStore.saveDocumentMeta(doc);
    }
    async deleteDocumentMeta(id: string): Promise<void> {
        return localStore.deleteDocumentMeta(id);
    }

    async getContracts(): Promise<Contract[]> {
        return localStore.getContracts();
    }
    async getContractsForEmployee(employeeId: string): Promise<Contract[]> {
        return localStore.getContractsForEmployee(employeeId);
    }
    async saveContract(contract: Contract): Promise<void> {
        return localStore.saveContract(contract);
    }
    async deleteContract(id: string): Promise<void> {
        return localStore.deleteContract(id);
    }

    async getAuditLogs(): Promise<AuditLog[]> {
        return localStore.getAuditLogs();
    }
    async logAuditEvent(action: string, details: string, metadata?: Record<string, unknown>): Promise<void> {
        return localStore.logAuditEvent(action as AuditLog["action"], details, metadata);
    }

    async saveDocumentFile(id: string, file: Blob): Promise<void> {
        return localStore.saveDocumentFile(id, file);
    }
    async getDocumentFile(id: string): Promise<Blob | null> {
        return localStore.getDocumentFile(id);
    }

    async resetAllData(): Promise<void> {
        return localStore.resetAllData();
    }

    async sync(): Promise<void> {
        // No-op for local repository
    }
}
