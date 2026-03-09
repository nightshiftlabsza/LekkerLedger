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

    return [
        {
            title: "PARTIES",
            type: "rows",
            rows: [
                { label: "Employer", value: settings.employerName || "(Employer name not set)" },
                { label: "Employer ID / reg", value: settings.employerIdNumber || "—" },
                { label: "Employer address", value: settings.employerAddress || "(Address not set)" },
                { label: "Employer phone", value: settings.phone || "—" },
                { label: "Employee", value: employee.name },
                { label: "Employee ID / passport", value: employee.idNumber || "—" },
                { label: "Employee address", value: contract.employeeAddress || employee.address || "—" },
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
            paragraphs: [`The employee is entitled to ${contract.leave.annualDays} day(s) of annual leave per leave cycle.`],
        },
        {
            title: "SICK LEAVE",
            type: "paragraphs",
            paragraphs: [`The employee is entitled to ${contract.leave.sickDays} day(s) of sick leave in the sick-leave cycle.`],
        },
        {
            title: "MATERNITY & FAMILY LEAVE",
            type: "paragraphs",
            paragraphs: ["Family responsibility leave and maternity leave apply in accordance with the Basic Conditions of Employment Act (BCEA)."],
        },
        {
            title: "DEDUCTIONS",
            type: "paragraphs",
            paragraphs: ["UIF contributions will be deducted from the employee's wages at the statutory rate and remitted to the Unemployment Insurance Fund. No other deductions may be made without the employee's written consent, unless required by law."],
        },
        {
            title: "TERMINATION OF EMPLOYMENT",
            type: "paragraphs",
            paragraphs: [contract.terms.noticeClause],
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
