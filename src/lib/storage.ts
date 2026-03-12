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
    DocumentMeta,
    DocumentMetaSchema,
    Contract,
    ContractSchema,
    AuditLog,
    Household,
    HouseholdSchema,
} from "./schema";

import { normalizeEmployeeIdNumber } from "./employee-id";
import { calculateAnnualLeaveSummary, getLeaveTypeLabel } from "./leave";

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


export const DEFAULT_HOUSEHOLD_ID = "default";
const DEFAULT_HOUSEHOLD_NAME = "Main household";
const BACKUP_SCHEMA_VERSION = "2.4";
const SUPPORTED_BACKUP_VERSIONS = new Set(["1.0", "2.0", "2.1", "2.2", "2.3", "2.4", 1, 2]);
const SECURE_TIME_CACHE_MS = 5 * 60 * 1000;
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
            // remove the data:base64 header
            const parts = result.split(",");
            resolve(parts[1] || "");
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
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
        ?? ((overrides.proStatus === "annual" || overrides.proStatus === "lifetime") ? "yearly" : "monthly");

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
        trialExpiry: undefined,
        defaultLanguage: "en",
        simpleMode: false,
        advancedMode: false,
        density: "comfortable",

        piiObfuscationEnabled: true,
        installationId: "",
        usageHistory: [],
        customLeaveTypes: [],
        ...overrides,
        proStatus: normalizedPlanId,
        billingCycle: inferredBillingCycle,
        activeHouseholdId: overrides.activeHouseholdId ?? DEFAULT_HOUSEHOLD_ID,
    };
}

function buildDefaultHousehold(): Household {
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

async function ensureDefaultHousehold(): Promise<void> {
    const existing = await householdStore.getItem<Household>(DEFAULT_HOUSEHOLD_ID);
    if (!existing) {
        await householdStore.setItem(DEFAULT_HOUSEHOLD_ID, buildDefaultHousehold());
    }
}

async function encodeData(data: unknown): Promise<string | unknown> {
    const settings = await getSettings();
    if (settings.piiObfuscationEnabled === false) return data;
    // Handle UTF-8 safely with encodeURIComponent (robust to emoji and non-ASCII)
    return btoa(encodeURIComponent(JSON.stringify(data)));
}

function decodeData<T>(value: unknown): T | null {
    if (typeof value !== "string" || !value) return null;
    try {
        const decoded = decodeURIComponent(atob(value));
        return JSON.parse(decoded) as T;
    } catch (error) {
        // Fallback for legacy un-obfuscated data or corrupted items
        try {
            return JSON.parse(value as string) as T;
        } catch {
            console.warn("Failed to decode data item. It may be corrupted or in an unexpected format.", error);
            return null;
        }
    }
}

type DataChangeListener = () => void | Promise<void>;
const listeners: DataChangeListener[] = [];
let isImporting = false;

export function subscribeToDataChanges(callback: DataChangeListener) {
    listeners.push(callback);
    return () => {
        const index = listeners.indexOf(callback);
        if (index > -1) listeners.splice(index, 1);
    };
}

async function notifyListeners() {
    if (isImporting) return;
    const activeListeners = [...listeners];
    // Use allSettled so one crashing component doesn't break the whole app (Issue 153)
    await Promise.allSettled(activeListeners.map(async (listener) => {
        try {
            await listener();
        } catch (error) {
            console.error("Data change listener failed", error);
        }
    }));
}

export function setImportingMode(value: boolean) {
    isImporting = value;
}

export async function getHouseholds(): Promise<Household[]> {
    await ensureDefaultHousehold();
    const households: Household[] = [];
    await householdStore.iterate<unknown, void>((value: unknown) => {
        const parsed = HouseholdSchema.safeParse(value);
        if (parsed.success) households.push(parsed.data);
    });
    return households.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function saveHousehold(household: Household): Promise<void> {
    await householdStore.setItem(household.id, household);
    await ensureHouseholdScopedSettings(household.id);
    await logAuditEvent("SWITCH_HOUSEHOLD", `Saved household: ${household.name}`, { householdId: household.id });
    await notifyListeners();
}

export async function getActiveHouseholdId(): Promise<string> {
    const settings = await getSettings();
    return settings.activeHouseholdId || DEFAULT_HOUSEHOLD_ID;
}

export async function setActiveHouseholdId(householdId: string): Promise<void> {
    await ensureDefaultHousehold();
    // Optimization: Direct check instead of getting all (Issue 154)
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
}

export async function getEmployee(id: string): Promise<Employee | null> {
    const value = await employeeStore.getItem<unknown>(id);
    return value ? decodeData<Employee>(value) : null;
}

export async function saveEmployee(employee: Employee): Promise<void> {
    const activeHouseholdId = await getActiveHouseholdId();
    const normalized: Employee = {
        ...employee,
        householdId: employee.householdId || activeHouseholdId,
        name: employee.name.trim(),
        idNumber: normalizeEmployeeIdNumber(employee.idNumber ?? ""),
        phone: employee.phone?.trim() ?? "",
    };

    if (normalized.idNumber) {
        const employees = await getEmployees();
        const duplicate = employees.find((existing) =>
            existing.id !== normalized.id &&
            normalizeEmployeeIdNumber(existing.idNumber ?? "") === normalized.idNumber
        );
        if (duplicate) {
            throw new Error(`An employee with ID number ${normalized.idNumber} already exists.`);
        }
    }

    await employeeStore.setItem(normalized.id, await encodeData(normalized));
    await logAuditEvent("CREATE_EMPLOYEE", `Saved employee: ${normalized.name}`, {
        employeeId: normalized.id,
        householdId: normalized.householdId,
        idNumber: normalized.idNumber || undefined,
    });
    await notifyListeners();
}

export async function deleteEmployee(id: string): Promise<void> {
    const employee = await getEmployee(id);
    
    // Perform deletions in parallel for better performance (Issue 8, 157)
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
        employeeName: employee?.name,
    });
    await notifyListeners();
}

export async function savePayslip(payslip: PayslipInput): Promise<void> {
    const activeHouseholdId = await getActiveHouseholdId();
    const duplicate = (await getAllPayslips()).find((existing) =>
        existing.id !== payslip.id &&
        existing.employeeId === payslip.employeeId &&
        new Date(existing.payPeriodStart).getTime() === new Date(payslip.payPeriodStart).getTime() &&
        new Date(existing.payPeriodEnd).getTime() === new Date(payslip.payPeriodEnd).getTime()
    );

    if (duplicate) {
        throw new Error("A payslip for this employee and pay period already exists.");
    }

    const normalized: PayslipInput = {
        ...payslip,
        householdId: payslip.householdId || activeHouseholdId,
    };

    await payslipStore.setItem(normalized.id, await encodeData(normalized));
    await logAuditEvent("CREATE_PAYSLIP", `Generated payslip for employee ID: ${normalized.employeeId}`, {
        payslipId: normalized.id,
        householdId: normalized.householdId,
        employeeId: normalized.employeeId,
        payPeriodStart: new Date(normalized.payPeriodStart).toISOString(),
        payPeriodEnd: new Date(normalized.payPeriodEnd).toISOString(),
    });
    await notifyListeners();
}

export async function getPayslipsForEmployee(employeeId: string): Promise<PayslipInput[]> {
    const payslips: PayslipInput[] = [];
    await payslipStore.iterate<unknown, void>((value: unknown) => {
        const decoded = decodeData<PayslipInput>(value);
        if (decoded?.employeeId === employeeId) payslips.push(decoded);
    });
    return payslips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getLatestPayslip(employeeId: string): Promise<PayslipInput | null> {
    const payslips = await getPayslipsForEmployee(employeeId);
    return payslips.length > 0 ? payslips[0] : null;
}

export async function getTotalDaysWorkedForEmployee(employeeId: string): Promise<number> {
    const payslips = await getPayslipsForEmployee(employeeId);
    return payslips.reduce((sum, payslip) => sum + (payslip.daysWorked || 0), 0);
}

export async function getAllPayslips(): Promise<PayslipInput[]> {
    const activeHouseholdId = await getActiveHouseholdId();
    const activeEmployeeIds = new Set((await getEmployees()).map((employee) => employee.id));
    const payslips: PayslipInput[] = [];
    await payslipStore.iterate<unknown, void>((value: unknown) => {
        if (!value) return;
        const decoded = decodeData<PayslipInput>(value);
        if (decoded && ((decoded.householdId || DEFAULT_HOUSEHOLD_ID) === activeHouseholdId || activeEmployeeIds.has(decoded.employeeId))) {
            payslips.push(decoded);
        }
    });
    return payslips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function deletePayslip(id: string): Promise<void> {
    await payslipStore.removeItem(id);
    await logAuditEvent("DELETE_PAYSLIP", `Deleted payslip ID: ${id}`, { payslipId: id });
    await notifyListeners();
}

async function getLeaveForEmployeeRaw(employeeId: string): Promise<LeaveRecord[]> {
    const records: LeaveRecord[] = [];
    await leaveStore.iterate<unknown, void>((value: unknown) => {
        const decoded = decodeData<LeaveRecord>(value);
        if (decoded?.employeeId === employeeId) {
            records.push(decoded);
        }
    });
    return records.sort((a, b) => new Date(b.startDate || b.date).getTime() - new Date(a.startDate || a.date).getTime());
}

async function getLeaveCarryOversForEmployeeRaw(employeeId: string): Promise<LeaveCarryOver[]> {
    const carryOvers: LeaveCarryOver[] = [];
    await leaveCarryOverStore.iterate<unknown, void>((value: unknown) => {
        const parsed = LeaveCarryOverSchema.safeParse(value);
        if (parsed.success && parsed.data.employeeId === employeeId) {
            carryOvers.push(parsed.data);
        }
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
        isCustomType: customType ? true : record.isCustomType,
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

    if (!employee?.startDate) return;

    const customLeaveTypes = normaliseCustomLeaveTypes(providedCustomLeaveTypes ?? settings?.customLeaveTypes ?? []);
    const updatedRecords = records.map((record) => applyLeaveTypeMetadata(record, customLeaveTypes));
    const summary = calculateAnnualLeaveSummary(employee.startDate, updatedRecords, contracts, new Date());
    const syncedRecords = summary.updatedRecords.map((record) => ({
        ...applyLeaveTypeMetadata(record, customLeaveTypes),
        householdId: record.householdId || employee.householdId || DEFAULT_HOUSEHOLD_ID,
    }));

    await Promise.all(syncedRecords.map(async (record) => {
        await leaveStore.setItem(record.id, await encodeData(record));
    }));

    const existingIds = new Set(existingCarryOvers.map((carryOver) => carryOver.id));
    const nextCarryOvers = summary.carryOvers.map((carryOver) => ({
        ...carryOver,
        id: `${employeeId}:${carryOver.fromCycleEnd}`,
        householdId: employee.householdId || DEFAULT_HOUSEHOLD_ID,
        employeeId,
    }));

    await Promise.all(nextCarryOvers.map(async (carryOver) => {
        existingIds.delete(carryOver.id);
        await leaveCarryOverStore.setItem(carryOver.id, carryOver);
    }));

    await Promise.all(Array.from(existingIds).map(async (id) => {
        await leaveCarryOverStore.removeItem(id);
    }));
}

export async function saveLeaveRecord(record: LeaveRecord): Promise<void> {
    const activeHouseholdId = await getActiveHouseholdId();
    const settings = await getSettings();
    const customLeaveTypes = normaliseCustomLeaveTypes(settings.customLeaveTypes ?? []);
    const normalized: LeaveRecord = {
        ...applyLeaveTypeMetadata(record, customLeaveTypes),
        householdId: record.householdId || activeHouseholdId,
    };
    await leaveStore.setItem(normalized.id, await encodeData(normalized));
    await synchronizeEmployeeLeaveLedger(normalized.employeeId, customLeaveTypes);
    await logAuditEvent("CREATE_LEAVE_RECORD", `Saved leave record: ${normalized.type} for employee ${normalized.employeeId}`, {
        leaveId: normalized.id,
        householdId: normalized.householdId,
        employeeId: normalized.employeeId,
        leaveType: normalized.type,
        date: normalized.date,
    });
    await notifyListeners();
}

export async function deleteLeaveRecord(id: string): Promise<void> {
    const existing = await leaveStore.getItem<unknown>(id);
    const record = existing ? decodeData<LeaveRecord>(existing) : null;
    await leaveStore.removeItem(id);
    if (record?.employeeId) {
        await synchronizeEmployeeLeaveLedger(record.employeeId);
    }
    await logAuditEvent("DELETE_LEAVE_RECORD", `Deleted leave record ID: ${id}`, {
        leaveId: id,
        employeeId: record?.employeeId,
        leaveType: record?.type,
    });
    await notifyListeners();
}

export async function getLeaveForEmployee(employeeId: string): Promise<LeaveRecord[]> {
    await synchronizeEmployeeLeaveLedger(employeeId);
    return getLeaveForEmployeeRaw(employeeId);
}

export async function getLeaveCarryOversForEmployee(employeeId: string): Promise<LeaveCarryOver[]> {
    await synchronizeEmployeeLeaveLedger(employeeId);
    return getLeaveCarryOversForEmployeeRaw(employeeId);
}

export async function getAllLeaveRecords(): Promise<LeaveRecord[]> {
    const activeHouseholdId = await getActiveHouseholdId();
    const activeEmployeeIds = new Set((await getEmployees()).map((employee) => employee.id));
    const settings = await getSettings();
    const customLeaveTypes = normaliseCustomLeaveTypes(settings.customLeaveTypes ?? []);
    await Promise.all(Array.from(activeEmployeeIds).map(async (employeeId) => synchronizeEmployeeLeaveLedger(employeeId, customLeaveTypes)));
    const records: LeaveRecord[] = [];
    await leaveStore.iterate<unknown, void>((value: unknown) => {
        const decoded = decodeData<LeaveRecord>(value);
        if (decoded && ((decoded.householdId || DEFAULT_HOUSEHOLD_ID) === activeHouseholdId || activeEmployeeIds.has(decoded.employeeId))) {
            records.push(decoded);
        }
    });
    return records;
}

const SETTINGS_KEY = "employer-settings";


async function overlayVerifiedEntitlements(settings: EmployerSettings): Promise<EmployerSettings> {
    if (typeof window === "undefined") return settings;

    if (process.env.NEXT_PUBLIC_DEBUG_PRO_PLAN === "true") {
        return {
        ...settings,
        proStatus: "pro",
        paidUntil: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        trialExpiry: undefined,
    };
}

    // TODO: In Batch 2, this will check Supabase auth and verify entitlements.
    // For now, local-only mode means we skip server-side entitlement verification.
    return settings;
}

export async function getSettings(): Promise<EmployerSettings> {
    await ensureDefaultHousehold();
    const rawSettings = await settingsStore.getItem<EmployerSettings>(SETTINGS_KEY);
    const normalizedGlobal = buildDefaultSettings(stripHouseholdScopedSettings(rawSettings ?? {}));
    const activeHouseholdId = normalizedGlobal.activeHouseholdId || DEFAULT_HOUSEHOLD_ID;

    const legacySeed = activeHouseholdId === DEFAULT_HOUSEHOLD_ID
        ? extractHouseholdScopedSettings(rawSettings ?? {})
        : getEmptyHouseholdScopedSettings();

    const householdSettings = await ensureHouseholdScopedSettings(activeHouseholdId, legacySeed);

    return overlayVerifiedEntitlements({
        ...normalizedGlobal,
        ...householdSettings,
        activeHouseholdId,
    });
}

export async function saveSettings(settings: EmployerSettings): Promise<void> {
    const existingStoredSettings = await settingsStore.getItem<EmployerSettings>(SETTINGS_KEY);
    const normalized = buildDefaultSettings({
        ...settings,
        proStatus: existingStoredSettings?.proStatus ?? settings.proStatus,
        paidUntil: existingStoredSettings?.paidUntil ?? settings.paidUntil,
        trialExpiry: existingStoredSettings?.trialExpiry ?? settings.trialExpiry,
        billingCycle: existingStoredSettings?.billingCycle ?? settings.billingCycle,
    });
    const activeHouseholdId = normalized.activeHouseholdId || DEFAULT_HOUSEHOLD_ID;
    const globalSettings = buildDefaultSettings({
        ...stripHouseholdScopedSettings(normalized),
        activeHouseholdId,
    });
    const householdSettings = extractHouseholdScopedSettings(normalized);

    await settingsStore.setItem(SETTINGS_KEY, globalSettings);
    await settingsStore.setItem(getHouseholdSettingsKey(activeHouseholdId), householdSettings);
    const employees = await getEmployees();
    const customLeaveTypes = normaliseCustomLeaveTypes(normalized.customLeaveTypes ?? []);
    await Promise.all(employees.map(async (employee) => synchronizeEmployeeLeaveLedger(employee.id, customLeaveTypes)));
    if (typeof window !== "undefined" && typeof window.localStorage?.setItem === "function") {
        window.localStorage.setItem("ll-density", globalSettings.density || "comfortable");
    }
    await logAuditEvent("UPDATE_SETTINGS", `Employer settings updated (PII: ${globalSettings.piiObfuscationEnabled})`, {
        householdId: activeHouseholdId,
    });
    await notifyListeners();
}
const COMPLIANCE_SHOWN_KEY = "ll-compliance-shown";

export async function getComplianceShownFlag(): Promise<boolean> {
    const value = await settingsStore.getItem<boolean>(COMPLIANCE_SHOWN_KEY);
    return value === true;
}

export async function setComplianceShownFlag(): Promise<void> {
    await settingsStore.setItem(COMPLIANCE_SHOWN_KEY, true);
}

export async function getSecureTime(): Promise<Date> {
    const cachedAt = await settingsStore.getItem<number>("lastKnownTimeFetchedAt");
    const cachedTime = await settingsStore.getItem<number>("lastKnownTime");
    if (cachedAt && cachedTime && (Date.now() - cachedAt) < SECURE_TIME_CACHE_MS) {
        return new Date(cachedTime);
    }

    const mirrors = [
        "https://worldtimeapi.org/api/timezone/Etc/UTC",
        "https://timeapi.io/api/Time/current/zone?timeZone=UTC",
        "https://1.1.1.1/cdn-cgi/trace",
    ];

    // Robust multi-point time verification (Issue 10, 161, 162)
    const raceResult = await Promise.race([
        ...mirrors.map((url) =>
            fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) })
                .then(async (response) => {
                    if (!response.ok) return null;
                    if (url.includes("cdn-cgi/trace")) {
                        const text = await response.text();
                        const tsLine = text.split("\n").find((line) => line.startsWith("ts="));
                        return tsLine ? new Date(parseFloat(tsLine.split("=")[1]) * 1000) : null;
                    }
                    const text = await response.text();
                    if (!text.trim()) return null;
                    try {
                        const data = JSON.parse(text);
                        const dateString = data.datetime || data.dateTime;
                        return dateString ? new Date(dateString) : null;
                    } catch {
                        return null;
                    }
                })
                .catch(() => null)
        ),
        // Failsafe timeout
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5500)),
    ]);

    if (raceResult instanceof Date && !Number.isNaN(raceResult.getTime())) {
        await settingsStore.setItem("lastKnownTime", raceResult.getTime());
        await settingsStore.setItem("lastKnownTimeFetchedAt", Date.now());
        return raceResult;
    }

    const localTime = new Date();
    const lastKnown = (await settingsStore.getItem<number>("lastKnownTime")) || 0;
    
    // Ant-tamper: If local time is BEFORE last known network time, local clock was likely wound back
    if (localTime.getTime() < lastKnown) {
        return new Date(lastKnown);
    }

    await settingsStore.setItem("lastKnownTime", localTime.getTime());
    await settingsStore.setItem("lastKnownTimeFetchedAt", Date.now());
    return localTime;
}

export function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
}

export function setCookie(name: string, value: string, days: number) {
    if (typeof document === "undefined") return;
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Strict`;
}

export async function getInstallationId(): Promise<string> {
    let installationId = getCookie("ll_inst_id");
    const settings = await getSettings();

    if (!installationId && settings.installationId) {
        installationId = settings.installationId;
        // Only set cookie if document is available and not blocked
        try {
            setCookie("ll_inst_id", installationId, 3650);
        } catch {}
    } else if (installationId && !settings.installationId) {
        await saveSettings({ ...settings, installationId });
    } else if (!installationId && !settings.installationId) {
        installationId = crypto.randomUUID();
        try {
            setCookie("ll_inst_id", installationId, 3650);
        } catch {}
        await saveSettings({ ...settings, installationId });
    }

    return installationId || "unknown";
}

export interface ExportDataOptions {
    generatedRecordsSince?: Date | null;
}

export async function hasMeaningfulLocalData(): Promise<boolean> {
    let hasData = false;
    const stores = [employeeStore, payslipStore, leaveStore, documentStore, contractStore];
    for (const store of stores) {
        await store.iterate(() => {
            hasData = true;
            return true; // Stop iteration early
        });
        if (hasData) break;
    }
    return hasData;
}

export async function getLocalBackupPreview(): Promise<LocalBackupPreview> {
    const counts = { employees: 0, payslips: 0, leave: 0, documents: 0, contracts: 0 };
    
    await employeeStore.iterate(() => { counts.employees++; });
    await payslipStore.iterate(() => { counts.payslips++; });
    await leaveStore.iterate(() => { counts.leave++; });
    await documentStore.iterate(() => { counts.documents++; });
    await contractStore.iterate(() => { counts.contracts++; });
    


    return {
        employeeCount: counts.employees,
        payslipCount: counts.payslips,
        leaveCount: counts.leave,
        documentCount: counts.documents,
        contractCount: counts.contracts,
    };
}

function isWithinGeneratedExportWindow(recordDate: Date | string | number, generatedRecordsSince?: Date | null): boolean {

    if (!generatedRecordsSince) return true;
    const date = new Date(recordDate);
    if (Number.isNaN(date.getTime())) return true;
    return date >= generatedRecordsSince;
}

export async function exportData(options: ExportDataOptions = {}): Promise<string> {
    const households = await getHouseholds();
    const data: {
        version: string;
        timestamp: string;
        households: unknown[];
        householdSettings: { householdId: string; settings: HouseholdScopedSettings }[];
        employees: unknown[];
        payslips: unknown[];
        leave: unknown[];
        leaveCarryOvers: unknown[];
        documents: unknown[];
        contracts: unknown[];
        uploadedDocuments: { id: string; mimeType: string; base64: string }[];
        settings: unknown;
    } = {
        version: BACKUP_SCHEMA_VERSION,
        timestamp: new Date().toISOString(),
        households,
        householdSettings: [],
        employees: [],
        payslips: [],
        leave: [],
        leaveCarryOvers: [],
        documents: [],
        contracts: [],
        uploadedDocuments: [],
        settings: {},
    };

    await employeeStore.iterate((value) => { 
        const decoded = decodeData(value);
        if (decoded) data.employees.push(decoded); 
    });
    
    await payslipStore.iterate((value) => {
        const decoded = decodeData<PayslipInput>(value);
        if (decoded && isWithinGeneratedExportWindow(decoded.payPeriodEnd, options.generatedRecordsSince)) {
            data.payslips.push(decoded);
        }
    });
    
    await leaveStore.iterate((value) => {
        const decoded = decodeData<LeaveRecord>(value);
        if (decoded && isWithinGeneratedExportWindow(decoded.endDate || decoded.startDate || decoded.date, options.generatedRecordsSince)) {
            data.leave.push(decoded);
        }
    });
    
    await leaveCarryOverStore.iterate((value) => { data.leaveCarryOvers.push(value); });
    
    await documentStore.iterate((value) => {
        const decoded = decodeData<DocumentMeta>(value);
        if (decoded && (decoded.source === "uploaded" || isWithinGeneratedExportWindow(decoded.createdAt, options.generatedRecordsSince))) {
            data.documents.push(decoded);
        }
    });
    
    await contractStore.iterate((value) => {
        const decoded = decodeData<Contract>(value);
        if (decoded && isWithinGeneratedExportWindow(decoded.updatedAt || decoded.createdAt, options.generatedRecordsSince)) {
            data.contracts.push(decoded);
        }
    });

    for (const document of data.documents as DocumentMeta[]) {
        if (document.source !== "uploaded") continue;

        const blob = await documentFileStore.getItem<Blob>(document.id);
        if (!blob) continue;
        data.uploadedDocuments.push({
            id: document.id,
            mimeType: blob.type || document.mimeType || "application/octet-stream",
            base64: await blobToBase64(blob),
        });
    }

    const rawSettings = await settingsStore.getItem<EmployerSettings>(SETTINGS_KEY);
    if (rawSettings) {
        data.settings = stripHouseholdScopedSettings(rawSettings);
    }

    for (const household of households) {
        const householdSettings = await getHouseholdScopedSettings(household.id);
        if (householdSettings) {
            data.householdSettings.push({ householdId: household.id, settings: householdSettings });
        }
    }

    if (data.householdSettings.length === 0 && rawSettings) {
        data.householdSettings.push({
            householdId: DEFAULT_HOUSEHOLD_ID,
            settings: extractHouseholdScopedSettings(rawSettings),
        });
    }

    const json = JSON.stringify(data, null, 2);
    await logAuditEvent("EXPORT_DATA", "Manual data backup export triggered", { version: BACKUP_SCHEMA_VERSION });
    return json;
}

export async function importData(json: string): Promise<{ success: boolean; error?: string }> {
    let parsedJson: unknown;
    try {
        parsedJson = JSON.parse(json);
    } catch {
        return { success: false, error: "Invalid backup file - could not parse JSON." };
    }

    const parsed = BackupPayloadSchema.safeParse(parsedJson);
    if (!parsed.success) {
        return { success: false, error: "Backup file is not in a supported LekkerLedger format." };
    }

    if (parsed.data.version !== undefined && !SUPPORTED_BACKUP_VERSIONS.has(parsed.data.version)) {
        return { success: false, error: `Backup version ${parsed.data.version} is not supported by this app.` };
    }

    setImportingMode(true);
    try {
        await resetAllData();
        await Promise.all(parsed.data.households.map(async (household) => householdStore.setItem(household.id, household)));
        if (parsed.data.households.length === 0) {
            await ensureDefaultHousehold();
        }
        await Promise.all(parsed.data.employees.map(async (employee) => employeeStore.setItem(employee.id, await encodeData(employee))));
        await Promise.all(parsed.data.payslips.map(async (payslip) => payslipStore.setItem(payslip.id, await encodeData(payslip))));
        await Promise.all(parsed.data.leave.map(async (record) => leaveStore.setItem(record.id, await encodeData(record))));
        await Promise.all(parsed.data.leaveCarryOvers.map(async (carryOver) => leaveCarryOverStore.setItem(carryOver.id, carryOver)));
        await Promise.all(parsed.data.documents.map(async (document) => documentStore.setItem(document.id, await encodeData(document))));
        await Promise.all(parsed.data.contracts.map(async (contract) => contractStore.setItem(contract.id, await encodeData(contract))));
        await Promise.all(parsed.data.uploadedDocuments.map(async (document) =>
            documentFileStore.setItem(document.id, base64ToBlob(document.base64, document.mimeType))
        ));

        const importedGlobalSettings = buildDefaultSettings(stripHouseholdScopedSettings(parsed.data.settings as EmployerSettings));
        await settingsStore.setItem(SETTINGS_KEY, importedGlobalSettings);

        if (parsed.data.householdSettings.length > 0) {
            await Promise.all(
                parsed.data.householdSettings.map(async (entry) =>
                    settingsStore.setItem(getHouseholdSettingsKey(entry.householdId), {
                        ...getEmptyHouseholdScopedSettings(),
                        ...entry.settings,
                    })
                )
            );
        } else {
            await settingsStore.setItem(
                getHouseholdSettingsKey(DEFAULT_HOUSEHOLD_ID),
                extractHouseholdScopedSettings(parsed.data.settings as EmployerSettings)
            );
        }

        await logAuditEvent("IMPORT_DATA", "Manual data restore completed", {
            version: String(parsed.data.version ?? "legacy"),
            households: parsed.data.households.length,
            employees: parsed.data.employees.length,
            payslips: parsed.data.payslips.length,
            leaveRecords: parsed.data.leave.length,
            leaveCarryOvers: parsed.data.leaveCarryOvers.length,
            documents: parsed.data.documents.length,
            contracts: parsed.data.contracts.length,
        });
        return { success: true };
    } catch (error) {
        console.error("Data import failed:", error);
        return { success: false, error: "Restore failed - data may be partially imported." };
    } finally {
        setImportingMode(false);
        await notifyListeners();
    }
}

export async function resetAllData(): Promise<void> {
    await logAuditEvent("DELETE_ALL_DATA", "TOTAL WIPE: User requested manual reset of all application data");
    await Promise.all([
        employeeStore.clear(),
        payslipStore.clear(),
        leaveStore.clear(),
        leaveCarryOverStore.clear(),
        settingsStore.clear(),
        payPeriodStore.clear(),
        documentStore.clear(),
        documentFileStore.clear(),
        contractStore.clear(),
        householdStore.clear(),
        auditStore.clear(),
    ]);
}

export async function logAuditEvent(action: AuditLog["action"], details: string, metadata?: Record<string, unknown>): Promise<void> {
    const id = crypto.randomUUID();
    const log: AuditLog = {
        id,
        timestamp: new Date(),
        action,
        details,
        metadata,
    };
    await auditStore.setItem(id, log);
}

export async function getAuditLogs(): Promise<AuditLog[]> {
    const logs: AuditLog[] = [];
    await auditStore.iterate<AuditLog, void>((value: AuditLog) => {
        logs.push(value);
    });
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getPayPeriods(): Promise<PayPeriod[]> {
    const activeHouseholdId = await getActiveHouseholdId();
    const periods: PayPeriod[] = [];
    await payPeriodStore.iterate<unknown, void>((value: unknown) => {
        if (!value) return;
        const decoded = decodeData<PayPeriod>(value);
        if (decoded && (decoded.householdId || DEFAULT_HOUSEHOLD_ID) === activeHouseholdId) {
            periods.push(decoded);
        }
    });
    return periods.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function getPayPeriod(id: string): Promise<PayPeriod | null> {
    const value = await payPeriodStore.getItem<unknown>(id);
    return value ? decodeData<PayPeriod>(value) : null;
}

export async function savePayPeriod(period: PayPeriod): Promise<void> {
    const activeHouseholdId = await getActiveHouseholdId();
    const updated = { ...period, householdId: period.householdId || activeHouseholdId, updatedAt: new Date().toISOString() };
    await payPeriodStore.setItem(updated.id, await encodeData(updated));
    await logAuditEvent("CREATE_PAY_PERIOD", `Updated draft pay period: ${period.name}`, { periodId: period.id, householdId: updated.householdId });
    await notifyListeners();
}

export async function lockPayPeriod(id: string): Promise<void> {
    const period = await getPayPeriod(id);
    if (!period) throw new Error("Pay period not found");
    if (period.status === "locked") throw new Error("Pay period already locked");

    const locked: PayPeriod = {
        ...period,
        status: "locked",
        lockedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await payPeriodStore.setItem(id, await encodeData(locked));
    await logAuditEvent("LOCK_PAY_PERIOD", `Locked pay period: ${period.name}`, { periodId: id });
    await notifyListeners();
}

export async function unlockPayPeriod(id: string): Promise<void> {
    const period = await getPayPeriod(id);
    if (!period) throw new Error("Pay period not found");
    if (period.status !== "locked") throw new Error("Pay period is not locked");

    // Revert status to review (or draft)
    const unlocked: PayPeriod = {
        ...period,
        status: "review",
        lockedAt: undefined,
        updatedAt: new Date().toISOString(),
    };

    await payPeriodStore.setItem(id, await encodeData(unlocked));

    // Cleanup generated payslips and document metadata
    const payslips = await getAllPayslips();
    const periodPayslips = payslips.filter(p => {
        // ID format is `${periodId}-${employeeId}` in page.tsx
        return p.id.startsWith(`${id}-`);
    });

    await Promise.all(periodPayslips.map(async p => {
        await deletePayslip(p.id);
        await deleteDocumentMeta(p.id);
    }));

    await logAuditEvent("LOCK_PAY_PERIOD", `Unlocked pay period: ${period.name}`, { periodId: id, action: "unlocked" });
    await notifyListeners();
}

export async function deletePayPeriod(id: string): Promise<void> {
    const period = await getPayPeriod(id);
    if (period?.status === "locked") throw new Error("Cannot delete a locked pay period");
    await payPeriodStore.removeItem(id);
    await logAuditEvent("DELETE_PAY_PERIOD", `Deleted pay period ID: ${id}`, { periodId: id });
    await notifyListeners();
}

export async function getCurrentPayPeriod(): Promise<PayPeriod | null> {
    const periods = await getPayPeriods();
    return periods.find((period) => period.status === "draft" || period.status === "review") ?? null;
}

export async function getDocuments(): Promise<DocumentMeta[]> {
    const activeHouseholdId = await getActiveHouseholdId();
    const activeEmployeeIds = new Set((await getEmployees()).map((employee) => employee.id));
    const documents: DocumentMeta[] = [];
    await documentStore.iterate<unknown, void>((value: unknown) => {
        if (!value) return;
        const decoded = decodeData<DocumentMeta>(value);
        if (decoded && ((decoded.householdId || DEFAULT_HOUSEHOLD_ID) === activeHouseholdId || (decoded.employeeId && activeEmployeeIds.has(decoded.employeeId)))) {
            documents.push(decoded);
        }
    });
    return documents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getDocumentMeta(id: string): Promise<DocumentMeta | null> {
    const value = await documentStore.getItem<unknown>(id);
    return value ? decodeData<DocumentMeta>(value) : null;
}

export async function saveDocumentMeta(doc: DocumentMeta): Promise<void> {
    const activeHouseholdId = await getActiveHouseholdId();
    const normalized = { ...doc, householdId: doc.householdId || activeHouseholdId };
    await documentStore.setItem(normalized.id, await encodeData(normalized));
    await notifyListeners();
}

export async function deleteDocumentMeta(id: string): Promise<void> {
    await documentStore.removeItem(id);
    await documentFileStore.removeItem(id);
    await notifyListeners();
}

export async function saveDocumentFile(id: string, file: Blob): Promise<void> {
    await documentFileStore.setItem(id, file);
}

export async function getDocumentFile(id: string): Promise<Blob | null> {
    return await documentFileStore.getItem<Blob>(id) ?? null;
}

export async function getContracts(): Promise<Contract[]> {
    const activeHouseholdId = await getActiveHouseholdId();
    const contracts: Contract[] = [];
    await contractStore.iterate<unknown, void>((value: unknown) => {
        if (!value) return;
        const decoded = decodeData<Contract>(value);
        if (decoded && (decoded.householdId || DEFAULT_HOUSEHOLD_ID) === activeHouseholdId) {
            contracts.push(decoded);
        }
    });
    return contracts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getContractsForEmployee(employeeId: string): Promise<Contract[]> {
    const allContracts = await getContracts();
    return allContracts.filter((contract) => contract.employeeId === employeeId);
}

export async function saveContract(contract: Contract): Promise<void> {
    const activeHouseholdId = await getActiveHouseholdId();
    const normalized = { ...contract, householdId: contract.householdId || activeHouseholdId };
    await contractStore.setItem(normalized.id, await encodeData(normalized));
    await logAuditEvent("UPDATE_CONTRACT", `Saved contract version ${normalized.version} for employee ${normalized.employeeId}`, { contractId: normalized.id, householdId: normalized.householdId });
    await notifyListeners();
}

export async function deleteContract(id: string): Promise<void> {
    await contractStore.removeItem(id);
    await logAuditEvent("UPDATE_CONTRACT", `Deleted contract ID: ${id}`, { contractId: id });
    await notifyListeners();
}

export async function updateContractStatus(
    id: string,
    status: Contract["status"],
    meta?: {
        signedDocumentId?: string;
        finalizedAt?: string;
    }
): Promise<void> {
    const existing = await contractStore.getItem<unknown>(id);
    if (!existing) return;
    const contract = decodeData<Contract>(existing);

    const updated = {
        ...contract,
        status,
        ...(meta?.signedDocumentId ? { signedDocumentId: meta.signedDocumentId } : {}),
        ...(meta?.finalizedAt ? { finalizedAt: meta.finalizedAt } : {}),
        updatedAt: new Date().toISOString(),
    };

    await contractStore.setItem(id, await encodeData(updated));
    await logAuditEvent("UPDATE_CONTRACT", `Contract ${id} status changed to ${status}`, { contractId: id, status });
    await notifyListeners();
}

export function getCurrentTaxYearRange(now: Date = new Date()): { start: Date; end: Date; label: string } {
    const year = now.getFullYear();
    const month = now.getMonth();

    const startYear = month < 2 ? year - 1 : year;
    const endYear = startYear + 1;

    const start = new Date(startYear, 2, 1);
    const end = new Date(endYear, 1, 28);

    if (endYear % 4 === 0 && (endYear % 100 !== 0 || endYear % 400 === 0)) {
        end.setDate(29);
    }

    return {
        start,
        end,
        label: `${startYear}/${endYear}`,
    };
}
