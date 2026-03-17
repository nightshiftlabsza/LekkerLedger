import localforage from "localforage";
import { z } from "zod";
import {
    Employee,
    EmployeeSchema,
    PayslipInput,
    PayslipInputSchema,
    CustomLeaveType,
    LeaveRecord,
    LeaveCarryOver,
    LeaveCarryOverSchema,
    LeaveRecordSchema,
    EmployerSettings,
    EmployerSettingsSchema,
    PayPeriod,
    PayPeriodSchema,
    DocumentMeta,
    DocumentMetaSchema,
    Contract,
    ContractSchema,
    AuditLog,
    Household,
    HouseholdSchema,
} from "./schema";

import { normalizeEmployeeIdNumber } from "./employee-id";
import { EMPLOYER_DETAILS_REQUIRED_ERROR, hasRequiredEmployerDetails } from "./employer-details";
import { calculateAnnualLeaveSummary, getLeaveTypeLabel } from "./leave";
import { syncService } from "./sync-service";
import { clearAllLocalRecoveryProfiles } from "./recovery-profile-store";

const employeeStore = localforage.createInstance({ name: "LekkerLedger", storeName: "employees" });
const payslipStore = localforage.createInstance({ name: "LekkerLedger", storeName: "payslips" });
const leaveStore = localforage.createInstance({ name: "LekkerLedger", storeName: "leave" });
const leaveCarryOverStore = localforage.createInstance({ name: "LekkerLedger", storeName: "leave_carry_over" });
const settingsStore = localforage.createInstance({ name: "LekkerLedger", storeName: "settings" });
const auditStore = localforage.createInstance({ name: "LekkerLedger", storeName: "audit_logs" });
const payPeriodStore = localforage.createInstance({ name: "LekkerLedger", storeName: "pay_periods" });
const documentStore = localforage.createInstance({ name: "LekkerLedger", storeName: "documents" });
const documentFileStore = localforage.createInstance({ name: "LekkerLedger", storeName: "document_files" });
const contractStore = localforage.createInstance({ name: "LekkerLedger", storeName: "contracts" });
const householdStore = localforage.createInstance({ name: "LekkerLedger", storeName: "households" });

export interface LocalBackupPreview {
    employeeCount: number;
    payslipCount: number;
    leaveCount: number;
    documentCount: number;
    contractCount: number;
}

export interface SyncMigrationSnapshot {
    settings: EmployerSettings;
    households: Household[];
    employees: Employee[];
    payslips: PayslipInput[];
    leaveRecords: LeaveRecord[];
    payPeriods: PayPeriod[];
    documents: DocumentMeta[];
    contracts: Contract[];
    documentFiles: Array<{
        id: string;
        blob: Blob;
        mimeType: string;
        accessScope: "paid" | "contracts" | "vault";
    }>;
}

export const DEFAULT_HOUSEHOLD_ID = "default";
const DEFAULT_HOUSEHOLD_NAME = "Main household";
const BACKUP_SCHEMA_VERSION = "2.4";
const HOUSEHOLD_SETTINGS_KEY_PREFIX = "employer-settings::";

const HouseholdScopedSettingsSchema = EmployerSettingsSchema.pick({
    employerName: true,
    employerAddress: true,
    employerIdNumber: true,
    uifRefNumber: true,
    cfNumber: true,
    sdlNumber: true,
    phone: true,
    logoData: true,
    customLeaveTypes: true,
}).partial();

type HouseholdScopedSettings = z.infer<typeof HouseholdScopedSettingsSchema>;

const BackupHouseholdSettingsSchema = z.object({
    householdId: z.string(),
    settings: HouseholdScopedSettingsSchema.default({}),
});

const BackupUploadedDocumentSchema = z.object({
    id: z.string(),
    mimeType: z.string(),
    base64: z.string(),
});

const BackupPayloadSchema = z.object({
    version: z.union([z.string(), z.number()]).optional(),
    timestamp: z.string().optional(),
    households: z.array(HouseholdSchema).default([]),
    householdSettings: z.array(BackupHouseholdSettingsSchema).default([]),
    employees: z.array(EmployeeSchema).default([]),
    payslips: z.array(PayslipInputSchema).default([]),
    leave: z.array(LeaveRecordSchema).default([]),
    leaveCarryOvers: z.array(LeaveCarryOverSchema).default([]),
    documents: z.array(DocumentMetaSchema).default([]),
    contracts: z.array(ContractSchema).default([]),
    uploadedDocuments: z.array(BackupUploadedDocumentSchema).default([]),
    settings: EmployerSettingsSchema.partial().default({}),
});

async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            if (!result) return resolve("");
            const parts = result.split(",");
            resolve(parts[1] || "");
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.codePointAt(0) ?? 0);
    return new Blob([bytes], { type: mimeType });
}

function normalizeLegacyPlanId(status: EmployerSettings["proStatus"] | undefined): EmployerSettings["proStatus"] {
    if (status === "annual") return "standard";
    if (status === "lifetime") return "pro";
    return status ?? "free";
}

function buildDefaultSettings(overrides: Partial<EmployerSettings> = {}): EmployerSettings {
    const normalizedPlanId = normalizeLegacyPlanId(overrides.proStatus);
    const inferredBillingCycle = overrides.billingCycle
        ?? (() => {
            if (overrides.proStatus === "annual" || overrides.proStatus === "lifetime") {
                return "yearly";
            }
            return "monthly";
        })();

    return {
        employerName: "",
        employerAddress: "",
        employerIdNumber: "",
        uifRefNumber: "",
        cfNumber: "",
        sdlNumber: "",
        phone: "",
        logoData: "",
        paidUntil: undefined,
        defaultLanguage: "en",
        density: "comfortable",
        standardRetentionNoticeDismissedAt: undefined,
        paidDashboardFeedbackNoticeDismissedAt: undefined,

        piiObfuscationEnabled: true,
        installationId: "",
        ...overrides,
        // Array fields must survive stale IndexedDB data that may have undefined/null.
        proStatus: normalizedPlanId,
        billingCycle: inferredBillingCycle,
        activeHouseholdId: overrides.activeHouseholdId ?? DEFAULT_HOUSEHOLD_ID,
        // Ensure array fields are always arrays even if stale data has undefined/null
        usageHistory: Array.isArray(overrides.usageHistory) ? overrides.usageHistory : [],
        customLeaveTypes: Array.isArray(overrides.customLeaveTypes) ? overrides.customLeaveTypes : [],
    };
}

export function buildDefaultHousehold(): Household {
    return {
        id: DEFAULT_HOUSEHOLD_ID,
        name: DEFAULT_HOUSEHOLD_NAME,
        createdAt: new Date(0).toISOString(),
    };
}

function getHouseholdSettingsKey(householdId: string): string {
    return `${HOUSEHOLD_SETTINGS_KEY_PREFIX}${householdId}`;
}

function getEmptyHouseholdScopedSettings(): HouseholdScopedSettings {
    return {
        employerName: "",
        employerAddress: "",
        employerIdNumber: "",
        uifRefNumber: "",
        cfNumber: "",
        sdlNumber: "",
        phone: "",
        logoData: "",
        customLeaveTypes: [],
    };
}

function extractHouseholdScopedSettings(settings: Partial<EmployerSettings> = {}): HouseholdScopedSettings {
    return {
        employerName: settings.employerName ?? "",
        employerAddress: settings.employerAddress ?? "",
        employerIdNumber: settings.employerIdNumber ?? "",
        uifRefNumber: settings.uifRefNumber ?? "",
        cfNumber: settings.cfNumber ?? "",
        sdlNumber: settings.sdlNumber ?? "",
        phone: settings.phone ?? "",
        logoData: settings.logoData ?? "",
        customLeaveTypes: settings.customLeaveTypes ?? [],
    };
}

function stripHouseholdScopedSettings(settings: Partial<EmployerSettings> = {}): Partial<EmployerSettings> {
    return {
        ...settings,
        ...getEmptyHouseholdScopedSettings(),
    };
}

async function getHouseholdScopedSettings(householdId: string): Promise<HouseholdScopedSettings | null> {
    const raw = await settingsStore.getItem<unknown>(getHouseholdSettingsKey(householdId));
    if (!raw) return null;
    const parsed = HouseholdScopedSettingsSchema.safeParse(raw);
    if (!parsed.success) {
        return getEmptyHouseholdScopedSettings();
    }
    return {
        ...getEmptyHouseholdScopedSettings(),
        ...parsed.data,
    };
}

async function ensureHouseholdScopedSettings(householdId: string, seed: Partial<HouseholdScopedSettings> = {}): Promise<HouseholdScopedSettings> {
    const existing = await getHouseholdScopedSettings(householdId);
    if (existing) return existing;
    const created = {
        ...getEmptyHouseholdScopedSettings(),
        ...seed,
    };
    await settingsStore.setItem(getHouseholdSettingsKey(householdId), created);
    return created;
}

export async function ensureDefaultHousehold(): Promise<void> {
    const existing = await householdStore.getItem<Household>(DEFAULT_HOUSEHOLD_ID);
    if (!existing) {
        await householdStore.setItem(DEFAULT_HOUSEHOLD_ID, buildDefaultHousehold());
    }
}

async function encodeData(data: unknown): Promise<unknown> {
    const settings = await getSettings();
    if (settings.piiObfuscationEnabled === false) return data;
    return btoa(encodeURIComponent(JSON.stringify(data)));
}

function decodeData<T>(value: unknown): T | null {
    if (typeof value !== "string" || !value) return null;
    try {
        const decoded = decodeURIComponent(atob(value));
        return JSON.parse(decoded) as T;
    } catch (error) {
        try {
            return JSON.parse(value as string) as T;
        } catch {
            console.warn("Failed to decode data item.", error);
            return null;
        }
    }
}

type DataChangeListener = () => void | Promise<void>;
const listeners: DataChangeListener[] = [];
const DATA_CHANGE_CHANNEL = "lekkerledger:data-changes";
const DATA_CHANGE_STORAGE_KEY = "lekkerledger:data-change-ping";
let dataChangeBridgeInitialized = false;
let dataChangeChannel: BroadcastChannel | null = null;
let isImporting = false;
let dataChangeBatchDepth = 0;
let pendingBatchedNotification = false;

function logStorageReadError(operation: string, error: unknown) {
    console.error(`Local storage read failed during ${operation}.`, error);
}

async function withStorageReadFallback<T>(operation: string, fallback: T, reader: () => Promise<T>): Promise<T> {
    try {
        return await reader();
    } catch (error) {
        logStorageReadError(operation, error);
        return fallback;
    }
}

function withUpdatedAt<T extends Record<string, unknown>>(value: T): T & { updatedAt: string } {
    return {
        ...value,
        updatedAt: typeof value.updatedAt === "string" && value.updatedAt ? value.updatedAt : new Date().toISOString(),
    };
}

async function syncRecordToCloud(table: string, id: string, data: Record<string, unknown>) {
    if (!syncService.isReady()) return;
    await syncService.pushLocalChange(table, id, data);
}

async function syncRecordDeletionToCloud(table: string, id: string) {
    if (!syncService.isReady()) return;
    await syncService.pushLocalDelete(table, id);
}

async function syncDocumentFileToCloud(id: string, file: Blob, mimeType: string, accessScope: "paid" | "contracts" | "vault" = "paid") {
    if (!syncService.isReady()) return;
    await syncService.pushLocalFile(id, file, mimeType, accessScope);
}

async function syncDocumentFileDeletionToCloud(id: string) {
    if (!syncService.isReady()) return;
    await syncService.pushLocalFileDelete(id);
}

export function subscribeToDataChanges(callback: DataChangeListener) {
    ensureDataChangeBridge();
    listeners.push(callback);
    return () => {
        const index = listeners.indexOf(callback);
        if (index > -1) listeners.splice(index, 1);
    };
}

function ensureDataChangeBridge() {
    if (dataChangeBridgeInitialized || typeof window === "undefined") return;
    dataChangeBridgeInitialized = true;
    if (typeof BroadcastChannel !== "undefined") {
        dataChangeChannel = new BroadcastChannel(DATA_CHANGE_CHANNEL);
        dataChangeChannel.addEventListener("message", () => {
            void notifyListeners({ broadcast: false });
        });
        return;
    }
    window.addEventListener("storage", (event) => {
        if (event.key !== DATA_CHANGE_STORAGE_KEY || event.newValue === event.oldValue) return;
        void notifyListeners({ broadcast: false });
    });
}

function broadcastDataChange() {
    if (typeof window === "undefined") return;
    try {
        if (dataChangeChannel) {
            dataChangeChannel.postMessage({ at: Date.now() });
            return;
        }
    } catch {}
    try {
        window.localStorage.setItem(DATA_CHANGE_STORAGE_KEY, String(Date.now()));
    } catch {}
}

async function flushDataChangeNotification(options: { broadcast?: boolean } = {}) {
    if (isImporting) return;
    const activeListeners = [...listeners];
    await Promise.allSettled(activeListeners.map(async (listener) => {
        try {
            await listener();
        } catch (error) {
            console.error("Data change listener failed", error);
        }
    }));
    if (options.broadcast !== false) broadcastDataChange();
}

async function notifyListeners(options: { broadcast?: boolean } = {}) {
    if (dataChangeBatchDepth > 0) {
        pendingBatchedNotification = true;
        return;
    }

    await flushDataChangeNotification(options);
}

export function setImportingMode(value: boolean) {
    isImporting = value;
}

export async function runWithBatchedDataChanges<T>(operation: () => Promise<T>): Promise<T> {
    dataChangeBatchDepth += 1;

    try {
        return await operation();
    } finally {
        dataChangeBatchDepth = Math.max(0, dataChangeBatchDepth - 1);

        if (dataChangeBatchDepth === 0 && pendingBatchedNotification) {
            pendingBatchedNotification = false;
            await flushDataChangeNotification();
        }
    }
}

export async function getHouseholds(): Promise<Household[]> {
    return withStorageReadFallback("getHouseholds", [buildDefaultHousehold()], async () => {
        await ensureDefaultHousehold();
        const households: Household[] = [];
        await householdStore.iterate<unknown, void>((value: unknown) => {
            const parsed = HouseholdSchema.safeParse(value);
            if (parsed.success) households.push(parsed.data);
        });
        return households.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    });
}

export async function saveHousehold(household: Household): Promise<void> {
    const normalized = withUpdatedAt(household);
    await householdStore.setItem(normalized.id, normalized);
    await ensureHouseholdScopedSettings(normalized.id);
    await syncRecordToCloud("households", normalized.id, normalized);
    await logAuditEvent("SWITCH_HOUSEHOLD", `Saved household: ${normalized.name}`, { householdId: normalized.id });
    await notifyListeners();
}

export async function getActiveHouseholdId(): Promise<string> {
    const settings = await getSettings();
    return settings.activeHouseholdId || DEFAULT_HOUSEHOLD_ID;
}

const SETTINGS_KEY = "employer-settings";

export async function setActiveHouseholdId(householdId: string): Promise<void> {
    await ensureDefaultHousehold();
    const exists = await householdStore.getItem(householdId);
    if (!exists) throw new Error("Household not found.");
    const rawSettings = await settingsStore.getItem<EmployerSettings>(SETTINGS_KEY);
    const globalSettings = buildDefaultSettings({
        ...stripHouseholdScopedSettings(rawSettings ?? {}),
        activeHouseholdId: householdId,
    });
    await settingsStore.setItem(SETTINGS_KEY, globalSettings);
    await ensureHouseholdScopedSettings(householdId);
    await logAuditEvent("SWITCH_HOUSEHOLD", "Changed active household", { householdId });
    await notifyListeners();
}

export async function getEmployees(): Promise<Employee[]> {
    return withStorageReadFallback("getEmployees", [], async () => {
        const activeHouseholdId = await getActiveHouseholdId();
        const employees: Employee[] = [];
        await employeeStore.iterate<unknown, void>((value: unknown) => {
            if (!value) return;
            const decoded = decodeData<Employee>(value);
            if (decoded && (decoded.householdId || DEFAULT_HOUSEHOLD_ID) === activeHouseholdId) {
                employees.push(decoded);
            }
        });
        return employees.sort((a, b) => a.name.localeCompare(b.name));
    });
}

export async function getEmployee(id: string): Promise<Employee | null> {
    return withStorageReadFallback("getEmployee", null, async () => {
        const value = await employeeStore.getItem<unknown>(id);
        return value ? decodeData<Employee>(value) : null;
    });
}

export async function saveEmployee(employee: Employee): Promise<void> {
    const activeHouseholdId = await getActiveHouseholdId();
    const normalized = withUpdatedAt({
        ...employee,
        householdId: employee.householdId || activeHouseholdId,
        name: employee.name.trim(),
        idNumber: normalizeEmployeeIdNumber(employee.idNumber ?? ""),
        phone: employee.phone?.trim() ?? "",
    }) as Employee;
    if (normalized.idNumber) {
        const employees = await getEmployees();
        const duplicate = employees.find((existing) =>
            existing.id !== normalized.id &&
            normalizeEmployeeIdNumber(existing.idNumber ?? "") === normalized.idNumber
        );
        if (duplicate) throw new Error(`An employee with ID number ${normalized.idNumber} already exists.`);
    }
    await employeeStore.setItem(normalized.id, await encodeData(normalized));
    await syncRecordToCloud("employees", normalized.id, normalized as unknown as Record<string, unknown>);
    await logAuditEvent("CREATE_EMPLOYEE", `Saved employee: ${normalized.name}`, {
        employeeId: normalized.id,
        householdId: normalized.householdId,
    });
    await notifyListeners();
}

export async function deleteEmployee(id: string): Promise<void> {
    const employee = await getEmployee(id);
    await Promise.all([
        employeeStore.removeItem(id),
        (async () => {
             const keysToDelete: string[] = [];
             await payslipStore.iterate<unknown, void>((value: unknown, key: string) => {
                 const decoded = decodeData<PayslipInput>(value);
                 if (decoded?.employeeId === id) keysToDelete.push(key);
             });
             await Promise.all(keysToDelete.map(k => payslipStore.removeItem(k)));
        })(),
        (async () => {
             const keysToDelete: string[] = [];
             await leaveStore.iterate<unknown, void>((value: unknown, key: string) => {
                 const decoded = decodeData<LeaveRecord>(value);
                 if (decoded?.employeeId === id) keysToDelete.push(key);
             });
             await Promise.all(keysToDelete.map(k => leaveStore.removeItem(k)));
        })()
    ]);
    await logAuditEvent("DELETE_EMPLOYEE", `Deleted employee: ${employee?.name || id}`, {
        employeeId: employee?.id || id,
    });
    await syncRecordDeletionToCloud("employees", id);
    await notifyListeners();
}

export async function savePayslip(payslip: PayslipInput): Promise<void> {
    const activeHouseholdId = await getActiveHouseholdId();
    const settings = await getSettings();
    if (!hasRequiredEmployerDetails(settings)) throw new Error(EMPLOYER_DETAILS_REQUIRED_ERROR);
    const normalized = withUpdatedAt({
        ...payslip,
        householdId: payslip.householdId || activeHouseholdId,
    }) as PayslipInput;
    const existingPayslips = await getAllPayslips();
    const duplicate = existingPayslips.find((existing) =>
        existing.id !== normalized.id
        && existing.employeeId === normalized.employeeId
        && new Date(existing.payPeriodStart).getTime() === new Date(normalized.payPeriodStart).getTime()
        && new Date(existing.payPeriodEnd).getTime() === new Date(normalized.payPeriodEnd).getTime()
    );
    if (duplicate) {
        throw new Error("A payslip for this employee and pay period already exists.");
    }
    await payslipStore.setItem(normalized.id, await encodeData(normalized));
    await syncRecordToCloud("payslips", normalized.id, normalized as unknown as Record<string, unknown>);
    await logAuditEvent("CREATE_PAYSLIP", `Generated payslip for employee ID: ${normalized.employeeId}`, {
        payslipId: normalized.id,
        employeeId: normalized.employeeId,
    });
    await notifyListeners();
}

export async function getAllPayslips(): Promise<PayslipInput[]> {
    return withStorageReadFallback("getAllPayslips", [], async () => {
        const activeHouseholdId = await getActiveHouseholdId();
        const activeEmployeeIds = new Set((await getEmployees()).map((e) => e.id));
        const payslips: PayslipInput[] = [];
        await payslipStore.iterate<unknown, void>((value: unknown) => {
            if (!value) return;
            const decoded = decodeData<PayslipInput>(value);
            if (decoded && ((decoded.householdId || DEFAULT_HOUSEHOLD_ID) === activeHouseholdId || activeEmployeeIds.has(decoded.employeeId))) {
                payslips.push(decoded);
            }
        });
        return payslips.sort((a, b) => new Date(b.payPeriodEnd).getTime() - new Date(a.payPeriodEnd).getTime());
    });
}

export async function deletePayslip(id: string): Promise<void> {
    await payslipStore.removeItem(id);
    await logAuditEvent("DELETE_PAYSLIP", `Deleted payslip ID: ${id}`, { payslipId: id });
    await syncRecordDeletionToCloud("payslips", id);
    await notifyListeners();
}

async function getLeaveForEmployeeRaw(employeeId: string): Promise<LeaveRecord[]> {
    const records: LeaveRecord[] = [];
    await leaveStore.iterate<unknown, void>((value: unknown) => {
        const decoded = decodeData<LeaveRecord>(value);
        if (decoded?.employeeId === employeeId) records.push(decoded);
    });
    return records.sort((a, b) => new Date(b.startDate || b.date).getTime() - new Date(a.startDate || a.date).getTime());
}

async function getLeaveCarryOversForEmployeeRaw(employeeId: string): Promise<LeaveCarryOver[]> {
    const carryOvers: LeaveCarryOver[] = [];
    await leaveCarryOverStore.iterate<unknown, void>((value: unknown) => {
        const parsed = LeaveCarryOverSchema.safeParse(value);
        if (parsed.success && parsed.data.employeeId === employeeId) carryOvers.push(parsed.data);
    });
    return carryOvers.sort((a, b) => new Date(a.fromCycleEnd).getTime() - new Date(b.fromCycleEnd).getTime());
}

function normaliseCustomLeaveTypes(customLeaveTypes: CustomLeaveType[]): CustomLeaveType[] {
    return customLeaveTypes.map((type) => ({
        ...type,
        name: type.name.trim(),
        note: type.note?.trim() ?? "",
    }));
}

function applyLeaveTypeMetadata(record: LeaveRecord, customLeaveTypes: CustomLeaveType[]): LeaveRecord {
    const label = getLeaveTypeLabel(record.type, customLeaveTypes, record.typeLabel);
    const customType = customLeaveTypes.find((item) => item.id === record.type);
    return {
        ...record,
        typeLabel: label,
        isCustomType: !!customType,
        paid: customType ? customType.isPaid : record.paid,
    };
}

async function synchronizeEmployeeLeaveLedger(employeeId: string, providedCustomLeaveTypes?: CustomLeaveType[]): Promise<void> {
    const [employee, records, contracts, settings, existingCarryOvers] = await Promise.all([
        getEmployee(employeeId),
        getLeaveForEmployeeRaw(employeeId),
        getContractsForEmployee(employeeId),
        providedCustomLeaveTypes ? Promise.resolve(null) : getSettings(),
        getLeaveCarryOversForEmployeeRaw(employeeId),
    ]);
    if (!employee) return;
    const customLeaveTypes = normaliseCustomLeaveTypes(providedCustomLeaveTypes ?? settings?.customLeaveTypes ?? []);
    const updatedRecords = records.map((record) => applyLeaveTypeMetadata(record, customLeaveTypes));
    const summary = calculateAnnualLeaveSummary(employee, updatedRecords, contracts, new Date());
    const syncedRecords = summary.updatedRecords.map((record) => ({
        ...applyLeaveTypeMetadata(record, customLeaveTypes),
        householdId: record.householdId || employee.householdId || DEFAULT_HOUSEHOLD_ID,
    }));
    await Promise.all(syncedRecords.map(async (record) => {
        await leaveStore.setItem(record.id, await encodeData(record));
    }));
    const existingIds = new Set(existingCarryOvers.map((c) => c.id));
    for (const carryOver of summary.carryOvers) {
        const id = `${employeeId}:${carryOver.fromCycleEnd}`;
        const normalized = { ...carryOver, id, householdId: employee.householdId || DEFAULT_HOUSEHOLD_ID, employeeId };
        existingIds.delete(id);
        await leaveCarryOverStore.setItem(id, normalized);
    }
    await Promise.all(Array.from(existingIds).map(id => leaveCarryOverStore.removeItem(id)));
}

export async function saveLeaveRecord(record: LeaveRecord): Promise<void> {
    const activeHouseholdId = await getActiveHouseholdId();
    const settings = await getSettings();
    const customLeaveTypes = normaliseCustomLeaveTypes(settings.customLeaveTypes ?? []);
    const normalized = withUpdatedAt({
        ...applyLeaveTypeMetadata(record, customLeaveTypes),
        householdId: record.householdId || activeHouseholdId,
    }) as LeaveRecord;
    await leaveStore.setItem(normalized.id, await encodeData(normalized));
    await synchronizeEmployeeLeaveLedger(normalized.employeeId, customLeaveTypes);
    await syncRecordToCloud("leave", normalized.id, normalized as unknown as Record<string, unknown>);
    await logAuditEvent("CREATE_LEAVE_RECORD", `Saved leave record for employee ${normalized.employeeId}`, {
        leaveId: normalized.id,
    });
    await notifyListeners();
}

export async function deleteLeaveRecord(id: string): Promise<void> {
    const existing = await leaveStore.getItem<unknown>(id);
    const record = existing ? decodeData<LeaveRecord>(existing) : null;
    await leaveStore.removeItem(id);
    if (record?.employeeId) await synchronizeEmployeeLeaveLedger(record.employeeId);
    await logAuditEvent("DELETE_LEAVE_RECORD", `Deleted leave record ID: ${id}`, { leaveId: id });
    await syncRecordDeletionToCloud("leave", id);
    await notifyListeners();
}

export async function getLeaveForEmployee(employeeId: string): Promise<LeaveRecord[]> {
    await synchronizeEmployeeLeaveLedger(employeeId);
    return getLeaveForEmployeeRaw(employeeId);
}

export async function getAllLeaveRecords(): Promise<LeaveRecord[]> {
    const activeHouseholdId = await getActiveHouseholdId();
    const activeEmployeeIds = new Set((await getEmployees()).map((e) => e.id));
    const settings = await getSettings();
    const customLeaveTypes = normaliseCustomLeaveTypes(settings.customLeaveTypes ?? []);
    await Promise.all(Array.from(activeEmployeeIds).map(eid => synchronizeEmployeeLeaveLedger(eid, customLeaveTypes)));
    const records: LeaveRecord[] = [];
    await leaveStore.iterate<unknown, void>((value: unknown) => {
        const decoded = decodeData<LeaveRecord>(value);
        if (decoded && ((decoded.householdId || DEFAULT_HOUSEHOLD_ID) === activeHouseholdId || activeEmployeeIds.has(decoded.employeeId))) records.push(decoded);
    });
    return records;
}

export async function getLeaveCarryOversForEmployee(employeeId: string): Promise<LeaveCarryOver[]> {
    await synchronizeEmployeeLeaveLedger(employeeId);
    return getLeaveCarryOversForEmployeeRaw(employeeId);
}

export async function getSettings(): Promise<EmployerSettings> {
    try {
        const raw = await settingsStore.getItem<EmployerSettings>(SETTINGS_KEY);
        const globalSettings = buildDefaultSettings(raw ?? {});
        const scopedSettings = await getHouseholdScopedSettings(globalSettings.activeHouseholdId || DEFAULT_HOUSEHOLD_ID);
        return {
            ...globalSettings,
            ...scopedSettings,
        };
    } catch (error) {
        logStorageReadError("getSettings", error);
        return buildDefaultSettings();
    }
}

export async function saveSettings(settings: EmployerSettings): Promise<void> {
    const currentSettings = await settingsStore.getItem<EmployerSettings>(SETTINGS_KEY);
    const globalSettings = buildDefaultSettings({
        ...stripHouseholdScopedSettings(currentSettings ?? {}),
        ...stripHouseholdScopedSettings(settings),
        paidUntil: settings.paidUntil ?? currentSettings?.paidUntil,
        proStatus: settings.proStatus ?? currentSettings?.proStatus,
        billingCycle: settings.billingCycle ?? currentSettings?.billingCycle,
        standardRetentionNoticeDismissedAt: settings.standardRetentionNoticeDismissedAt ?? currentSettings?.standardRetentionNoticeDismissedAt,
        paidDashboardFeedbackNoticeDismissedAt: settings.paidDashboardFeedbackNoticeDismissedAt ?? currentSettings?.paidDashboardFeedbackNoticeDismissedAt,
    });
    await settingsStore.setItem(SETTINGS_KEY, globalSettings);
    const activeHouseholdId = await getActiveHouseholdId();
    const scopedSettings = extractHouseholdScopedSettings(settings);
    await settingsStore.setItem(getHouseholdSettingsKey(activeHouseholdId), scopedSettings);
    await logAuditEvent("UPDATE_SETTINGS", "Updated employer settings");
    await notifyListeners();
}

export async function getContracts(): Promise<Contract[]> {
    return withStorageReadFallback("getContracts", [], async () => {
        const activeHouseholdId = await getActiveHouseholdId();
        const activeEmployeeIds = new Set((await getEmployees()).map((e) => e.id));
        const contracts: Contract[] = [];
        await contractStore.iterate<unknown, void>((value: unknown) => {
            const parsed = ContractSchema.safeParse(value);
            if (parsed.success && ((parsed.data.householdId || DEFAULT_HOUSEHOLD_ID) === activeHouseholdId || activeEmployeeIds.has(parsed.data.employeeId))) contracts.push(parsed.data);
        });
        return contracts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
}

export async function getContractsForEmployee(employeeId: string): Promise<Contract[]> {
    return withStorageReadFallback("getContractsForEmployee", [], async () => {
        const contracts: Contract[] = [];
        await contractStore.iterate<unknown, void>((value: unknown) => {
            const parsed = ContractSchema.safeParse(value);
            if (parsed.success && parsed.data.employeeId === employeeId) contracts.push(parsed.data);
        });
        return contracts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
}

export async function saveContract(contract: Contract): Promise<void> {
    const activeHouseholdId = await getActiveHouseholdId();
    const normalized = withUpdatedAt({ ...contract, householdId: contract.householdId || activeHouseholdId }) as Contract;
    await contractStore.setItem(normalized.id, normalized);
    await syncRecordToCloud("contracts", normalized.id, normalized as unknown as Record<string, unknown>);
    await logAuditEvent("UPDATE_CONTRACT", `Saved contract for employee ${normalized.employeeId}`, { contractId: normalized.id });
    await notifyListeners();
}

export async function deleteContract(id: string): Promise<void> {
    await contractStore.removeItem(id);
    await logAuditEvent("UPDATE_CONTRACT", `Deleted contract ID: ${id}`, { contractId: id });
    await syncRecordDeletionToCloud("contracts", id);
    await notifyListeners();
}

export async function getDocuments(): Promise<DocumentMeta[]> {
    return withStorageReadFallback("getDocuments", [], async () => {
        const activeHouseholdId = await getActiveHouseholdId();
        const activeEmployeeIds = new Set((await getEmployees()).map((e) => e.id));
        const docs: DocumentMeta[] = [];
        await documentStore.iterate<unknown, void>((value: unknown) => {
            const parsed = DocumentMetaSchema.safeParse(value);
            if (parsed.success && ((parsed.data.householdId || DEFAULT_HOUSEHOLD_ID) === activeHouseholdId || (parsed.data.employeeId && activeEmployeeIds.has(parsed.data.employeeId)))) docs.push(parsed.data);
        });
        return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
}

export async function getDocumentMeta(id: string): Promise<DocumentMeta | null> {
    const raw = await documentStore.getItem<unknown>(id);
    const parsed = DocumentMetaSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
}

export async function saveDocumentMeta(meta: DocumentMeta): Promise<void> {
    const activeHouseholdId = await getActiveHouseholdId();
    const normalized = withUpdatedAt({ ...meta, householdId: meta.householdId || activeHouseholdId }) as DocumentMeta;
    await documentStore.setItem(normalized.id, normalized);
    await syncRecordToCloud("documents", normalized.id, normalized as unknown as Record<string, unknown>);
    await notifyListeners();
}

export async function saveDocumentFile(id: string, fileBlob: Blob, accessScope: "paid" | "contracts" | "vault" = "paid"): Promise<void> {
    await documentFileStore.setItem(id, fileBlob);
    const meta = await getDocumentMeta(id);
    if (meta) {
        await syncDocumentFileToCloud(id, fileBlob, meta.mimeType || "application/octet-stream", accessScope);
    }
}

export async function deleteDocumentMeta(id: string): Promise<void> {
    await documentStore.removeItem(id);
    await documentFileStore.removeItem(id);
    await syncRecordDeletionToCloud("documents", id);
    await syncDocumentFileDeletionToCloud(id);
    await notifyListeners();
}

export async function getDocumentFile(id: string): Promise<Blob | null> {
    const blob = await documentFileStore.getItem<Blob>(id);
    if (blob) return blob;
    return null;
}

export async function getAuditLogs(): Promise<AuditLog[]> {
    return withStorageReadFallback("getAuditLogs", [], async () => {
        const logs: AuditLog[] = [];
        await auditStore.iterate<AuditLog, void>((value: AuditLog) => {
            logs.push(value);
        });
        return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 1000);
    });
}

export async function logAuditEvent(action: AuditLog["action"], details: string, metadata: Record<string, unknown> = {}): Promise<void> {
    const log: AuditLog = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        action,
        details,
        metadata,
    };
    await auditStore.setItem(log.id, log);
}

/**
 * Ensures a PayPeriod read from IndexedDB always has a valid `entries` array.
 * Stale data from older builds may lack this field, causing crashes on `.filter()` / `.map()`.
 */
function normalizePayPeriod(raw: PayPeriod): PayPeriod {
    return {
        ...raw,
        entries: Array.isArray(raw.entries) ? raw.entries : [],
    };
}

function parsePayPeriodRecord(value: unknown): PayPeriod | null {
    if (!value) {
        return null;
    }

    const decoded = typeof value === "string" ? decodeData<PayPeriod>(value) : value;
    if (!decoded) {
        return null;
    }

    const parsed = PayPeriodSchema.safeParse(decoded);
    if (!parsed.success) {
        return null;
    }

    return normalizePayPeriod(parsed.data);
}

export async function getPayPeriods(): Promise<PayPeriod[]> {
    return withStorageReadFallback("getPayPeriods", [], async () => {
        const periods: PayPeriod[] = [];
        await payPeriodStore.iterate<unknown, void>((value: unknown) => {
            const parsed = parsePayPeriodRecord(value);
            if (parsed) {
                periods.push(parsed);
            }
        });
        return periods.sort((a, b) => b.endDate.localeCompare(a.endDate));
    });
}

export async function savePayPeriod(period: PayPeriod): Promise<void> {
    await payPeriodStore.setItem(period.id, period);
    await notifyListeners();
}

export async function deletePayPeriod(id: string): Promise<void> {
    await payPeriodStore.removeItem(id);
    await logAuditEvent("DELETE_PAY_PERIOD", `Deleted pay period: ${id}`);
    await notifyListeners();
}

export async function hasMeaningfulLocalData(): Promise<boolean> {
    const employees = await getEmployees();
    if (employees.length > 0) return true;
    const households = await getHouseholds();
    if (households.length > 1) return true;
    return false;
}

export async function getLocalBackupPreview(): Promise<LocalBackupPreview> {
    const [employees, payslips, leaveRecords, documents, contracts] = await Promise.all([
        getEmployees(),
        getAllPayslips(),
        getAllLeaveRecords(),
        getDocuments(),
        getContracts(),
    ]);

    return {
        employeeCount: employees.length,
        payslipCount: payslips.length,
        leaveCount: leaveRecords.length,
        documentCount: documents.length,
        contractCount: contracts.length,
    };
}

export async function exportLocalDataAsBackup(_options?: { generatedRecordsSince?: Date | null }): Promise<string> {
    const [settings, households, employees, payslips, leave, documents, contracts] = await Promise.all([
        getSettings(), getHouseholds(), getEmployees(), getAllPayslips(), getAllLeaveRecords(), getDocuments(), getContracts(),
    ]);
    const leaveCarryOvers: LeaveCarryOver[] = [];
    for (const em of employees) {
        leaveCarryOvers.push(...(await getLeaveCarryOversForEmployeeRaw(em.id)));
    }
    const householdSettings: Array<{ householdId: string; settings: HouseholdScopedSettings }> = [];
    for (const hh of households) {
        const s = await getHouseholdScopedSettings(hh.id);
        if (s) householdSettings.push({ householdId: hh.id, settings: s });
    }
    const uploadedDocuments: Array<{ id: string; mimeType: string; base64: string }> = [];
    for (const doc of documents) {
        const blob = await getDocumentFile(doc.id);
        if (blob) uploadedDocuments.push({ id: doc.id, mimeType: doc.mimeType || "application/octet-stream", base64: await blobToBase64(blob) });
    }
    const payload = { version: BACKUP_SCHEMA_VERSION, timestamp: new Date().toISOString(), settings, households, householdSettings, employees, payslips, leave, leaveCarryOvers, documents, contracts, uploadedDocuments };
    return JSON.stringify(payload, null, 2);
}

export async function importDataFromBackup(json: string): Promise<{ success: boolean; error?: string }> {
    setImportingMode(true);
    try {
        const payload = BackupPayloadSchema.parse(JSON.parse(json));
        await clearAllLocalData();
        if (payload.settings) await settingsStore.setItem(SETTINGS_KEY, buildDefaultSettings(payload.settings));
        for (const hh of payload.households) await householdStore.setItem(hh.id, hh);
        for (const entry of payload.householdSettings) await settingsStore.setItem(getHouseholdSettingsKey(entry.householdId), entry.settings);
        for (const em of payload.employees) await employeeStore.setItem(em.id, await encodeData(em));
        for (const ps of payload.payslips) await payslipStore.setItem(ps.id, await encodeData(ps));
        for (const l of payload.leave) await leaveStore.setItem(l.id, await encodeData(l));
        for (const co of payload.leaveCarryOvers) await leaveCarryOverStore.setItem(co.id, co);
        for (const doc of payload.documents) await documentStore.setItem(doc.id, doc);
        for (const c of payload.contracts) await contractStore.setItem(c.id, c);
        for (const f of payload.uploadedDocuments) await documentFileStore.setItem(f.id, base64ToBlob(f.base64, f.mimeType));
        await logAuditEvent("IMPORT_DATA", "Imported backup");
        return { success: true };
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Import failed.",
        };
    } finally {
        setImportingMode(false);
        await notifyListeners();
    }
}

export async function clearAllLocalData(): Promise<void> {
    await Promise.all([
        employeeStore.clear(), payslipStore.clear(), leaveStore.clear(), leaveCarryOverStore.clear(), settingsStore.clear(), auditStore.clear(), payPeriodStore.clear(), documentStore.clear(), documentFileStore.clear(), contractStore.clear(), householdStore.clear(), clearAllLocalRecoveryProfiles(),
    ]);
}

export async function createSyncSnapshot(): Promise<SyncMigrationSnapshot> {
    const [settings, households, employees, payslips, leaveRecords, payPeriods, documents, contracts] = await Promise.all([
        getSettings(), getHouseholds(), getEmployees(), getAllPayslips(), getAllLeaveRecords(), getPayPeriods(), getDocuments(), getContracts(),
    ]);
    const documentFiles: SyncMigrationSnapshot["documentFiles"] = [];
    for (const doc of documents) {
        const file = await getDocumentFile(doc.id);
        if (file) documentFiles.push({ id: doc.id, blob: file, mimeType: doc.mimeType || "application/octet-stream", accessScope: "paid" });
    }
    return { settings, households, employees, payslips, leaveRecords, payPeriods, documents, contracts, documentFiles };
}

export async function updateContractStatus(id: string, status: Contract["status"], overrides?: Partial<Contract>): Promise<void> {
    const contracts = await getContracts();
    const contract = contracts.find((c) => c.id === id);
    if (!contract) return;
    const updated = { ...contract, status, ...overrides };
    await saveContract(updated);
}

export async function purgeDocumentMetas(documentIds: string[]): Promise<number> {
    let purgedCount = 0;

    for (const id of documentIds) {
        const existing = await getDocumentMeta(id);
        if (!existing) {
            continue;
        }
        await deleteDocumentMeta(id);
        purgedCount += 1;
    }

    return purgedCount;
}

export async function getPayslipsForEmployee(employeeId: string): Promise<PayslipInput[]> {
    const payslips = await getAllPayslips();
    return payslips.filter((p) => p.employeeId === employeeId);
}

export async function getLatestPayslip(employeeId: string): Promise<PayslipInput | null> {
    const payslips = await getPayslipsForEmployee(employeeId);
    return payslips.length > 0 ? payslips[0] : null;
}

export async function getPayPeriod(id: string): Promise<PayPeriod | null> {
    const periods = await getPayPeriods();
    return periods.find((p) => p.id === id) || null;
}

export async function getCurrentPayPeriod(): Promise<PayPeriod | null> {
    const periods = await getPayPeriods();
    if (periods.length === 0) return null;
    return periods[0];
}

export async function lockPayPeriod(id: string): Promise<void> {
    const period = await getPayPeriod(id);
    if (period) {
        period.status = "locked";
        period.lockedAt = new Date().toISOString();
        await savePayPeriod(period);
        await logAuditEvent("LOCK_PAY_PERIOD", `Locked pay period: ${id}`);
    }
}

export async function unlockPayPeriod(id: string): Promise<void> {
    const period = await getPayPeriod(id);
    if (period) {
        period.status = "draft";
        period.lockedAt = undefined;
        await savePayPeriod(period);
    }
}

export const resetAllData = clearAllLocalData;
export const exportData = exportLocalDataAsBackup;
export const importData = importDataFromBackup;
export const getSyncMigrationSnapshot = createSyncSnapshot;

export async function getSecureTime(): Promise<number> {
    return Date.now();
}

export function getCurrentTaxYearRange(referenceDate?: Date): { start: Date; end: Date } {
    const now = referenceDate || new Date();
    const currentYear = now.getFullYear();
    const startYear = now.getMonth() < 2 ? currentYear - 1 : currentYear;
    return {
        start: new Date(`${startYear}-03-01T00:00:00Z`),
        end: new Date(`${startYear + 1}-02-28T23:59:59Z`),
    };
}
