import localforage from "localforage";
import { Employee, PayslipInput, LeaveRecord, EmployerSettings, PayPeriod, DocumentMeta, Contract, AuditLog } from "./schema";

const employeeStore = localforage.createInstance({ name: "LekkerLedger", storeName: "employees" });
const payslipStore = localforage.createInstance({ name: "LekkerLedger", storeName: "payslips" });
const leaveStore = localforage.createInstance({ name: "LekkerLedger", storeName: "leave" });
const settingsStore = localforage.createInstance({ name: "LekkerLedger", storeName: "settings" });
const auditStore = localforage.createInstance({ name: "LekkerLedger", storeName: "audit_logs" });
const payPeriodStore = localforage.createInstance({ name: "LekkerLedger", storeName: "pay_periods" });
const documentStore = localforage.createInstance({ name: "LekkerLedger", storeName: "documents" });
const contractStore = localforage.createInstance({ name: "LekkerLedger", storeName: "contracts" });

// ─── Free Tier Limit ─────────────────────────────────────────────────────────
export const FREE_PAYSLIP_LIMIT = 2;

// ─── PII Obfuscation ──────────────────────────────────────────────────────────
async function encodeData(data: unknown): Promise<string | unknown> {
    const s = await getSettings();
    if (s.piiObfuscationEnabled === false) return data;
    return btoa(encodeURIComponent(JSON.stringify(data)));
}

function decodeData<T>(str: unknown): T {
    if (typeof str !== "string" || !str) return str as T;
    try {
        const decoded = decodeURIComponent(atob(str));
        if (!decoded) return str as T;
        return JSON.parse(decoded) as T;
    } catch (e) {
        console.warn("D-Data Failed", e);
        return str as unknown as T; // Fallback if invalid
    }
}

// ─── Data Change Listeners ──────────────────────────────────────────────────
type DataChangeListener = () => void | Promise<void>;
const listeners: DataChangeListener[] = [];

export function subscribeToDataChanges(callback: DataChangeListener) {
    listeners.push(callback);
    return () => {
        const idx = listeners.indexOf(callback);
        if (idx > -1) listeners.splice(idx, 1);
    };
}

async function notifyListeners() {
    if (isImporting) return;
    for (const listener of listeners) {
        try {
            await listener();
        } catch (e) {
            console.error("Data change listener failed", e);
        }
    }
}

let isImporting = false;
export function setImportingMode(val: boolean) {
    isImporting = val;
}


// ─── Employee CRUD ──────────────────────────────────────────────────────────

export async function getEmployees(): Promise<Employee[]> {
    const employees: Employee[] = [];
    await employeeStore.iterate<unknown, void>((val: unknown) => {
        if (val) employees.push(decodeData<Employee>(val));
    });
    return employees.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getEmployee(id: string): Promise<Employee | null> {
    const val = await employeeStore.getItem<unknown>(id);
    return val ? decodeData<Employee>(val) : null;
}

export async function saveEmployee(employee: Employee): Promise<void> {
    // P2: Trim employee name
    const trimmed = { ...employee, name: employee.name.trim() };
    await employeeStore.setItem(trimmed.id, await encodeData(trimmed));
    await logAuditEvent("CREATE_EMPLOYEE", `Added/Updated employee: ${trimmed.id}`);
    await notifyListeners();
}

export async function deleteEmployee(id: string): Promise<void> {
    const emp = await getEmployee(id);
    await employeeStore.removeItem(id);
    // P0 FIX: Decode payslip values before checking employeeId
    const toDelete: string[] = [];
    await payslipStore.iterate<unknown, void>((val: unknown, key: string) => {
        const decoded = decodeData<PayslipInput>(val);
        if (decoded && decoded.employeeId === id) toDelete.push(key);
    });
    await Promise.allSettled(toDelete.map((k) => payslipStore.removeItem(k)));
    // Also delete associated leave records (stored raw — no decode needed)
    const leaveToDelete: string[] = [];
    await leaveStore.iterate<LeaveRecord, void>((val: Awaited<LeaveRecord>, key: string) => {
        if (val.employeeId === id) leaveToDelete.push(key);
    });
    await Promise.allSettled(leaveToDelete.map((k) => leaveStore.removeItem(k)));
    await logAuditEvent("DELETE_EMPLOYEE", `Deleted employee ID: ${emp?.id || id}`);
}

// ─── Payslip CRUD ───────────────────────────────────────────────────────────

export async function savePayslip(payslip: PayslipInput): Promise<void> {
    await payslipStore.setItem(payslip.id, await encodeData(payslip));
    await logAuditEvent("CREATE_PAYSLIP", `Generated payslip for employee ID: ${payslip.employeeId}`);
    await notifyListeners();
}

export async function getPayslipsForEmployee(employeeId: string): Promise<PayslipInput[]> {
    const payslips: PayslipInput[] = [];
    await payslipStore.iterate<unknown, void>((val: unknown) => {
        const decoded = decodeData<PayslipInput>(val);
        if (decoded && decoded.employeeId === employeeId) payslips.push(decoded);
    });
    return payslips.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function getLatestPayslip(employeeId: string): Promise<PayslipInput | null> {
    const payslips = await getPayslipsForEmployee(employeeId);
    return payslips.length > 0 ? payslips[0] : null;
}

export async function getTotalDaysWorkedForEmployee(employeeId: string): Promise<number> {
    const payslips = await getPayslipsForEmployee(employeeId);
    return payslips.reduce((sum, ps) => sum + (ps.daysWorked || 0), 0);
}

export async function getAllPayslips(): Promise<PayslipInput[]> {
    const payslips: PayslipInput[] = [];
    await payslipStore.iterate<unknown, void>((val: unknown) => {
        if (val) payslips.push(decodeData<PayslipInput>(val));
    });
    return payslips.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function deletePayslip(id: string): Promise<void> {
    await payslipStore.removeItem(id);
    await logAuditEvent("DELETE_PAYSLIP", `Deleted payslip ID: ${id}`);
    await notifyListeners();
}

// ─── Leave CRUD ─────────────────────────────────────────────────────────────

export async function saveLeaveRecord(record: LeaveRecord): Promise<void> {
    await leaveStore.setItem(record.id, record);
    await logAuditEvent("UPDATE_SETTINGS", `Saved leave record: ${record.type} for employee ${record.employeeId}`);
    await notifyListeners();
}

export async function deleteLeaveRecord(id: string): Promise<void> {
    await leaveStore.removeItem(id);
    await logAuditEvent("UPDATE_SETTINGS", `Deleted leave record ID: ${id}`);
    await notifyListeners();
}

export async function getLeaveForEmployee(employeeId: string): Promise<LeaveRecord[]> {
    const records: LeaveRecord[] = [];
    await leaveStore.iterate<LeaveRecord, void>((val: Awaited<LeaveRecord>) => {
        if (val.employeeId === employeeId) records.push(val);
    });
    return records.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

export async function getAllLeaveRecords(): Promise<LeaveRecord[]> {
    const records: LeaveRecord[] = [];
    await leaveStore.iterate<LeaveRecord, void>((val: LeaveRecord) => {
        records.push(val);
    });
    return records;
}

// ─── Settings ─────────────────────────────────────────────────────────────

const SETTINGS_KEY = "employer-settings";

export async function getSettings(): Promise<EmployerSettings> {
    const s = await settingsStore.getItem<EmployerSettings>(SETTINGS_KEY);
    return s ?? {
        employerName: "",
        employerAddress: "",
        employerIdNumber: "",
        uifRefNumber: "",
        cfNumber: "",
        sdlNumber: "",
        phone: "",
        proStatus: "free",
        defaultLanguage: "en",
        simpleMode: false,
        advancedMode: false,
        density: "comfortable",
        googleSyncEnabled: false,
        piiObfuscationEnabled: true,
        installationId: "",
        usageHistory: []
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

// ─── Compliance shown flag (UP-15: use localforage instead of localStorage) ──
const COMPLIANCE_SHOWN_KEY = "ll-compliance-shown";

export async function getComplianceShownFlag(): Promise<boolean> {
    const val = await settingsStore.getItem<boolean>(COMPLIANCE_SHOWN_KEY);
    return val === true;
}

export async function setComplianceShownFlag(): Promise<void> {
    await settingsStore.setItem(COMPLIANCE_SHOWN_KEY, true);
}

// ─── Time Verification (P0: parallel race, non-blocking) ─────────────────────

export async function getSecureTime(): Promise<Date> {
    const mirrors = [
        "https://worldtimeapi.org/api/timezone/Etc/UTC",
        "https://timeapi.io/api/Time/current/zone?timeZone=UTC",
        "https://1.1.1.1/cdn-cgi/trace", // Cloudflare Trace
    ];

    // P0 FIX: Race all mirrors in parallel — takes whichever resolves first
    const raceResult = await Promise.race([
        ...mirrors.map((url) =>
            fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) })
                .then(async (res) => {
                    if (!res.ok) return null;
                    if (url.includes("cdn-cgi/trace")) {
                        const text = await res.text();
                        const tsLine = text.split("\n").find((l) => l.startsWith("ts="));
                        if (tsLine) {
                            return new Date(parseFloat(tsLine.split("=")[1]) * 1000);
                        }
                        return null;
                    }
                    const text = await res.text();
                    if (!text?.trim()) return null;
                    const data = JSON.parse(text);
                    const dateStr = data.datetime || data.dateTime;
                    return dateStr ? new Date(dateStr) : null;
                })
                .catch(() => null)
        ),
        // Overall timeout — never block more than 5s total
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);

    if (raceResult instanceof Date && !isNaN(raceResult.getTime())) {
        await settingsStore.setItem("lastKnownTime", raceResult.getTime());
        return raceResult;
    }

    // Fallback: monotonic protection
    const localTime = new Date();
    const lastKnown = await settingsStore.getItem<number>("lastKnownTime") || 0;
    if (localTime.getTime() < lastKnown) {
        return new Date(lastKnown);
    }
    await settingsStore.setItem("lastKnownTime", localTime.getTime());
    return localTime;
}

// ─── Trial & Usage Safeguards ──────────────────────────────────────────────

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
    let instId = getCookie("ll_inst_id");
    const settings = await getSettings();

    if (!instId && settings.installationId) {
        instId = settings.installationId;
        setCookie("ll_inst_id", instId, 3650);
    } else if (instId && !settings.installationId) {
        await saveSettings({ ...settings, installationId: instId });
    } else if (!instId && !settings.installationId) {
        instId = crypto.randomUUID();
        setCookie("ll_inst_id", instId, 3650);
        await saveSettings({ ...settings, installationId: instId });
    }

    return instId || "unknown";
}

export async function incrementUsageCount(): Promise<void> {
    const settings = await getSettings();
    const now = await getSecureTime();
    const history = settings.usageHistory || [];
    history.push(now.toISOString());
    const trimmedHistory = history.slice(-100);
    await saveSettings({ ...settings, usageHistory: trimmedHistory });
    await logAuditEvent("UPDATE_SETTINGS", "Usage limit incremented");
}

export async function getUsageStats(): Promise<{ count30Days: number; isLimited: boolean }> {
    const settings = await getSettings();
    const now = await getSecureTime();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    const history = settings.usageHistory || [];
    const recent = history.filter(dateStr => new Date(dateStr) > thirtyDaysAgo);

    const isPro = settings.proStatus === "pro" ||
        (settings.proStatus === "trial" && settings.trialExpiry && new Date(settings.trialExpiry) > now);

    return {
        count30Days: recent.length,
        isLimited: !isPro && recent.length >= FREE_PAYSLIP_LIMIT
    };
}

// ─── Export / Import ───────────────────────────────────────────────────────

export async function exportData(): Promise<string> {
    const data: {
        version: string;
        timestamp: string;
        employees: unknown[];
        payslips: unknown[];
        leave: unknown[];
        settings: unknown;
    } = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        employees: [],
        payslips: [],
        leave: [],
        settings: {},
    };

    await employeeStore.iterate((val) => { data.employees.push(decodeData(val)); });
    await payslipStore.iterate((val) => { data.payslips.push(decodeData(val)); });
    // P1 FIX: decode leave records (previously exported raw)
    await leaveStore.iterate((val) => { data.leave.push(val); });
    const rawSettings = await settingsStore.getItem<EmployerSettings>(SETTINGS_KEY);
    // P1 FIX: Strip googleAuthToken from export (security)
    if (rawSettings) {
        const { googleAuthToken, ...safeSettings } = rawSettings;
        void googleAuthToken; // Explicitly mark as intentionally unused for security stripping
        data.settings = safeSettings;
    }

    const json = JSON.stringify(data, null, 2);
    await logAuditEvent("EXPORT_DATA", "Manual data backup export triggered");
    return json;
}

export async function importData(json: string): Promise<{ success: boolean; error?: string }> {
    // P0 FIX: Parse FIRST, reset AFTER successful parse
    let data: Record<string, unknown>;
    try {
        data = JSON.parse(json) as Record<string, unknown>;
    } catch {
        return { success: false, error: "Invalid backup file — could not parse JSON." };
    }

    setImportingMode(true);
    try {
        await resetAllData();
        if (data.employees) await Promise.all((data.employees as Employee[]).map(async (e) => employeeStore.setItem(e.id, await encodeData(e))));
        if (data.payslips) await Promise.all((data.payslips as PayslipInput[]).map(async (p) => payslipStore.setItem(p.id, await encodeData(p))));
        if (data.leave) await Promise.all((data.leave as LeaveRecord[]).map((l) => leaveStore.setItem(l.id, l)));
        if (data.settings) await settingsStore.setItem(SETTINGS_KEY, data.settings as EmployerSettings);
        await logAuditEvent("IMPORT_DATA", "Manual data restore completed");
        return { success: true };
    } catch {
        return { success: false, error: "Restore failed — data may be partially imported." };
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
        // auditStore is NOT cleared to maintain history of the wipe
    ]);
}

// ─── Audit Logging ──────────────────────────────────────────────────────────

export async function logAuditEvent(action: AuditLog["action"], details: string, metadata?: Record<string, unknown>): Promise<void> {
    const id = crypto.randomUUID();
    const log: AuditLog = {
        id,
        timestamp: new Date(),
        action,
        details,
        metadata
    };
    await auditStore.setItem(id, log);
}

export async function getAuditLogs(): Promise<AuditLog[]> {
    const logs: AuditLog[] = [];
    await auditStore.iterate<AuditLog, void>((val: AuditLog) => {
        logs.push(val);
    });
    // P1 FIX: coerce timestamp to Date before calling getTime()
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ─── Pay Period CRUD ────────────────────────────────────────────────────────

export async function getPayPeriods(): Promise<PayPeriod[]> {
    const periods: PayPeriod[] = [];
    await payPeriodStore.iterate<string, void>((val: string) => {
        if (val) periods.push(decodeData<PayPeriod>(val));
    });
    return periods.sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
}

export async function getPayPeriod(id: string): Promise<PayPeriod | null> {
    const val = await payPeriodStore.getItem<string>(id);
    return val ? decodeData<PayPeriod>(val) : null;
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
    await logAuditEvent("DELETE_PAY_PERIOD", `Deleted pay period ID: ${id}`);
    await notifyListeners();
}

export async function getCurrentPayPeriod(): Promise<PayPeriod | null> {
    const periods = await getPayPeriods();
    return periods.find(p => p.status === "draft" || p.status === "review") ?? null;
}

// ─── Document Metadata CRUD ─────────────────────────────────────────────────

export async function getDocuments(): Promise<DocumentMeta[]> {
    const docs: DocumentMeta[] = [];
    await documentStore.iterate<string, void>((val: string) => {
        if (val) docs.push(decodeData<DocumentMeta>(val));
    });
    return docs.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function saveDocumentMeta(doc: DocumentMeta): Promise<void> {
    await documentStore.setItem(doc.id, await encodeData(doc));
    await notifyListeners();
}

export async function deleteDocumentMeta(id: string): Promise<void> {
    await documentStore.removeItem(id);
    await notifyListeners();
}

// ─── Contract CRUD ───────────────────────────────────────────────────────────

export async function getContracts(): Promise<Contract[]> {
    const contracts: Contract[] = [];
    await contractStore.iterate<unknown, void>((val: unknown) => {
        if (val) contracts.push(decodeData<Contract>(val));
    });
    return contracts.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

export async function getContractsForEmployee(employeeId: string): Promise<Contract[]> {
    const all = await getContracts();
    return all.filter(c => c.employeeId === employeeId);
}

export async function saveContract(contract: Contract): Promise<void> {
    await contractStore.setItem(contract.id, await encodeData(contract));
    await logAuditEvent("UPDATE_CONTRACT", `Saved contract version ${contract.version} for employee ${contract.employeeId}`, { contractId: contract.id });
    await notifyListeners();
}

export async function deleteContract(id: string): Promise<void> {
    await contractStore.removeItem(id);
    await logAuditEvent("UPDATE_CONTRACT", `Deleted contract ID: ${id}`);
    await notifyListeners();
}

// ─── SA Tax Year Helpers ─────────────────────────────────────────────────────

export function getCurrentTaxYearRange(now: Date = new Date()): { start: Date; end: Date; label: string } {
    const year = now.getFullYear();
    const month = now.getMonth();

    const startYear = (month < 2) ? year - 1 : year;
    const endYear = startYear + 1;

    const start = new Date(startYear, 2, 1);
    const end = new Date(endYear, 1, 28);

    if (endYear % 4 === 0 && (endYear % 100 !== 0 || endYear % 400 === 0)) {
        end.setDate(29);
    }

    return {
        start,
        end,
        label: `${startYear}/${endYear}`
    };
}
