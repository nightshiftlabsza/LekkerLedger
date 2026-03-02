import localforage from "localforage";
import { Employee, PayslipInput, LeaveRecord, EmployerSettings } from "./schema";

const employeeStore = localforage.createInstance({ name: "LekkerLedger", storeName: "employees" });
const payslipStore = localforage.createInstance({ name: "LekkerLedger", storeName: "payslips" });
const leaveStore = localforage.createInstance({ name: "LekkerLedger", storeName: "leave" });
const settingsStore = localforage.createInstance({ name: "LekkerLedger", storeName: "settings" });
const auditStore = localforage.createInstance({ name: "LekkerLedger", storeName: "audit_logs" });

// ─── PII Obfuscation ──────────────────────────────────────────────────────────
function encodeData(data: any): string {
    return btoa(encodeURIComponent(JSON.stringify(data)));
}

function decodeData<T>(str: any): T {
    if (typeof str !== "string") return str as T; // Fallback for legacy unencoded data
    try {
        return JSON.parse(decodeURIComponent(atob(str))) as T;
    } catch {
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
    await employeeStore.iterate<any, void>((val: any) => {
        if (val) employees.push(decodeData<Employee>(val));
    });
    return employees.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getEmployee(id: string): Promise<Employee | null> {
    const val = await employeeStore.getItem<any>(id);
    return val ? decodeData<Employee>(val) : null;
}

export async function saveEmployee(employee: Employee): Promise<void> {
    await employeeStore.setItem(employee.id, encodeData(employee));
    await logAuditEvent("CREATE_EMPLOYEE", `Added/Updated employee: ${employee.name}`);
    await notifyListeners();
}

export async function deleteEmployee(id: string): Promise<void> {
    const emp = await getEmployee(id);
    await employeeStore.removeItem(id);
    // Also delete associated payslips
    const toDelete: string[] = [];
    await payslipStore.iterate<PayslipInput, void>((val: Awaited<PayslipInput>, key: string) => {
        if (val.employeeId === id) toDelete.push(key);
    });
    await Promise.allSettled(toDelete.map((k) => payslipStore.removeItem(k)));
    // Also delete associated leave records
    const leaveToDelete: string[] = [];
    await leaveStore.iterate<LeaveRecord, void>((val: Awaited<LeaveRecord>, key: string) => {
        if (val.employeeId === id) leaveToDelete.push(key);
    });
    await Promise.allSettled(leaveToDelete.map((k) => leaveStore.removeItem(k)));
    await logAuditEvent("DELETE_EMPLOYEE", `Deleted employee: ${emp?.name || id}`);
}

// ─── Payslip CRUD ───────────────────────────────────────────────────────────

export async function savePayslip(payslip: PayslipInput): Promise<void> {
    await payslipStore.setItem(payslip.id, encodeData(payslip));
    await logAuditEvent("CREATE_PAYSLIP", `Generated payslip for ID: ${payslip.employeeId}`);
    await notifyListeners();
}

export async function getPayslipsForEmployee(employeeId: string): Promise<PayslipInput[]> {
    const payslips: PayslipInput[] = [];
    await payslipStore.iterate<any, void>((val: any) => {
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
    await payslipStore.iterate<any, void>((val: any) => {
        if (val) payslips.push(decodeData<PayslipInput>(val));
    });
    return payslips.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

// ─── Leave CRUD ─────────────────────────────────────────────────────────────

export async function saveLeaveRecord(record: LeaveRecord): Promise<void> {
    await leaveStore.setItem(record.id, record);
    await notifyListeners();
}

export async function deleteLeaveRecord(id: string): Promise<void> {
    await leaveStore.removeItem(id);
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
        sdlNumber: "",
        proStatus: "free",
        defaultLanguage: "en",
        simpleMode: false,
        advancedMode: false,
        googleSyncEnabled: false,
        installationId: "",
        usageHistory: []
    };
}

export async function saveSettings(settings: EmployerSettings): Promise<void> {
    await settingsStore.setItem(SETTINGS_KEY, settings);
    await logAuditEvent("UPDATE_SETTINGS", "Employer settings updated");
    await notifyListeners();
}

// ─── Time Verification ──────────────────────────────────────────────────────

export async function getSecureTime(): Promise<Date> {
    const mirrors = [
        "https://worldtimeapi.org/api/timezone/Etc/UTC",
        "https://timeapi.io/api/Time/current/zone?timeZone=UTC",
        "https://1.1.1.1/cdn-cgi/trace", // Cloudflare Trace (High Reliability)
    ];

    for (const url of mirrors) {
        try {
            const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) }); // Increased to 5000ms for SA networks
            if (!res.ok) continue;

            if (url.includes("cdn-cgi/trace")) {
                const text = await res.text();
                const tsLine = text.split("\n").find(line => line.startsWith("ts="));
                if (tsLine) {
                    const epoch = parseFloat(tsLine.split("=")[1]) * 1000;
                    const serverDate = new Date(epoch);
                    await settingsStore.setItem("lastKnownTime", serverDate.getTime());
                    return serverDate;
                }
                continue;
            }

            const data = await res.json();
            // worldtimeapi vs timeapi.io handling
            const dateStr = data.datetime || data.dateTime;
            if (!dateStr) continue;

            const serverDate = new Date(dateStr);
            await settingsStore.setItem("lastKnownTime", serverDate.getTime());
            return serverDate;
        } catch (e) {
            console.warn(`Time mirror failed: ${url}`, e);
        }
    }

    // Fallback to local time, but protect against backwards drift (monotonic protection)
    const localTime = new Date();
    const lastKnown = await settingsStore.getItem<number>("lastKnownTime") || 0;
    if (localTime.getTime() < lastKnown) {
        // Clock was moved back - return last known safe time instead
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
    // 1. Check Cookie
    let instId = getCookie("ll_inst_id");

    // 2. Check Local Settings
    const settings = await getSettings();

    if (!instId && settings.installationId) {
        instId = settings.installationId;
        setCookie("ll_inst_id", instId, 3650);
    } else if (instId && !settings.installationId) {
        await saveSettings({ ...settings, installationId: instId });
    } else if (!instId && !settings.installationId) {
        // 3. Generate New
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
    // Keep only last 100 entries
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
        isLimited: !isPro && recent.length >= 2 // Limit to 2 per month for free users
    };
}

// ─── Export / Import ───────────────────────────────────────────────────────

export async function exportData(): Promise<string> {
    const data: any = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        employees: [],
        payslips: [],
        leave: [],
        settings: {},
    };

    await employeeStore.iterate((val) => { data.employees.push(decodeData(val)); });
    await payslipStore.iterate((val) => { data.payslips.push(decodeData(val)); });
    await leaveStore.iterate((val) => { data.leave.push(val); });
    const settings = await settingsStore.getItem<EmployerSettings>(SETTINGS_KEY);
    data.settings = settings || {};

    return JSON.stringify(data, null, 2);
}

export async function importData(json: string): Promise<void> {
    const data = JSON.parse(json);
    setImportingMode(true);
    try {
        // Clear existing
        await resetAllData();

        // Import new
        if (data.employees) await Promise.all(data.employees.map((e: any) => employeeStore.setItem(e.id, encodeData(e))));
        if (data.payslips) await Promise.all(data.payslips.map((p: any) => payslipStore.setItem(p.id, encodeData(p))));
        if (data.leave) await Promise.all(data.leave.map((l: any) => leaveStore.setItem(l.id, l)));
        if (data.settings) await settingsStore.setItem(SETTINGS_KEY, data.settings);
    } finally {
        setImportingMode(false);
        await notifyListeners(); // One final notify after everything is in
    }
}

export async function resetAllData(): Promise<void> {
    await Promise.all([
        employeeStore.clear(),
        payslipStore.clear(),
        leaveStore.clear(),
        settingsStore.clear(),
        auditStore.clear(), // Clear audit log too
    ]);
}

// ─── Audit Logging ──────────────────────────────────────────────────────────
import { AuditLog } from "./schema";

export async function logAuditEvent(action: AuditLog["action"], details: string, metadata?: any): Promise<void> {
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
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// ─── SA Tax Year Helpers ─────────────────────────────────────────────────────

export function getCurrentTaxYearRange(now: Date = new Date()): { start: Date; end: Date; label: string } {
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    // If we are in Jan (0) or Feb (1), the tax year started in Mar of previous year
    // If we are in Mar (2) or later, the tax year started in Mar of this year
    let startYear = (month < 2) ? year - 1 : year;
    let endYear = startYear + 1;

    const start = new Date(startYear, 2, 1); // March 1st
    const end = new Date(endYear, 1, 28); // Feb 28th

    // Check for leap year
    if (endYear % 4 === 0 && (endYear % 100 !== 0 || endYear % 400 === 0)) {
        end.setDate(29);
    }

    return {
        start,
        end,
        label: `${startYear}/${endYear}`
    };
}
