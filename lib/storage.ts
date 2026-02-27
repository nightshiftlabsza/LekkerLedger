import localforage from "localforage";
import { Employee, PayslipInput, LeaveRecord, EmployerSettings } from "./schema";

const employeeStore = localforage.createInstance({ name: "LekkerLedger", storeName: "employees" });
const payslipStore = localforage.createInstance({ name: "LekkerLedger", storeName: "payslips" });
const leaveStore = localforage.createInstance({ name: "LekkerLedger", storeName: "leave" });
const settingsStore = localforage.createInstance({ name: "LekkerLedger", storeName: "settings" });

// ─── Employee CRUD ──────────────────────────────────────────────────────────

export async function getEmployees(): Promise<Employee[]> {
    const employees: Employee[] = [];
    await employeeStore.iterate<Employee, void>((val) => {
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
    await payslipStore.iterate<PayslipInput, void>((val, key) => {
        if (val.employeeId === id) toDelete.push(key);
    });
    await Promise.all(toDelete.map((k) => payslipStore.removeItem(k)));
    // Also delete associated leave records
    const leaveToDelete: string[] = [];
    await leaveStore.iterate<LeaveRecord, void>((val, key) => {
        if (val.employeeId === id) leaveToDelete.push(key);
    });
    await Promise.all(leaveToDelete.map((k) => leaveStore.removeItem(k)));
}

// ─── Payslip CRUD ───────────────────────────────────────────────────────────

export async function savePayslip(payslip: PayslipInput): Promise<void> {
    await payslipStore.setItem(payslip.id, payslip);
}

export async function getPayslipsForEmployee(employeeId: string): Promise<PayslipInput[]> {
    const payslips: PayslipInput[] = [];
    await payslipStore.iterate<PayslipInput, void>((val) => {
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
    await payslipStore.iterate<PayslipInput, void>((val) => {
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
    await leaveStore.iterate<LeaveRecord, void>((val) => {
        if (val.employeeId === employeeId) records.push(val);
    });
    return records.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

// ─── Settings ─────────────────────────────────────────────────────────────

const SETTINGS_KEY = "employer-settings";

export async function getSettings(): Promise<EmployerSettings> {
    const s = await settingsStore.getItem<EmployerSettings>(SETTINGS_KEY);
    return s ?? { employerName: "", employerAddress: "", employerIdNumber: "", uifRefNumber: "", sdlNumber: "" };
}

export async function saveSettings(settings: EmployerSettings): Promise<void> {
    await settingsStore.setItem(SETTINGS_KEY, settings);
}
