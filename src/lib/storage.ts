import localforage from "localforage";
import { z } from "zod";
import {
    Employee,
    EmployeeSchema,
    PayslipInput,
    PayslipInputSchema,
    LeaveRecord,
    LeaveRecordSchema,
    EmployerSettings,
    EmployerSettingsSchema,
    PayPeriod,
    DocumentMeta,
    Contract,
    AuditLog,
} from "./schema";

const employeeStore = localforage.createInstance({ name: "LekkerLedger", storeName: "employees" });
const payslipStore = localforage.createInstance({ name: "LekkerLedger", storeName: "payslips" });
const leaveStore = localforage.createInstance({ name: "LekkerLedger", storeName: "leave" });
const settingsStore = localforage.createInstance({ name: "LekkerLedger", storeName: "settings" });
const auditStore = localforage.createInstance({ name: "LekkerLedger", storeName: "audit_logs" });
const payPeriodStore = localforage.createInstance({ name: "LekkerLedger", storeName: "pay_periods" });
const documentStore = localforage.createInstance({ name: "LekkerLedger", storeName: "documents" });
const contractStore = localforage.createInstance({ name: "LekkerLedger", storeName: "contracts" });

export const FREE_PAYSLIP_LIMIT = 2;
const BACKUP_SCHEMA_VERSION = "2.0";
const SUPPORTED_BACKUP_VERSIONS = new Set(["1.0", "2.0", 1, 2]);
const SECURE_TIME_CACHE_MS = 5 * 60 * 1000;

const BackupPayloadSchema = z.object({
    version: z.union([z.string(), z.number()]).optional(),
    timestamp: z.string().optional(),
    employees: z.array(EmployeeSchema).default([]),
    payslips: z.array(PayslipInputSchema).default([]),
    leave: z.array(LeaveRecordSchema).default([]),
    settings: EmployerSettingsSchema.partial().default({}),
});

async function encodeData(data: unknown): Promise<string | unknown> {
    const settings = await getSettings();
    if (settings.piiObfuscationEnabled === false) return data;
    return btoa(encodeURIComponent(JSON.stringify(data)));
}

function decodeData<T>(value: unknown): T {
    if (typeof value !== "string" || !value) return value as T;
    try {
        const decoded = decodeURIComponent(atob(value));
        return JSON.parse(decoded) as T;
    } catch (error) {
        console.warn("Failed to decode stored data", error);
        return value as T;
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
    for (const listener of listeners) {
        try {
            await listener();
        } catch (error) {
            console.error("Data change listener failed", error);
        }
    }
}

export function setImportingMode(value: boolean) {
    isImporting = value;
}

export async function getEmployees(): Promise<Employee[]> {
    const employees: Employee[] = [];
    await employeeStore.iterate<unknown, void>((value: unknown) => {
        if (value) employees.push(decodeData<Employee>(value));
    });
    return employees.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getEmployee(id: string): Promise<Employee | null> {
    const value = await employeeStore.getItem<unknown>(id);
    return value ? decodeData<Employee>(value) : null;
}

export async function saveEmployee(employee: Employee): Promise<void> {
    const normalized: Employee = {
        ...employee,
        name: employee.name.trim(),
        idNumber: employee.idNumber?.trim() ?? "",
        phone: employee.phone?.trim() ?? "",
    };

    if (normalized.idNumber) {
        const employees = await getEmployees();
        const duplicate = employees.find((existing) => existing.id !== normalized.id && existing.idNumber?.trim() === normalized.idNumber);
        if (duplicate) {
            throw new Error(`An employee with ID number ${normalized.idNumber} already exists.`);
        }
    }

    await employeeStore.setItem(normalized.id, await encodeData(normalized));
    await logAuditEvent("CREATE_EMPLOYEE", `Saved employee: ${normalized.name}`, {
        employeeId: normalized.id,
        idNumber: normalized.idNumber || undefined,
    });
    await notifyListeners();
}

export async function deleteEmployee(id: string): Promise<void> {
    const employee = await getEmployee(id);
    await employeeStore.removeItem(id);

    const payslipsToDelete: string[] = [];
    await payslipStore.iterate<unknown, void>((value: unknown, key: string) => {
        const decoded = decodeData<PayslipInput>(value);
        if (decoded.employeeId === id) payslipsToDelete.push(key);
    });
    await Promise.allSettled(payslipsToDelete.map((key) => payslipStore.removeItem(key)));

    const leaveToDelete: string[] = [];
    await leaveStore.iterate<unknown, void>((value: unknown, key: string) => {
        const decoded = decodeData<LeaveRecord>(value);
        if (decoded.employeeId === id) leaveToDelete.push(key);
    });
    await Promise.allSettled(leaveToDelete.map((key) => leaveStore.removeItem(key)));

    await logAuditEvent("DELETE_EMPLOYEE", `Deleted employee: ${employee?.name || id}`, {
        employeeId: employee?.id || id,
        employeeName: employee?.name,
    });
    await notifyListeners();
}

export async function savePayslip(payslip: PayslipInput): Promise<void> {
    const duplicate = (await getAllPayslips()).find((existing) =>
        existing.id !== payslip.id &&
        existing.employeeId === payslip.employeeId &&
        new Date(existing.payPeriodStart).getTime() === new Date(payslip.payPeriodStart).getTime() &&
        new Date(existing.payPeriodEnd).getTime() === new Date(payslip.payPeriodEnd).getTime()
    );

    if (duplicate) {
        throw new Error("A payslip for this employee and pay period already exists.");
    }

    await payslipStore.setItem(payslip.id, await encodeData(payslip));
    await logAuditEvent("CREATE_PAYSLIP", `Generated payslip for employee ID: ${payslip.employeeId}`, {
        payslipId: payslip.id,
        employeeId: payslip.employeeId,
        payPeriodStart: new Date(payslip.payPeriodStart).toISOString(),
        payPeriodEnd: new Date(payslip.payPeriodEnd).toISOString(),
    });
    await notifyListeners();
}

export async function getPayslipsForEmployee(employeeId: string): Promise<PayslipInput[]> {
    const payslips: PayslipInput[] = [];
    await payslipStore.iterate<unknown, void>((value: unknown) => {
        const decoded = decodeData<PayslipInput>(value);
        if (decoded.employeeId === employeeId) payslips.push(decoded);
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
    const payslips: PayslipInput[] = [];
    await payslipStore.iterate<unknown, void>((value: unknown) => {
        if (value) payslips.push(decodeData<PayslipInput>(value));
    });
    return payslips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function deletePayslip(id: string): Promise<void> {
    await payslipStore.removeItem(id);
    await logAuditEvent("DELETE_PAYSLIP", `Deleted payslip ID: ${id}`, { payslipId: id });
    await notifyListeners();
}

export async function saveLeaveRecord(record: LeaveRecord): Promise<void> {
    await leaveStore.setItem(record.id, await encodeData(record));
    await logAuditEvent("CREATE_LEAVE_RECORD", `Saved leave record: ${record.type} for employee ${record.employeeId}`, {
        leaveId: record.id,
        employeeId: record.employeeId,
        leaveType: record.type,
        date: record.date,
    });
    await notifyListeners();
}

export async function deleteLeaveRecord(id: string): Promise<void> {
    const existing = await leaveStore.getItem<unknown>(id);
    const record = existing ? decodeData<LeaveRecord>(existing) : null;
    await leaveStore.removeItem(id);
    await logAuditEvent("DELETE_LEAVE_RECORD", `Deleted leave record ID: ${id}`, {
        leaveId: id,
        employeeId: record?.employeeId,
        leaveType: record?.type,
    });
    await notifyListeners();
}

export async function getLeaveForEmployee(employeeId: string): Promise<LeaveRecord[]> {
    const records: LeaveRecord[] = [];
    await leaveStore.iterate<unknown, void>((value: unknown) => {
        const decoded = decodeData<LeaveRecord>(value);
        if (decoded.employeeId === employeeId) records.push(decoded);
    });
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getAllLeaveRecords(): Promise<LeaveRecord[]> {
    const records: LeaveRecord[] = [];
    await leaveStore.iterate<unknown, void>((value: unknown) => {
        records.push(decodeData<LeaveRecord>(value));
    });
    return records;
}

const SETTINGS_KEY = "employer-settings";

export async function getSettings(): Promise<EmployerSettings> {
    const settings = await settingsStore.getItem<EmployerSettings>(SETTINGS_KEY);
    return settings ?? {
        employerName: "",
        employerAddress: "",
        employerIdNumber: "",
        uifRefNumber: "",
        cfNumber: "",
        sdlNumber: "",
        phone: "",
        logoData: "",
        proStatus: "free",
        paidUntil: undefined,
        trialExpiry: undefined,
        defaultLanguage: "en",
        simpleMode: false,
        advancedMode: false,
        density: "comfortable",
        googleSyncEnabled: false,
        googleAuthToken: undefined,
        piiObfuscationEnabled: true,
        installationId: "",
        usageHistory: [],
    };
}

export async function saveSettings(settings: EmployerSettings): Promise<void> {
    await settingsStore.setItem(SETTINGS_KEY, settings);
    if (typeof window !== "undefined") {
        localStorage.setItem("ll-density", settings.density || "comfortable");
    }
    await logAuditEvent("UPDATE_SETTINGS", `Employer settings updated (PII: ${settings.piiObfuscationEnabled}, Sync: ${settings.googleSyncEnabled})`);
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
                    const data = JSON.parse(text);
                    const dateString = data.datetime || data.dateTime;
                    return dateString ? new Date(dateString) : null;
                })
                .catch(() => null)
        ),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);

    if (raceResult instanceof Date && !Number.isNaN(raceResult.getTime())) {
        await settingsStore.setItem("lastKnownTime", raceResult.getTime());
        await settingsStore.setItem("lastKnownTimeFetchedAt", Date.now());
        return raceResult;
    }

    const localTime = new Date();
    const lastKnown = (await settingsStore.getItem<number>("lastKnownTime")) || 0;
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
        setCookie("ll_inst_id", installationId, 3650);
    } else if (installationId && !settings.installationId) {
        await saveSettings({ ...settings, installationId });
    } else if (!installationId && !settings.installationId) {
        installationId = crypto.randomUUID();
        setCookie("ll_inst_id", installationId, 3650);
        await saveSettings({ ...settings, installationId });
    }

    return installationId || "unknown";
}

export async function incrementUsageCount(): Promise<void> {
    const settings = await getSettings();
    const now = await getSecureTime();
    const history = [...(settings.usageHistory || []), now.toISOString()].slice(-100);
    await saveSettings({ ...settings, usageHistory: history });
    await logAuditEvent("UPDATE_SETTINGS", "Usage limit incremented");
}

export async function getUsageStats(): Promise<{ count30Days: number; isLimited: boolean }> {
    const settings = await getSettings();
    const now = await getSecureTime();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const recent = (settings.usageHistory || []).filter((dateString) => new Date(dateString) > thirtyDaysAgo);

    const isPro = settings.proStatus === "pro" ||
        (settings.proStatus === "trial" && !!settings.trialExpiry && new Date(settings.trialExpiry) > now);

    return {
        count30Days: recent.length,
        isLimited: !isPro && recent.length >= FREE_PAYSLIP_LIMIT,
    };
}

export async function exportData(): Promise<string> {
    const data: {
        version: string;
        timestamp: string;
        employees: unknown[];
        payslips: unknown[];
        leave: unknown[];
        settings: unknown;
    } = {
        version: BACKUP_SCHEMA_VERSION,
        timestamp: new Date().toISOString(),
        employees: [],
        payslips: [],
        leave: [],
        settings: {},
    };

    await employeeStore.iterate((value) => { data.employees.push(decodeData(value)); });
    await payslipStore.iterate((value) => { data.payslips.push(decodeData(value)); });
    await leaveStore.iterate((value) => { data.leave.push(decodeData(value)); });

    const rawSettings = await settingsStore.getItem<EmployerSettings>(SETTINGS_KEY);
    if (rawSettings) {
        const { googleAuthToken, ...safeSettings } = rawSettings;
        void googleAuthToken;
        data.settings = safeSettings;
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
        await Promise.all(parsed.data.employees.map(async (employee) => employeeStore.setItem(employee.id, await encodeData(employee))));
        await Promise.all(parsed.data.payslips.map(async (payslip) => payslipStore.setItem(payslip.id, await encodeData(payslip))));
        await Promise.all(parsed.data.leave.map(async (record) => leaveStore.setItem(record.id, await encodeData(record))));
        await settingsStore.setItem(SETTINGS_KEY, { ...(parsed.data.settings as EmployerSettings) });
        await logAuditEvent("IMPORT_DATA", "Manual data restore completed", {
            version: String(parsed.data.version ?? "legacy"),
            employees: parsed.data.employees.length,
            payslips: parsed.data.payslips.length,
            leaveRecords: parsed.data.leave.length,
        });
        return { success: true };
    } catch {
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
        settingsStore.clear(),
        payPeriodStore.clear(),
        documentStore.clear(),
        contractStore.clear(),
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
    const periods: PayPeriod[] = [];
    await payPeriodStore.iterate<unknown, void>((value: unknown) => {
        if (value) periods.push(decodeData<PayPeriod>(value));
    });
    return periods.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function getPayPeriod(id: string): Promise<PayPeriod | null> {
    const value = await payPeriodStore.getItem<unknown>(id);
    return value ? decodeData<PayPeriod>(value) : null;
}

export async function savePayPeriod(period: PayPeriod): Promise<void> {
    const updated = { ...period, updatedAt: new Date().toISOString() };
    await payPeriodStore.setItem(updated.id, await encodeData(updated));
    await logAuditEvent("CREATE_PAY_PERIOD", `Updated draft pay period: ${period.name}`, { periodId: period.id });
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
    const documents: DocumentMeta[] = [];
    await documentStore.iterate<unknown, void>((value: unknown) => {
        if (value) documents.push(decodeData<DocumentMeta>(value));
    });
    return documents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveDocumentMeta(doc: DocumentMeta): Promise<void> {
    await documentStore.setItem(doc.id, await encodeData(doc));
    await notifyListeners();
}

export async function deleteDocumentMeta(id: string): Promise<void> {
    await documentStore.removeItem(id);
    await notifyListeners();
}

export async function getContracts(): Promise<Contract[]> {
    const contracts: Contract[] = [];
    await contractStore.iterate<unknown, void>((value: unknown) => {
        if (value) contracts.push(decodeData<Contract>(value));
    });
    return contracts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getContractsForEmployee(employeeId: string): Promise<Contract[]> {
    const allContracts = await getContracts();
    return allContracts.filter((contract) => contract.employeeId === employeeId);
}

export async function saveContract(contract: Contract): Promise<void> {
    await contractStore.setItem(contract.id, await encodeData(contract));
    await logAuditEvent("UPDATE_CONTRACT", `Saved contract version ${contract.version} for employee ${contract.employeeId}`, { contractId: contract.id });
    await notifyListeners();
}

export async function deleteContract(id: string): Promise<void> {
    await contractStore.removeItem(id);
    await logAuditEvent("UPDATE_CONTRACT", `Deleted contract ID: ${id}`, { contractId: id });
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
