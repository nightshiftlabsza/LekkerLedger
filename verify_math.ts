import { getNMW, calculatePayslip } from "./lib/calculator";

// Mocking the imports manually if needed, but tsx should handle this if paths are correct.
// The issue might be the missing 'schema' or 'date-fns' dependencies in the environment.

const testDates = [
    { date: new Date("2026-02-28"), expectedNMW: 28.79, label: "Before Cliff" },
    { date: new Date("2026-03-01"), expectedNMW: 30.23, label: "After Cliff" }
];

console.log("--- LEKKERLEDGER WAGE VERIFICATION ---");

testDates.forEach(t => {
    const nmw = getNMW(t.date);
    console.log(`[${t.label}] Date: ${t.date.toDateString()}, NMW: R${nmw}`);
    if (nmw !== t.expectedNMW) {
        console.error(`FAIL: Expected ${t.expectedNMW}, got ${nmw}`);
    } else {
        console.log(`PASS: NMW correctly identified.`);
    }
});

console.log("\n--- 4-HOUR RULE VERIFICATION ---");

const mockInput: any = {
    id: "test",
    employeeId: "emp1",
    payPeriodStart: new Date("2026-03-01"),
    payPeriodEnd: new Date("2026-03-01"),
    ordinaryHours: 2,
    shortFallHours: 2,
    overtimeHours: 0,
    sundayHours: 0,
    publicHolidayHours: 0,
    daysWorked: 1,
    hourlyRate: 30.23,
    ordinarilyWorksSundays: false,
    ordinaryHoursPerDay: 8,
    includeAccommodation: false,
    createdAt: new Date(),
};

const breakdown = calculatePayslip(mockInput);
const expectedPay = 4 * 30.23;

console.log(`Input Hours: 2 (+ 2 shortfall)`);
console.log(`Calculated Ordinary Pay: R${breakdown.ordinaryPay}`);
if (Math.abs(breakdown.ordinaryPay - expectedPay) < 0.01) {
    console.log("PASS: 4-hour rule correctly applied via shortfall.");
} else {
    console.error(`FAIL: Expected R${expectedPay}, got R${breakdown.ordinaryPay}`);
}
