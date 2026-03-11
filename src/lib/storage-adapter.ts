import type {
    Employee,
    PayslipInput,
    LeaveRecord,
    LeaveCarryOver,
    EmployerSettings,
    Household,
    PayPeriod,
    DocumentMeta,
    Contract,
    AuditLog,
} from "./schema";

/**
 * Unified interface for accessing application data.
 */
export interface StorageAdapter {
    getHouseholds(): Promise<Household[]>;
    saveHousehold(household: Household): Promise<void>;

    getSettings(): Promise<EmployerSettings>;
    saveSettings(settings: EmployerSettings): Promise<void>;

    getEmployees(): Promise<Employee[]>;
    getEmployee(id: string): Promise<Employee | null>;
    saveEmployee(employee: Employee): Promise<void>;
    deleteEmployee(id: string): Promise<void>;

    getAllPayslips(): Promise<PayslipInput[]>;
    getPayslipsForEmployee(employeeId: string): Promise<PayslipInput[]>;
    getLatestPayslip(employeeId: string): Promise<PayslipInput | null>;
    savePayslip(payslip: PayslipInput): Promise<void>;
    deletePayslip(id: string): Promise<void>;

    getAllLeaveRecords(): Promise<LeaveRecord[]>;
    getLeaveForEmployee(employeeId: string): Promise<LeaveRecord[]>;
    saveLeaveRecord(record: LeaveRecord): Promise<void>;
    deleteLeaveRecord(id: string): Promise<void>;

    getLeaveCarryOversForEmployee(employeeId: string): Promise<LeaveCarryOver[]>;

    getPayPeriods(): Promise<PayPeriod[]>;
    getPayPeriod(id: string): Promise<PayPeriod | null>;
    savePayPeriod(period: PayPeriod): Promise<void>;
    deletePayPeriod(id: string): Promise<void>;

    getDocuments(): Promise<DocumentMeta[]>;
    getDocumentMeta(id: string): Promise<DocumentMeta | null>;
    saveDocumentMeta(doc: DocumentMeta): Promise<void>;
    deleteDocumentMeta(id: string): Promise<void>;

    getContracts(): Promise<Contract[]>;
    getContractsForEmployee(employeeId: string): Promise<Contract[]>;
    saveContract(contract: Contract): Promise<void>;
    deleteContract(id: string): Promise<void>;

    getAuditLogs(): Promise<AuditLog[]>;
    logAuditEvent(action: string, details: string, metadata?: Record<string, unknown>): Promise<void>;

    saveDocumentFile(id: string, file: Blob): Promise<void>;
    getDocumentFile(id: string): Promise<Blob | null>;
    
    resetAllData(): Promise<void>;
    sync(): Promise<void>;
}
