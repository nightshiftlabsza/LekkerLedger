export interface QuickAction {
    id: string;
    title: string;
    description: string;
    cta: string;
    href: string;
}

export interface TaskGuide {
    id: string;
    title: string;
    intro: string;
    check: string[];
    mistake: string;
    next: string;
}

export interface OfficialSource {
    label: string;
    href: string;
}

export const helpAdminContent = {
    title: "Household employer admin guide",
    intro: "A clean reference for busy household employers to manage payroll and documentation.",
    disclaimer: "General information only. LekkerLedger helps household employers prepare records, calculations, and common admin documents. It is not legal advice, and you should verify requirements against official government sources before relying on them.",
    quickActions: [
        {
            id: "employer-details",
            title: "Set up employer details",
            description: "Add your contact info and identifiers like UIF or Compensation Fund references.",
            cta: "Go to Settings",
            href: "/settings"
        },
        {
            id: "add-employee",
            title: "Add an employee",
            description: "Record the worker’s details, start date, role, and agreed hours.",
            cta: "Go to Employees",
            href: "/employees"
        },
        {
            id: "run-payroll",
            title: "Run monthly payroll",
            description: "Turn the agreement into a clear pay record for the month.",
            cta: "Go to Payroll",
            href: "/payroll"
        },
        {
            id: "export-payslips",
            title: "Export payslips",
            description: "Generate and download payslips or payment summaries for your records.",
            cta: "Go to Documents",
            href: "/documents"
        },
        {
            id: "uif-help",
            title: "UIF help",
            description: "Prepare your monthly 1% + 1% contributions for uFiling.",
            cta: "Go to UIF",
            href: "/ufiling"
        },
        {
            id: "roe-help",
            title: "Return of Earnings",
            description: "Gather annual totals and prepare your ROE pack for the Compensation Fund.",
            cta: "Open ROE wizard",
            href: "/compliance/coida/roe"
        }
    ] as QuickAction[],
    taskGuides: [
        {
            id: "settings",
            title: "Settings",
            intro: "This screen collects identifying details that prefill your exports and documents.",
            check: [
                "Employer full name and household address.",
                "Mobile number and email for official portals.",
                "UIF and Compensation Fund reference numbers."
            ],
            mistake: "Mixing employer and worker data in the same fields.",
            next: "Verify names match your official registration records."
        },
        {
            id: "employees",
            title: "Employees",
            intro: "Record the core employment arrangement and written particulars.",
            check: [
                "Full name and ID/passport details.",
                "Start date and job role (e.g., cleaner, gardener).",
                "Agreed ordinary hours and pay basis (hourly, weekly, etc.)."
            ],
            mistake: "Leaving hours vague or omitting the start date.",
            next: "Ensure you have a signed written agreement on file."
        },
        {
            id: "payroll",
            title: "Monthly payroll",
            intro: "Turn the agreed hours into numbers for the current pay period.",
            check: [
                "Exact pay period dates.",
                "Ordinary hours worked vs overtime or holiday work.",
                "Lawful deductions only (like UIF 1%+1% if eligible)."
            ],
            mistake: "Deducting UIF for workers below the 24-hours-per-month threshold.",
            next: "Run a sense-check against the National Minimum Wage (R30.23/hr)."
        },
        {
            id: "payslips",
            title: "Payslips & records",
            intro: "Official proof of pay for the worker and records for the employer.",
            check: [
                "Names, dates, and gross remuneration are correct.",
                "Deductions are clearly itemized.",
                "Original records are kept for at least 3 years."
            ],
            mistake: "Exporting documents without checking the period totals first.",
            next: "Archive a digital or physical copy for every pay period."
        },
        {
            id: "uif",
            title: "UIF",
            intro: "Monthly declaration and payment for workers working 24+ hours per month.",
            check: [
                "1% employee + 1% employer contribution totals.",
                "Earnings are below the SARS UIF ceiling (R17,712/month).",
                "Submission is done via uFiling by the 7th of each month."
            ],
            mistake: "Assuming the app submits to uFiling for you automatically.",
            next: "Check your uFiling status after every monthly payment."
        },
        {
            id: "roe",
            title: "Return of Earnings",
            intro: "Annual earnings report required for the Compensation Fund.",
            check: [
                "Actual earnings for the completed assessment period.",
                "Provisional earnings estimate for the next period.",
                "COIDA registration number is valid and saved."
            ],
            mistake: "Waiting for the filing window to close before gathering records.",
            next: "Verify the current year's filing dates on the official portal."
        }
    ] as TaskGuide[],
    officialSources: [
        { label: "Department of Employment and Labour", href: "https://www.labour.gov.za" },
        { label: "SARS (UIF Contributions)", href: "https://www.sars.gov.za/tax-types/uif/" },
        { label: "uFiling (UIF Declarations)", href: "https://www.ufiling.co.za" },
        { label: "Compensation Fund (ROE Online)", href: "https://cfonline.labour.gov.za" },
        { label: "CCMA (Dispute Guidance)", href: "https://www.ccma.org.za" }
    ] as OfficialSource[],
    sourceNotes: "LekkerLedger references official domestic-worker sample contracts and the Basic Conditions of Employment Act. The 2026 National Minimum Wage of R30.23/hr is the current baseline for all calculations. Always refer to official government notices for the most up-to-date thresholds and filing windows."
};
