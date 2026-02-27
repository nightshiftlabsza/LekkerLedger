import localforage from "localforage";
import { Employee, PayslipInput } from "./schema";

// Initialize stores
const employeeStore = localforage.createInstance({
  name: "LekkerLedger",
  storeName: "employees",
});

const payslipStore = localforage.createInstance({
  name: "LekkerLedger",
  storeName: "payslips",
});

// Employee Actions
export async function getEmployees(): Promise<Employee[]> {
  const employees: Employee[] = [];
  try {
    await employeeStore.iterate((value: Employee) => {
      employees.push(value);
    });
    return employees;
  } catch (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
}

export async function saveEmployee(employee: Employee): Promise<void> {
  try {
    await employeeStore.setItem(employee.id, employee);
  } catch (error) {
    console.error("Error saving employee:", error);
    throw error;
  }
}

export async function deleteEmployee(id: string): Promise<void> {
  try {
    await employeeStore.removeItem(id);
  } catch (error) {
    console.error("Error deleting employee:", error);
    throw error;
  }
}

// Payslip Actions
export async function savePayslip(payslip: PayslipInput): Promise<void> {
  try {
    await payslipStore.setItem(payslip.id, payslip);
  } catch (error) {
    console.error("Error saving payslip:", error);
    throw error;
  }
}

export async function getPayslipsForEmployee(
  employeeId: string,
): Promise<PayslipInput[]> {
  const payslips: PayslipInput[] = [];
  try {
    await payslipStore.iterate((value: PayslipInput) => {
      if (value.employeeId === employeeId) {
        payslips.push(value);
      }
    });
    return payslips.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } catch (error) {
    console.error("Error fetching payslips:", error);
    return [];
  }
}
