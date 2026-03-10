import { format } from "date-fns";
import type { Contract, Employee, EmployerSettings } from "../schema";
import { getNMWRecordForDate } from "../legal/registry";

export type ClauseType = "rows" | "paragraphs" | "bullets" | "signatures";

export type Clause = {
    title: string;
    type: ClauseType;
    rows?: { label: string; value: string }[];
    paragraphs?: string[];
    bullets?: string[];
};

export function buildContractClauses(contract: Contract, employee: Employee, settings: EmployerSettings): Clause[] {
    const startDate = contract.effectiveDate ? new Date(contract.effectiveDate) : new Date();
    const effectiveDateStr = format(startDate, "d MMMM yyyy");
    const nmwRecord = getNMWRecordForDate(startDate);
    const nmwDateStr = format(new Date(nmwRecord.effectiveDate), "d MMMM yyyy");

    const employerIdDisplay =
        settings.employerIdNumber?.trim() ||
        "[Add the employer ID / registration number in Settings before anyone signs this contract.]";
    const employerAddressDisplay =
        settings.employerAddress?.trim() ||
        "[Add the employer address in Settings before anyone signs this contract.]";
    const employeeAddressDisplay =
        (contract.employeeAddress || employee.address || "").trim() ||
        "[Add the employee's residential address on the Parties step before anyone signs this contract.]";

    return [
        {
            title: "PARTIES",
            type: "rows",
            rows: [
                { label: "Employer", value: settings.employerName || "(Employer name not set)" },
                { label: "Employer ID / reg", value: employerIdDisplay },
                { label: "Employer address", value: employerAddressDisplay },
                { label: "Employer phone", value: settings.phone || "—" },
                { label: "Employee", value: employee.name },
                { label: "Employee ID / passport", value: employee.idNumber || "—" },
                { label: "Employee address", value: employeeAddressDisplay },
                { label: "Employee phone", value: employee.phone || "—" },
            ],
        },
        {
            title: "EFFECTIVE DATE",
            type: "paragraphs",
            paragraphs: [`Employment began or begins on ${effectiveDateStr}.`],
        },
        {
            title: "PLACE OF WORK",
            type: "rows",
            rows: [
                { label: "Place of work", value: contract.placeOfWork || settings.employerAddress || "(To be confirmed)" },
            ]
        },
        {
            title: "DUTIES",
            type: "bullets",
            bullets: contract.duties.length > 0 ? contract.duties : ["General household duties agreed by the employer and employee."],
        },
        {
            title: "WORKING HOURS",
            type: "rows",
            rows: [
                { label: "Job title", value: contract.jobTitle },
                { label: "Days per week", value: `${contract.workingHours.daysPerWeek} day(s)` },
                { label: "Ordinary hours", value: `${contract.workingHours.startAt} to ${contract.workingHours.endAt}` },
            ]
        },
        {
            title: "MEAL INTERVALS",
            type: "rows",
            rows: [
                { label: "Rest break", value: `${contract.workingHours.breakDuration} minutes` },
            ]
        },
        {
            title: "PAY",
            type: "rows",
            rows: [
                { label: "Wage", value: `R ${contract.salary.amount.toFixed(2)} ${contract.salary.frequency.toLowerCase()}` },
                { label: "Minimum wage check", value: `Current NMW is R ${nmwRecord.rate.toFixed(2)} / hr (effective ${nmwDateStr}). The agreed pay must meet or exceed this rate.` },
                {
                    label: "Payment schedule",
                    value:
                        "Wages are paid at regular intervals in line with the BCEA. Unless the parties record a different arrangement in writing, wages are paid on the last working day of each pay period, by EFT or in cash with a signed acknowledgement.",
                },
                {
                    label: "Payslip and records",
                    value:
                        "With every payment the employer will provide a written payslip showing gross pay, deductions (including UIF), and net pay, and will keep simple wage records as required by the BCEA.",
                },
                ...(contract.terms.paymentDetails?.trim()
                    ? [
                        {
                            label: "Payment notes",
                            value: contract.terms.paymentDetails.trim(),
                        },
                    ]
                    : []),
            ]
        },
        {
            title: "OVERTIME",
            type: "paragraphs",
            paragraphs: [contract.terms.overtimeAgreement],
        },
        {
            title: "SUNDAY & PUBLIC HOLIDAY PAY",
            type: "paragraphs",
            paragraphs: [contract.terms.sundayHolidayAgreement],
        },
        {
            title: "ACCOMMODATION",
            type: "paragraphs",
            paragraphs: [
                contract.terms.accommodationProvided
                    ? `Accommodation forms part of this job. ${contract.terms.accommodationDetails || "The parties should record the room and deduction details clearly in writing."} Note: under Sectoral Determination 7, any accommodation deduction is capped at 10% of the employee's wage.`
                    : "No accommodation arrangement is recorded in this draft."
            ],
        },
        {
            title: "ANNUAL LEAVE",
            type: "paragraphs",
            paragraphs: [
                `The employee is entitled to ${contract.leave.annualDays} day(s) of annual leave per 12‑month leave cycle on full pay, in line with the BCEA and Sectoral Determination 7.`,
                "Annual leave is taken at times agreed between the parties, having regard to the employer's operational requirements. On termination of employment, any accrued but unused annual leave will be paid out together with final wages.",
            ],
        },
        {
            title: "SICK LEAVE",
            type: "paragraphs",
            paragraphs: [
                `The employee is entitled to up to ${contract.leave.sickDays} working day(s) of paid sick leave in each 36‑month sick‑leave cycle, calculated in line with the BCEA.`,
                "During the first 6 months of employment, sick leave accrues at 1 day for every 26 days worked. Thereafter, the full sick‑leave entitlement applies for the remainder of the 36‑month cycle, subject to reasonable proof of incapacity where required.",
            ],
        },
        {
            title: "MATERNITY & FAMILY LEAVE",
            type: "paragraphs",
            paragraphs: [
                "The employee is entitled to at least 4 consecutive months of unpaid maternity leave in terms of the BCEA. UIF maternity benefits may be claimed separately from the Unemployment Insurance Fund, subject to UIF rules.",
                "The employee is also entitled to at least 3 days of family responsibility leave per annual leave cycle for qualifying family‑related events as set out in the BCEA.",
            ],
        },
        {
            title: "DEDUCTIONS",
            type: "paragraphs",
            paragraphs: [
                "UIF contributions will be deducted from the employee's wages at the statutory rate and remitted to the Unemployment Insurance Fund together with the employer's matching contribution, once the employee has been registered for UIF.",
                "No other deductions may be made without the employee's written consent, unless required by law.",
            ],
        },
        {
            title: "TERMINATION OF EMPLOYMENT",
            type: "paragraphs",
            paragraphs: [
                contract.terms.noticeClause,
                "If a dismissal or dispute arises, the parties may refer the matter to the CCMA or the appropriate bargaining council in terms of the Labour Relations Act.",
            ],
        },
        {
            title: "CERTIFICATE OF SERVICE",
            type: "paragraphs",
            paragraphs: ["On termination of employment, the employee is entitled to a certificate of service."],
        },
        {
            title: "GENERAL CONDITIONS",
            type: "paragraphs",
            paragraphs: [
                "This document serves as a record of the employment relationship. Any changes to these terms must be agreed upon in writing.",
                "Basic Conditions of Employment Act (BCEA) rules always apply as the minimum standard.",
                "Note: The employer must register with the Compensation Fund (COIDA) to ensure the employee is covered for any occupational injuries and diseases in accordance with the law."
            ]
        },
        {
            title: "SIGNATURES",
            type: "signatures",
        }
    ];
}
