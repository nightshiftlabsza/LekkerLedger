import localforage from "localforage";
import { Employee, PayslipInput, LeaveRecord, EmployerSettings } from "./schema";

const employeeStore = localforage.createInstance({ name: "LekkerLedger", storeName: "employees" });
const payslipStore = localforage.createInstance({ name: "LekkerLedger", storeName: "payslips" });
const leaveStore = localforage.createInstance({ name: "LekkerLedger", storeName: "leave" });
const settingsStore = localforage.createInstance({ name: "LekkerLedger", storeName: "settings" });

// ─── Employee CRUD ──────────────────────────────────────────────────────────

export async function getEmployees(): Promise<Employee[]> {
    const employees: Employee[] = [];
    await employeeStore.iterate<Employee, void>((val: Employee) => {
        employees.push(val);
    });
    return employees.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getEmployee(id: string): Promise<Employee | null> {
    return employeeStore.getItem<Employee>(id);
}

export async function saveEmployee(employee: Employee): Promise<void> {
    await employeeStore.setItem(employee.id, employee);
}

export async function deleteEmployee(id: string): Promise<void> {
    await employeeStore.removeItem(id);
    // Also delete associated payslips
    const toDelete: string[] = [];
    await payslipStore.iterate<PayslipInput, void>((val: PayslipInput, key: string) => {
        if (val.employeeId === id) toDelete.push(key);
    });
    await Promise.allSettled(toDelete.map((k) => payslipStore.removeItem(k)));
    // Also delete associated leave records
    const leaveToDelete: string[] = [];
    await leaveStore.iterate<LeaveRecord, void>((val: LeaveRecord, key: string) => {
        if (val.employeeId === id) leaveToDelete.push(key);
    });
    await Promise.allSettled(leaveToDelete.map((k) => leaveStore.removeItem(k)));
}

// ─── Payslip CRUD ───────────────────────────────────────────────────────────

export async function savePayslip(payslip: PayslipInput): Promise<void> {
    await payslipStore.setItem(payslip.id, payslip);
}

export async function getPayslipsForEmployee(employeeId: string): Promise<PayslipInput[]> {
    const payslips: PayslipInput[] = [];
    await payslipStore.iterate<PayslipInput, void>((val: PayslipInput) => {
        if (val.employeeId === employeeId) payslips.push(val);
    });
    return payslips.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function getLatestPayslip(employeeId: string): Promise<PayslipInput | null> {
    const payslips = await getPayslipsForEmployee(employeeId);
    return payslips.length > 0 ? payslips[0] : null;
}

export async function getAllPayslips(): Promise<PayslipInput[]> {
    const payslips: PayslipInput[] = [];
    await payslipStore.iterate<PayslipInput, void>((val: PayslipInput) => {
        payslips.push(val);
    });
    return payslips.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

// ─── Leave CRUD ─────────────────────────────────────────────────────────────

export async function saveLeaveRecord(record: LeaveRecord): Promise<void> {
    await leaveStore.setItem(record.id, record);
}

export async function getLeaveForEmployee(employeeId: string): Promise<LeaveRecord[]> {
    const records: LeaveRecord[] = [];
    await leaveStore.iterate<LeaveRecord, void>((val: LeaveRecord) => {
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
    return s ?? { employerName: "", employerAddress: "", employerIdNumber: "", uifRefNumber: "", sdlNumber: "", proStatus: "free" };
}

export async function saveSettings(settings: EmployerSettings): Promise<void> {
    await settingsStore.setItem(SETTINGS_KEY, settings);
}

// ─── Time Verification ──────────────────────────────────────────────────────

export async function getSecureTime(): Promise<Date> {
    const mirrors = [
        "https://worldtimeapi.org/api/timezone/Etc/UTC",
        "https://timeapi.io/api/Time/current/zone?timeZone=UTC",
    ];

    for (const url of mirrors) {
        try {
            const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(3000) });
            if (!res.ok) continue;
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

// ─── Export / Import ───────────────────────────────────────────────────────

export async function exportData(): Promise<string> {
    const data: any = {
        employees: [],
        payslips: [],
        leave: [],
        settings: {},
    };

    await employeeStore.iterate((val) => { data.employees.push(val); });
    await payslipStore.iterate((val) => { data.payslips.push(val); });
    await leaveStore.iterate((val) => { data.leave.push(val); });
    const settings = await settingsStore.getItem<EmployerSettings>(SETTINGS_KEY);
    data.settings = settings || {};

    return JSON.stringify(data);
}

export async function importData(json: string): Promise<void> {
    const data = JSON.parse(json);

    // Clear existing
    await resetAllData();

    // Import new
    if (data.employees) await Promise.all(data.employees.map((e: any) => employeeStore.setItem(e.id, e)));
    if (data.payslips) await Promise.all(data.payslips.map((p: any) => payslipStore.setItem(p.id, p)));
    if (data.leave) await Promise.all(data.leave.map((l: any) => leaveStore.setItem(l.id, l)));
    if (data.settings) await settingsStore.setItem(SETTINGS_KEY, data.settings);
}

export async function resetAllData(): Promise<void> {
    await Promise.all([
        employeeStore.clear(),
        payslipStore.clear(),
        leaveStore.clear(),
        settingsStore.clear(),
    ]);
}
