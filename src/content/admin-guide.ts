export type FootnoteId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface GuideListItem {
    lead?: string;
    text: string;
    footnotes?: number[];
}

export type GuideBlock =
    | {
        type: "paragraph";
        text: string;
        footnotes?: number[];
    }
    | {
        type: "list";
        ordered?: boolean;
        items: GuideListItem[];
    };

export interface GuideSubsection {
    title: string;
    blocks: GuideBlock[];
}

export interface StartHereStep {
    id: string;
    title: string;
    screenLabel: string;
    screenHref: string;
    seeAlsoId: string;
    whatToDo: string;
    whatItMeans: string;
    commonMistakes: string;
    footnotes?: number[];
}

export interface GuideSection {
    id: string;
    title: string;
    screenLabel?: string;
    screenHref?: string;
    intro?: GuideBlock[];
    subsections?: GuideSubsection[];
    wizardSteps?: {
        title: string;
        steps: GuideListItem[];
    };
}

export interface ScreenCallout {
    id: string;
    title: string;
    screenHref?: string;
    items: string[];
    commonMistake: string;
    okayIf: string;
    footnotes?: number[];
}

export interface MicrocopyGroup {
    id: string;
    title: string;
    items: {
        number: number;
        label: string;
        text: string;
        footnotes?: number[];
    }[];
}

export interface WorkedExample {
    id: string;
    title: string;
    paragraphs?: {
        text: string;
        footnotes?: number[];
    }[];
    bullets?: GuideListItem[];
}

export interface SourceLogSection {
    id: string;
    title: string;
    items: {
        text: string;
        footnotes?: number[];
        note?: boolean;
    }[];
}

export interface FootnoteLink {
    id: FootnoteId;
    href: string;
    title: string;
    needsVerification?: boolean;
}

export const adminGuide = {
    title: "Household employer checklist",
    subtitle: "Monthly and annual tasks for South African households",
    disclaimer: "Not legal advice. This guide helps household employers prepare, estimate, and verify common domestic-worker admin tasks in South Africa.",
    intro: "This guide summarizes linked official material that matters for household employers, including the current National Minimum Wage, Return of Earnings (ROE) record expectations, and UIF references. Always verify details on the official source before you rely on them.",
    introFootnotes: [1],
    toc: [
        { id: "start-here", title: "Start Here (onboarding path)" },
        { id: "full-guide", title: "Full Guide (by screens)" },
        { id: "screen-callouts", title: "Screen callout boxes" },
        { id: "microcopy", title: "Microcopy/tooltips" },
        { id: "worked-examples", title: "Worked examples" },
        { id: "source-log", title: "Source log" },
    ],
    startHereSteps: [
        {
            id: "start-settings",
            title: "1) Settings",
            screenLabel: "Settings",
            screenHref: "/settings",
            seeAlsoId: "settings",
            whatToDo: "Add the household employer’s name, contact details, address, and any identifiers you already have, such as a UIF reference or Compensation Fund reference.",
            whatItMeans: "These details flow into exports, payslips, and annual packs so you do not retype them each time.",
            commonMistakes: "Leaving names inconsistent across records, skipping contact details, or adding the worker’s data into the employer fields. Written particulars matter from the start of employment, and later exports are easier if your employer details stay consistent.",
        },
        {
            id: "start-employees",
            title: "2) Add employee",
            screenLabel: "Employees",
            screenHref: "/employees",
            seeAlsoId: "employees",
            whatToDo: "Add the worker’s name, ID/passport details if available, start date, role, hours/days, pay basis, and whether the arrangement is live-in or live-out.",
            whatItMeans: "You are building the core employment record and the written particulars of employment.",
            commonMistakes: "No start date, vague hours, no pay basis, or no written agreement. The Basic Conditions of Employment Act (BCEA) expects written particulars when employment starts, and the official domestic-worker sample contract also treats hours, pay, overtime, Sundays, public holidays, and accommodation as items that should be clearly agreed.",
            footnotes: [2],
        },
        {
            id: "start-payroll",
            title: "3) First payroll",
            screenLabel: "Payroll",
            screenHref: "/payroll",
            seeAlsoId: "payroll",
            whatToDo: "Enter the agreed pay period, normal hours or days worked, and any extras such as overtime or Sunday/public holiday work if they apply.",
            whatItMeans: "LekkerLedger helps you turn the agreement into a clear pay record.",
            commonMistakes: "Mixing daily and hourly pay, forgetting to convert monthly pay to an hourly sense-check, or applying UIF when the worker is below the 24-hours-per-month threshold for that employer. The 2026 minimum wage is **R30.23/hour**; overtime is generally **1.5x**, Sunday work is usually **1.5x or double depending on whether Sunday is ordinarily worked**, and public-holiday work is generally **double by agreement**.",
            footnotes: [1],
        },
        {
            id: "start-payslips",
            title: "4) Payslip export",
            screenLabel: "Payslips & Exports",
            screenHref: "/documents",
            seeAlsoId: "payslips-records",
            whatToDo: "Export a payslip or payment summary after checking names, dates, pay, and deductions.",
            whatItMeans: "You are creating a record the worker can read and you can keep.",
            commonMistakes: "Exporting without checking deductions, or keeping no archive. The BCEA lists the core remuneration information that should be given in writing when pay is made, and Department of Employment and Labour domestic-worker guidance still expects payslip-style records.",
            footnotes: [3],
        },
        {
            id: "start-uif",
            title: "5) UIF export (if applicable)",
            screenLabel: "UIF",
            screenHref: "/ufiling",
            seeAlsoId: "uif",
            whatToDo: "If the worker works **24 hours or more a month** for you, calculate the **1% employee + 1% employer** contribution, export the data, then submit on **uFiling**.",
            whatItMeans: "LekkerLedger can help you prepare the numbers. You still register and submit yourself.",
            commonMistakes: "Assuming the app submits for you, missing the monthly declaration, or forgetting the SARS UIF ceiling. The official uFiling guide says domestic employers can declare and pay online, and monthly declarations are due **by the 7th of each month**.",
            footnotes: [4],
        },
        {
            id: "start-roe",
            title: "6) ROE Pack (annual)",
            screenLabel: "Premium / Annual Pack wizard",
            screenHref: "/compliance/coida/roe",
            seeAlsoId: "roe-pack",
            whatToDo: "When the Compensation Fund filing window opens, prepare the **Return of Earnings (ROE)** using actual earnings for the completed period and provisional earnings for the next period, then submit on the official portal.",
            whatItMeans: "LekkerLedger helps you gather totals, draft figures, and supporting documents. You still verify and submit.",
            commonMistakes: "Waiting for memory, guessing totals, or assuming last year’s filing window is the same this year. Domestic workers are covered under COIDA, private domestic employers are expected to register, and filing windows/notices can change.",
        },
    ],
    guideSections: [
        {
            id: "dashboard",
            title: "1) Dashboard: What the dashboard is telling you",
            screenLabel: "Dashboard",
            screenHref: "/dashboard",
            intro: [
                {
                    type: "paragraph",
                    text: "This screen should feel like a checklist, not a verdict machine. It should show what still needs attention, what has been recorded, and what may need checking soon. It should not suggest that a single green tick means “all legal boxes are done.” Laws, portal rules, and filing windows can move around.",
                },
            ],
            subsections: [
                {
                    title: "What you should check monthly",
                    blocks: [
                        {
                            type: "list",
                            items: [
                                { text: "Has everyone been paid for the correct period?" },
                                { text: "Does the hourly sense-check still sit at or above the current National Minimum Wage?" },
                                { text: "Were overtime, Sunday work, or public-holiday work handled correctly where relevant?" },
                                { text: "If the worker works **24+ hours a month** for you, was the **UIF (Unemployment Insurance Fund)** contribution prepared and then submitted on uFiling?", footnotes: [1] },
                            ],
                        },
                    ],
                },
                {
                    title: "What you should check annually",
                    blocks: [
                        {
                            type: "list",
                            items: [
                                { text: "Are employee details still correct?" },
                                { text: "Are your payroll records archived and easy to find?" },
                                { text: "If you employ a private domestic worker, is your **COIDA (Compensation for Occupational Injuries and Diseases Act)** registration in place and are you ready for the annual **ROE (Return of Earnings)** cycle when the Compensation Fund opens it?" },
                                { text: "If employment ended, did you keep the written particulars, payroll records, and Certificate of Service records for the relevant retention period?" },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            id: "settings",
            title: "2) Settings: Set it up once",
            screenLabel: "Settings",
            screenHref: "/settings",
            intro: [
                {
                    type: "paragraph",
                    text: "This screen is where you collect the employer details that appear again and again.",
                },
            ],
            subsections: [
                {
                    title: "Fields to collect",
                    blocks: [
                        {
                            type: "list",
                            items: [
                                { text: "Employer full name" },
                                { text: "Household/home address" },
                                { text: "Mobile number and email" },
                                { text: "UIF reference number, if already registered" },
                                { text: "Compensation Fund reference number, if already registered" },
                                { text: "Preferred pay frequency" },
                                { text: "Bank/payment reference preferences" },
                                { text: "Document/export naming preferences" },
                            ],
                        },
                    ],
                },
                {
                    title: "Why each matters",
                    blocks: [
                        {
                            type: "list",
                            items: [
                                { lead: "Name + address:", text: "These belong in written employment particulars and help tie records to the right household." },
                                { lead: "Contact details:", text: "Useful for uFiling, Compensation Fund access, and worker-facing documents." },
                                { lead: "Identifiers:", text: "They reduce repeat admin and help match exports to the right portal/account." },
                                { lead: "Pay settings:", text: "They help keep your payroll method consistent from month to month." },
                            ],
                        },
                    ],
                },
                {
                    title: "What LekkerLedger does with it",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "LekkerLedger should use these details to prefill exports, payslips, certificates, and ROE preparation packs. For privacy, keep collection narrow: only take what you need for payroll, documents, and filings. POPIA says records should not be kept longer than necessary unless another law, contract, or lawful purpose justifies retention, and it requires reasonable security safeguards. POPIA also contains an exclusion for processing in the course of a **purely personal or household activity**, but once records are stored in software, shared with bookkeepers, or uploaded to portals, cautious handling is still wise.",
                            footnotes: [5],
                        },
                    ],
                },
            ],
        },
        {
            id: "employees",
            title: "3) Employees: Add your domestic worker",
            screenLabel: "Employees",
            screenHref: "/employees",
            intro: [
                {
                    type: "paragraph",
                    text: "This screen is the heart of the employment record.",
                },
            ],
            subsections: [
                {
                    title: "What details are needed and why",
                    blocks: [
                        {
                            type: "list",
                            items: [
                                { lead: "Full name and ID/passport details if available:", text: "helps match payroll, UIF, and Compensation Fund records." },
                                { lead: "Start date:", text: "needed for leave cycles, notice issues, and service history." },
                                { lead: "Role/job scope:", text: "cleaner, nanny, gardener, caregiver, or mixed duties. The job description belongs in written particulars." },
                                { lead: "Place of work:", text: "the BCEA written-particulars rules include this." },
                                { lead: "Ordinary hours/days:", text: "the agreement should be specific enough to calculate pay and test the hourly rate. The BCEA ordinary-hours framework is generally **45 hours/week**, **9 hours/day** if the worker works **5 days or fewer** per week, or **8 hours/day** if the worker works **more than 5 days** per week.", footnotes: [6] },
                                { lead: "Pay method:", text: "hourly, daily, weekly, or monthly. This belongs in the written particulars." },
                                { lead: "Leave setup:", text: "annual, sick, maternity, parental, and family responsibility leave where applicable." },
                            ],
                        },
                    ],
                },
                {
                    title: "Hours setup and pay agreements",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "Use the actual arrangement. Do not force a monthly salary into the app unless you can still explain the agreed days and hours behind it. A monthly amount with no hours attached makes it harder to check the minimum wage and overtime logic. The current minimum wage floor is **R30.23/hour**.",
                            footnotes: [1],
                        },
                    ],
                },
                {
                    title: "Live-in vs live-out notes",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "The sources I checked do **not** show a separate 2026 minimum wage for live-in workers. The minimum wage floor is still the same hourly floor. What changes in practice is accommodation: if accommodation is part of the arrangement, spell out what is provided, whether any deduction is made, and how it was agreed. Older official domestic-worker guidance says accommodation deductions may be up to **10% of wages**, and the sample contract says the room/accommodation should be in good condition, have at least one window and a lockable door, and have bathroom access if there is no separate bathroom available.",
                            footnotes: [1],
                        },
                    ],
                },
            ],
        },
        {
            id: "payroll",
            title: "4) Payroll: Run a pay period",
            screenLabel: "Payroll",
            screenHref: "/payroll",
            intro: [
                {
                    type: "paragraph",
                    text: "This is where you turn the agreement into numbers the worker can understand.",
                },
            ],
            subsections: [
                {
                    title: "How to record hours and pay",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "Record:",
                        },
                        {
                            type: "list",
                            items: [
                                { text: "the pay period," },
                                { text: "ordinary hours or days worked," },
                                { text: "any overtime by agreement," },
                                { text: "any Sunday hours," },
                                { text: "any public-holiday hours," },
                                { text: "deductions that are lawful and clearly explained." },
                            ],
                        },
                    ],
                },
                {
                    title: "Examples: hourly vs daily vs monthly conversions",
                    blocks: [
                        {
                            type: "list",
                            items: [
                                { lead: "Hourly worker:", text: "pay = hours worked × agreed hourly rate. Check the rate is not below **R30.23/hour**.", footnotes: [1] },
                                { lead: "Daily worker:", text: "daily rate ÷ usual hours that day = effective hourly rate. Example: R240 for an 8-hour day = R30/hour, which is **below** the 2026 minimum wage. R242 or more for an 8-hour day is needed to clear R30.23/hour.", footnotes: [1] },
                                { lead: "Monthly worker:", text: "monthly pay ÷ (usual weekly hours × 4.333) = estimated hourly rate. The Department of Employment and Labour’s 2026 flyer uses the same 4.333 monthly conversion and gives **R5,894.40/month** as the minimum-wage equivalent for a **45-hour week**.", footnotes: [7] },
                            ],
                        },
                    ],
                },
                {
                    title: "Overtime, Sunday, and public-holiday pay",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "Overtime is generally by agreement and is paid at **1.5 times** the normal wage. Sunday work is generally paid at **double** if the worker does **not ordinarily work on Sundays**, or **1.5 times** if Sunday is an ordinary working day. Public-holiday work is generally by agreement and paid at **double** the normal rate.",
                        },
                    ],
                },
                {
                    title: "Deductions",
                    blocks: [
                        {
                            type: "list",
                            items: [
                                {
                                    lead: "UIF (Unemployment Insurance Fund):",
                                    text: "if the worker works **24 hours or more a month** for you, the contribution is generally **1% from the employee + 1% from the employer**, subject to the SARS UIF earnings ceiling of **R17,712/month**; above that ceiling, the maximum employee deduction is **R177.12/month** and the maximum combined contribution is **R354.24/month**.",
                                    footnotes: [4],
                                },
                                {
                                    lead: "Accommodation:",
                                    text: "older official domestic-worker guidance allows a deduction of up to **10% of wages** for accommodation, and the sample contract describes minimum room standards. Keep this written and easy to explain.",
                                    footnotes: [8],
                                },
                                {
                                    lead: "Other deductions:",
                                    text: "under the BCEA and domestic-worker guidance, deductions are limited. The BCEA generally allows deductions required or permitted by law, collective agreement, court/arbitration, or written agreement for a debt in certain circumstances. Domestic-worker guidance also says you may not deduct for things like uniforms, tools, food, or fines, and caps damage/loss deductions at **25% of net pay** after a fair process.",
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            id: "payslips-records",
            title: "5) Payslips & Records: What to keep (and for how long)",
            screenLabel: "Payslips & Exports",
            screenHref: "/documents",
            intro: [
                {
                    type: "paragraph",
                    text: "This is the “future you will thank present you” screen.",
                },
            ],
            subsections: [
                {
                    title: "Payslip checklist",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "Each pay record should clearly show:",
                        },
                        {
                            type: "list",
                            items: [
                                { text: "employer name and address," },
                                { text: "worker name," },
                                { text: "pay period," },
                                { text: "gross remuneration/pay," },
                                { text: "deductions and what each deduction is for," },
                                { text: "actual amount paid," },
                                { text: "ordinary hours," },
                                { text: "overtime hours," },
                                { text: "Sunday/public-holiday hours if relevant," },
                                { text: "rate or overtime rate where relevant.", footnotes: [3] },
                            ],
                        },
                    ],
                },
                {
                    title: "Record-keeping period(s)",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "Here the law/guidance is a little untidy, so careful wording matters.",
                        },
                        {
                            type: "list",
                            items: [
                                { text: "The BCEA says written particulars of employment should be kept for **3 years after termination**." },
                                { text: "BCEA records under section 31 should be kept for **3 years from the date of the last entry**." },
                                { text: "POPIA says personal-information records should not be kept longer than necessary unless another law or lawful basis allows it, and records should then be deleted, destroyed, or de-identified as soon as reasonably practicable.", footnotes: [5] },
                            ],
                        },
                    ],
                },
                {
                    title: "Important note on domestic-worker payslips and records",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "The BCEA text says parts of chapter 4, including sections **31** and **33**, do not apply to the employment of a domestic worker, and chapter 4 also does not apply to someone who works **less than 24 hours a month** for that employer. But Department of Employment and Labour domestic-worker guidance still describes payslips and domestic-worker deduction rules. In practice, keeping full payslips and full payroll records is the safer administrative approach. It makes UIF, ROE, disputes, and year-end checks much easier. Older domestic-worker guidance still refers to **Sectoral Determination 7 (SD7)**, which is why some official pages use that label.",
                        },
                    ],
                },
            ],
        },
        {
            id: "uif",
            title: "6) UIF: Register and submit",
            screenLabel: "UIF",
            screenHref: "/ufiling",
            intro: [
                {
                    type: "paragraph",
                    text: "**UIF** here means the **Unemployment Insurance Fund**.",
                },
            ],
            subsections: [
                {
                    title: "Simple steps",
                    blocks: [
                        {
                            type: "list",
                            ordered: true,
                            items: [
                                { text: "Check whether the worker works **24 hours or more a month** for you. If not, UIF usually does not apply for that worker-employer relationship." },
                                { text: "Register as an employer on **uFiling** if you are not already registered. The official guide specifically includes domestic employers." },
                                { text: "Calculate UIF contributions: **1% employee + 1% employer**.", footnotes: [4] },
                                { text: "Export the numbers from LekkerLedger." },
                                { text: "Submit the declaration and payment on uFiling. The official guide says monthly declarations should be done **by the 7th of each month**." },
                            ],
                        },
                    ],
                },
                {
                    title: "What LekkerLedger can and cannot do",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "LekkerLedger can help you calculate, organise, and export. It does **not** replace the employer’s registration or submission step on uFiling. The official uFiling guide describes uFiling as the free online service for declarations and payments.",
                        },
                    ],
                },
            ],
        },
        {
            id: "roe-pack",
            title: "7) Annual Return of Earnings (ROE)",
            screenLabel: "Annual Pack wizard",
            screenHref: "/compliance/coida/roe",
            intro: [
                {
                    type: "paragraph",
                    text: "Here **COIDA** means the **Compensation for Occupational Injuries and Diseases Act**, and **ROE** means **Return of Earnings**.",
                },
            ],
            subsections: [
                {
                    title: "What ROE is",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "ROE is the annual earnings return the employer submits to the Compensation Fund so the Fund can assess contributions and keep the employer’s account up to date. Domestic workers were brought under COIDA after the Constitutional Court ruling, and official Compensation Fund communication says private domestic employers are expected to register, submit ROEs, and pay assessments.",
                        },
                    ],
                },
                {
                    title: "What numbers you need",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "ROE forms typically ask for:",
                        },
                        {
                            type: "list",
                            items: [
                                { text: "**actual earnings** for the completed assessment period, and" },
                                { text: "**provisional earnings** for the next assessment period." },
                            ],
                        },
                    ],
                },
                {
                    title: "How LekkerLedger’s ROE Pack helps",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "The ROE Pack should:",
                        },
                        {
                            type: "list",
                            items: [
                                { text: "total actual payroll for the past assessment period," },
                                { text: "help you estimate provisional earnings for the next period," },
                                { text: "produce clean payroll summaries," },
                                { text: "prepare supporting documents for upload or copy/paste," },
                                { text: "keep last year’s figures easy to find." },
                            ],
                        },
                        {
                            type: "paragraph",
                            text: "That is support and preparation. You still verify and submit on the official portal.",
                        },
                    ],
                },
                {
                    title: "What documents are typically requested",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "For registration, official Compensation Fund service guidance lists a registration form and identity/organisation documents; for ROE Online it asks for items such as a valid Compensation Fund registration number, ID/passport, email, registration details, and banking details. For **audit-flagged** returns, the **January 2026 notice** listed supporting documents such as an **EMP501**, **detailed payroll report**, **audited/independently reviewed/compiled annual financial statements**, an **affidavit explaining variances**, a completed **ROE form**, and a **power of attorney** where a consultant/bookkeeper/accountant/attorney acts for the employer. Some of those documents fit companies better than private households, so household employers should verify the portal prompt and keep simpler payroll proof ready as well.",
                        },
                    ],
                },
                {
                    title: "Current caps/minimums to know",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "The Compensation Fund notice effective **1 March 2025** set the **maximum earnings for assessment at R633,168 per employee per year**, the **minimum assessment at R1,621** generally, and the **minimum assessment at R560 for household/domestic employers**. These numbers can change, so check the latest notice before using them in-app.",
                        },
                    ],
                },
                {
                    title: "Filing-window caution",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "Do **not** hardcode a filing-season deadline into the app unless you refresh it from the latest notice. Check the latest Compensation Fund notice before you rely on a filing window or supporting-document list.",
                        },
                    ],
                },
            ],
            wizardSteps: {
                title: "ROE Pack wizard mapping",
                steps: [
                    { lead: "Step 1 in the wizard:", text: "Select the assessment year so the pack can total the completed period’s saved payroll." },
                    { lead: "Step 2 in the wizard:", text: "Review the generated figures for **actual earnings** and **provisional earnings** before you copy anything into the Compensation Fund portal." },
                    { lead: "Step 3 in the wizard:", text: "Download the payroll summaries and supporting documents you need, then verify the portal prompts and submit yourself." },
                    { lead: "Boundary to keep in mind:", text: "LekkerLedger helps prepare; you verify and submit." },
                ],
            },
        },
        {
            id: "ending-employment",
            title: "8) Ending employment: Do it fairly",
            intro: [],
            subsections: [
                {
                    title: "Notice period basics",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "The official BCEA summary says notice is generally:",
                        },
                        {
                            type: "list",
                            items: [
                                { text: "**1 week** if employed **6 months or less**," },
                                { text: "**2 weeks** if employed **more than 6 months but not more than 1 year**," },
                                { text: "**4 weeks** if employed **1 year or more**, or if a **domestic worker** has been employed for **more than 6 months**." },
                            ],
                        },
                        {
                            type: "paragraph",
                            text: "Notice should generally be in writing, unless the employee cannot read.",
                        },
                    ],
                },
                {
                    title: "Final pay checklist",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "On termination, check:",
                        },
                        {
                            type: "list",
                            items: [
                                { text: "pay due up to the last working day," },
                                { text: "notice pay if required," },
                                { text: "annual leave due on termination," },
                                { text: "lawful deductions only," },
                                { text: "final payslip/payment record," },
                                { text: "Certificate of Service." },
                            ],
                        },
                        {
                            type: "paragraph",
                            text: "The BCEA says remuneration should be paid no later than **7 days** after the end of the pay period or termination. The BCEA also says annual leave may be paid out **on termination**.",
                        },
                    ],
                },
                {
                    title: "Certificate of Service basics",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "The BCEA says the certificate should include:",
                        },
                        {
                            type: "list",
                            items: [
                                { text: "worker’s full name," },
                                { text: "employer’s name and address," },
                                { text: "start and end dates," },
                                { text: "job title or brief description of work," },
                                { text: "remuneration at termination," },
                                { text: "reason for termination if the worker asks for it." },
                            ],
                        },
                    ],
                },
                {
                    title: "Misconduct vs retrenchment basics",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "A dismissal still needs a fair reason and fair procedure. The current Code of Practice: Dismissal says dismissals are generally analysed under **misconduct**, **incapacity**, or **operational requirements**. For small employers, the Code says fairness should not be interpreted in an impractical, overly formal way, but fairness still matters. Operational-requirements dismissals are not punishment; they are about the employer’s operational need. That is why it is risky to label a budget or schedule problem as “misconduct.”",
                        },
                    ],
                },
                {
                    title: "CCMA basics and common mistakes",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "The **CCMA** is the **Commission for Conciliation, Mediation and Arbitration**. An unfair-dismissal referral generally must be made within **30 days**. Common employer mistakes are: no written record, no clear reason, no chance for the worker to respond, and messy final paperwork. Even in a household setting, a short written trail helps.",
                        },
                    ],
                },
                {
                    title: "Privacy",
                    blocks: [
                        {
                            type: "paragraph",
                            text: "Keep ID numbers, bank details, payroll records, and addresses on a need-to-know basis. POPIA requires reasonable safeguards, and records should not be retained longer than necessary unless another legal basis justifies retention. POPIA also excludes processing done in the course of a purely personal or household activity, but good security practice is still sensible: use passwords, restrict sharing, and archive/delete carefully.",
                            footnotes: [9],
                        },
                    ],
                },
            ],
        },
        {
            id: "updates-2026",
            title: "9) 2026 updates: What changed recently",
            intro: [],
            subsections: [
                {
                    title: "Recent changes",
                    blocks: [
                        {
                            type: "list",
                            items: [
                                { text: "**National Minimum Wage is currently R30.23/hour**, and the official labour material says this includes domestic workers.", footnotes: [1] },
                                { text: "I found a **30 January 2026 Compensation Fund notice** about **outstanding** ROEs and supporting documents for audit-flagged employers. That matters because it shows active enforcement and document expectations in 2026." },
                                { text: "I found **no newer UIF rate or ceiling change** in the official material linked below. SARS still shows the ceiling of **R17,712/month** and annual threshold of **R212,544**.", footnotes: [4] },
                                { text: "A **new Code of Practice: Dismissal** was published on **4 September 2025** and remains the current official dismissal guidance going into 2026. It matters to small employers because it expressly recognises practicality for small businesses while still requiring fairness." },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            id: "official-links",
            title: "10) Official links (short list)",
            intro: [],
            subsections: [
                {
                    title: "Short list",
                    blocks: [
                        {
                            type: "list",
                            items: [
                                { text: "Department of Employment and Labour: National Minimum Wage amendment / labour guides.", footnotes: [1] },
                                { text: "UIF / uFiling official guidance for employers." },
                                { text: "SARS UIF contribution ceiling guidance.", footnotes: [4] },
                                { text: "Compensation Fund / ROE Online guidance and notices." },
                                { text: "CCMA / Labour Relations Act unfair-dismissal route." },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
    screenCallouts: [
        {
            id: "settings-callout",
            title: "Settings",
            screenHref: "/settings",
            items: [
                "Add the employer’s full legal name.",
                "Add contact details you actually use.",
                "Save UIF and Compensation Fund references.",
                "Check address spelling before first export.",
                "Keep naming consistent across documents.",
            ],
            commonMistake: "Mixing employer and worker details.",
            okayIf: "you can trace every export back to one household.",
        },
        {
            id: "employees-callout",
            title: "Employees",
            screenHref: "/employees",
            items: [
                "Add start date before first payroll.",
                "Record normal days and hours clearly.",
                "Save pay basis: hourly, daily, weekly, monthly.",
                "Mark live-in or live-out.",
                "Attach written agreement details.",
            ],
            commonMistake: "Monthly salary with no hours behind it.",
            okayIf: "another person could understand the arrangement fast.",
            footnotes: [2],
        },
        {
            id: "payroll-callout",
            title: "Payroll",
            screenHref: "/payroll",
            items: [
                "Enter the exact pay period.",
                "Record ordinary hours first.",
                "Add overtime only if agreed.",
                "Review Sunday and holiday entries.",
                "Check UIF eligibility before deducting.",
            ],
            commonMistake: "Deducting UIF below 24 hours/month.",
            okayIf: "the payslip matches the real week or month.",
        },
        {
            id: "roe-pack-callout",
            title: "ROE Pack",
            screenHref: "/compliance/coida/roe",
            items: [
                "Pull actual earnings from archived payroll.",
                "Estimate next year conservatively.",
                "Keep payroll summaries ready.",
                "Upload only what the portal asks.",
                "Recheck the latest filing notice.",
            ],
            commonMistake: "Reusing last year’s filing window.",
            okayIf: "your figures are explainable and traceable.",
        },
    ],
    microcopyGroups: [
        {
            id: "hourly-rate-microcopy",
            title: "Hourly rate",
            items: [
                { number: 1, label: "Hourly rate", text: "Use the agreed hourly rate here. Check it is not below the current National Minimum Wage." },
                { number: 2, label: "Hourly sense-check", text: "This field helps compare your agreement to the current hourly floor. It is a check, not a verdict." },
                { number: 3, label: "Monthly worker?", text: "If you pay monthly, LekkerLedger can estimate the hourly rate from usual weekly hours. Verify the hours first." },
                { number: 4, label: "Daily worker?", text: "Convert the day rate into an hourly rate so you can spot problems early.", footnotes: [1] },
            ],
        },
        {
            id: "pay-frequency-microcopy",
            title: "Pay frequency",
            items: [
                { number: 5, label: "Pay frequency", text: "Choose the way you actually pay: weekly, fortnightly, monthly, or another regular cycle. Consistency makes records easier to defend." },
                { number: 6, label: "First pay period", text: "Start the first period from the real employment start date, not the day you first opened the app." },
                { number: 7, label: "Changing frequency", text: "If you change pay frequency later, update the written particulars too." },
                { number: 8, label: "Monthly salary warning", text: "A monthly amount without agreed hours is harder to check against wage rules.", footnotes: [1] },
            ],
        },
        {
            id: "uif-microcopy",
            title: "UIF toggle / deduction fields",
            items: [
                { number: 9, label: "UIF applies?", text: "Usually yes if the worker works 24 hours or more a month for you. Usually no if they work less than 24 hours a month for you." },
                { number: 10, label: "Employee UIF deduction", text: "This is generally 1% of remuneration, subject to the UIF earnings ceiling." },
                { number: 11, label: "Employer UIF contribution", text: "This is generally another 1%. The employer pays this in addition to the worker’s deduction." },
                { number: 12, label: "UIF ceiling", text: "Above the SARS UIF ceiling, the contribution no longer rises. Check the current ceiling before relying on old numbers." },
                { number: 13, label: "uFiling reminder", text: "LekkerLedger helps you prepare the figures. You still submit and pay on uFiling.", footnotes: [4] },
            ],
        },
        {
            id: "accommodation-microcopy",
            title: "Accommodation deduction",
            items: [
                { number: 14, label: "Accommodation deduction", text: "Use this only where accommodation is genuinely provided and clearly agreed. Older official domestic-worker guidance caps this at 10% of wages." },
                { number: 15, label: "Room standard reminder", text: "The sample domestic-worker contract describes minimum room standards such as a window, lockable door, and bathroom access." },
                { number: 16, label: "Live-in is not a discount code", text: "Live-in status does not create a lower minimum wage in the 2026 sources I checked." },
                { number: 17, label: "Keep it written", text: "If accommodation changes pay, put the arrangement in writing and keep it easy to explain.", footnotes: [8] },
            ],
        },
        {
            id: "roe-microcopy",
            title: "COIDA ROE Pack",
            items: [
                { number: 18, label: "ROE Pack", text: "ROE means Return of Earnings for the Compensation Fund. This pack helps you gather the numbers before portal submission." },
                { number: 19, label: "Actual earnings", text: "Use the completed assessment period’s real payroll totals here. Archived payroll matters." },
                { number: 20, label: "Provisional earnings", text: "Estimate the next period honestly. Overly neat guesses can create headaches later." },
                { number: 21, label: "Portal notice check", text: "Do not assume last year’s filing dates still apply. Check the latest notice or portal banner first." },
                { number: 22, label: "Audit documents", text: "If the return is flagged, the portal may ask for extra proof such as payroll reports or other supporting documents." },
            ],
        },
        {
            id: "archive-microcopy",
            title: "Record archive",
            items: [
                { number: 23, label: "Archive payslips", text: "Keep a copy of each payslip or payment summary. This helps with disputes, UIF, and year-end checks." },
                { number: 24, label: "Retention period", text: "A practical baseline is to keep payroll records for at least the labour-law retention period, then review what still needs to be retained." },
                { number: 25, label: "Written particulars archive", text: "Keep the original employment particulars and any later changes together." },
                { number: 26, label: "Privacy", text: "Store ID numbers, addresses, and payroll files with restricted access. Share only where there is a real reason." },
                { number: 27, label: "Delete carefully", text: "When you no longer need a personal-information record and no law requires you to keep it, delete or de-identify it safely.", footnotes: [5] },
            ],
        },
    ],
    workedExamples: [
        {
            id: "monthly-to-hourly-example",
            title: "1) Monthly pay → hourly rate conversion",
            paragraphs: [
                {
                    text: "A worker works **45 hours a week** and is paid **R6,000/month**. Estimated monthly hours = **45 × 4.333 = about 195 hours**. Estimated hourly rate = **R6,000 ÷ 195 = about R30.77/hour**. That sits **above** the 2026 minimum wage of **R30.23/hour**. For a 45-hour week, the Department of Employment and Labour’s 2026 example monthly equivalent of the minimum wage is **R5,894.40**.",
                    footnotes: [1],
                },
            ],
        },
        {
            id: "uif-example",
            title: "2) UIF deduction example",
            paragraphs: [
                {
                    text: "A worker earns **R4,000/month** and works more than 24 hours a month for you.",
                },
            ],
            bullets: [
                { text: "Employee UIF = **1% of R4,000 = R40**" },
                { text: "Employer UIF = **1% of R4,000 = R40**" },
                { text: "Total to UIF = **R80**" },
                { text: "If the worker earns **R20,000/month**, the SARS UIF ceiling matters." },
                { text: "Employee UIF is capped at **R177.12/month**" },
                { text: "Employer UIF is capped at **R177.12/month**" },
                { text: "Total monthly UIF is capped at **R354.24**", footnotes: [4] },
            ],
        },
        {
            id: "accommodation-example",
            title: "3) Accommodation deduction example",
            paragraphs: [
                {
                    text: "A live-in worker earns **R5,000/month**. Older official domestic-worker guidance says accommodation deductions may be up to **10% of wages**. So the maximum accommodation deduction would usually be **R500/month**, assuming the accommodation is genuinely provided, the arrangement is clear, and the room standards described in the official sample contract are met.",
                    footnotes: [8],
                },
            ],
        },
        {
            id: "roe-example",
            title: "4) ROE actual vs provisional simple example",
            paragraphs: [
                {
                    text: "Your archived payroll shows total domestic-worker pay of **R54,000** for the completed assessment period. You expect the next period to be **R60,000** because the worker will add one extra day a month and the wage floor increased.",
                },
            ],
            bullets: [
                { text: "**Actual earnings:** R54,000" },
                { text: "**Provisional earnings:** R60,000" },
                { text: "LekkerLedger should help total the old period and prepare the new estimate, but you still check the Compensation Fund portal and the latest notice before submission. Also note that Compensation Fund assessments depend on the Fund’s rules and tariffs, not just your raw payroll total." },
            ],
        },
        {
            id: "termination-example",
            title: "5) Termination final pay checklist example",
            paragraphs: [
                {
                    text: "A worker’s last day is **15 March**. Your final check should include:",
                },
            ],
            bullets: [
                { text: "pay due up to 15 March," },
                { text: "notice pay if notice was required," },
                { text: "annual leave due on termination," },
                { text: "only lawful deductions," },
                { text: "a final payslip/payment record," },
                { text: "a Certificate of Service." },
                { text: "The BCEA says remuneration should be paid no later than **7 days** after termination, and annual leave can be paid out on termination." },
            ],
        },
    ],
    sourceLog: [
        {
            id: "source-dashboard",
            title: "Section 1) Dashboard",
            items: [
                { text: "**National Minimum Wage Amendment 2026**, Government Gazette / Department of Employment and Labour, effective **1 March 2026**. **Type:** Gazette / Law notice.", footnotes: [1] },
                { text: "**National Minimum Wage 2026 flyer**, Department of Employment and Labour, 2026. **Type:** Official guidance.", footnotes: [7] },
                { text: "**uFiling System User Guide**, UIF/uFiling, current guide accessed March 2026. **Type:** Official guidance." },
                { text: "**Private Domestic Employer / Compensation Fund communications**, Compensation Fund, current official communications. **Type:** Official guidance / official communication." },
            ],
        },
        {
            id: "source-settings",
            title: "Section 2) Settings",
            items: [
                { text: "**Basic Conditions of Employment Act, section 29 written particulars**, Department of Employment and Labour / legislation. **Type:** Law." },
                { text: "**Protection of Personal Information Act 4 of 2013**, Information Regulator / Gazette text. **Type:** Law.", footnotes: [5] },
                { text: "**Information Regulator POPIA guidance: Security Safeguards**, Information Regulator. **Type:** Official guidance.", footnotes: [9] },
            ],
        },
        {
            id: "source-employees",
            title: "Section 3) Employees",
            items: [
                { text: "**BCEA written particulars**, Department of Employment and Labour / legislation. **Type:** Law." },
                { text: "**BCEA summary / hours of work**, Department of Employment and Labour. **Type:** Official guidance.", footnotes: [6] },
                { text: "**Sample Domestic Worker Employment Contract**, Department of Employment and Labour. **Type:** Official guidance / sample.", footnotes: [2] },
            ],
        },
        {
            id: "source-payroll",
            title: "Section 4) Payroll",
            items: [
                { text: "**National Minimum Wage Amendment 2026**, Government Gazette. **Type:** Gazette / Law notice.", footnotes: [1] },
                { text: "**BCEA summary: overtime / Sunday / public holiday pay**, Department of Employment and Labour. **Type:** Official guidance." },
                { text: "**Basic Guide to Deductions (Domestic Workers)**, Department of Employment and Labour. **Type:** Official guidance." },
                { text: "**SARS UIF page**, SARS, page updated **15 August 2025**. **Type:** Official guidance.", footnotes: [4] },
            ],
        },
        {
            id: "source-payslips",
            title: "Section 5) Payslips & Records",
            items: [
                { text: "**BCEA section 33 remuneration information**, legislation. **Type:** Law." },
                { text: "**BCEA sections 29 and 31 retention**, legislation. **Type:** Law." },
                { text: "**Basic Guide to Pay Slips (Domestic Workers)**, Department of Employment and Labour. **Type:** Official guidance.", footnotes: [3] },
                { text: "**Conflict note:** the BCEA text carves out some domestic-worker chapter 4 provisions, but DOL domestic-worker guidance still expects payslip-style records and domestic-worker deduction rules. I preferred a conservative admin recommendation: keep full payslips and records.", note: true },
            ],
        },
        {
            id: "source-uif",
            title: "Section 6) UIF",
            items: [
                { text: "**Basic Guide to the UIF**, Department of Employment and Labour. **Type:** Official guidance." },
                { text: "**uFiling System User Guide**, UIF/uFiling. **Type:** Official guidance." },
                { text: "**SARS UIF ceiling page**, SARS. **Type:** Official guidance.", footnotes: [4] },
                { text: "**Bulk upload/technical guide ceiling wording**, uFiling guide. **Type:** Official guidance." },
            ],
        },
        {
            id: "source-roe",
            title: "Section 7) COIDA / Compensation Fund",
            items: [
                { text: "**Private domestic employees covered under COIDA / employers must register and submit ROEs**, Compensation Fund media statement and guidance. **Type:** Official communication / official guidance." },
                { text: "**Compensation Fund service booklet**, Compensation Fund. **Type:** Official guidance." },
                { text: "**COIDA notice on maximum earnings and minimum assessment**, Government Gazette / Compensation Fund, effective **1 March 2025**. **Type:** Gazette / official notice." },
                { text: "**2024 ROE filing-season notice**, Compensation Fund, 2025. **Type:** Official notice." },
                { text: "**Outstanding ROEs / audit documents notice**, Compensation Fund, **30 January 2026**. **Type:** Official notice." },
                { text: "**Conflict note:** old Compensation Fund guidance sometimes shows older annual dates, while newer notices use specific filing windows and clean-up notices. I preferred the newer, more specific notices and avoided hardcoding a recurring annual deadline.", note: true },
            ],
        },
        {
            id: "source-ending",
            title: "Section 8) Ending employment",
            items: [
                { text: "**BCEA summary: notice periods**, Department of Employment and Labour. **Type:** Official guidance." },
                { text: "**BCEA section 42 Certificate of Service**, legislation. **Type:** Law." },
                { text: "**Code of Practice: Dismissal**, Government Gazette / Labour Relations Act, published **4 September 2025**. **Type:** Gazette / official guidance." },
                { text: "**Labour Relations Act section 191 referral timing**, legislation. **Type:** Law." },
            ],
        },
        {
            id: "source-updates",
            title: "Section 9) 2026 updates",
            items: [
                { text: "**National Minimum Wage Amendment 2026**, Government Gazette. **Type:** Gazette / Law notice.", footnotes: [1] },
                { text: "**Compensation Fund outstanding ROEs notice**, **30 January 2026**. **Type:** Official notice." },
                { text: "**SARS UIF ceiling page** showing no new 2026 change found in official material checked. **Type:** Official guidance.", footnotes: [4] },
                { text: "**Code of Practice: Dismissal**, published **4 September 2025** and current into 2026. **Type:** Gazette / official guidance." },
            ],
        },
    ] as SourceLogSection[],
    sourceVerificationNote: "Links should be verified against official notices.",
    footnotes: [
        {
            id: 1,
            href: "https://www.justice.gov.za/legislation/acts/2013-004.pdf",
            title: "https://www.justice.gov.za/legislation/acts/2013-004.pdf",
            needsVerification: true,
        },
        {
            id: 2,
            href: "https://www.labour.gov.za/DocumentCenter/Forms/Basic%20Conditions%20of%20Employment/Sample%20-%20Domestic%20worker%20employment%20contract.doc",
            title: "https://www.labour.gov.za/DocumentCenter/Forms/Basic%20Conditions%20of%20Employment/Sample%20-%20Domestic%20worker%20employment%20contract.doc",
        },
        {
            id: 3,
            href: "https://www.labour.gov.za/DocumentCenter/Publications/Basic%20Conditions%20of%20Employment/The%20National%20Minimum%20Wage%20in%20the%20Agriculture%20and%20Domestic%20Work%20Sectors.pdf",
            title: "https://www.labour.gov.za/DocumentCenter/Publications/Basic%20Conditions%20of%20Employment/The%20National%20Minimum%20Wage%20in%20the%20Agriculture%20and%20Domestic%20Work%20Sectors.pdf",
            needsVerification: true,
        },
        {
            id: 4,
            href: "https://www.justice.gov.za/legislation/notices/2011/20110923_gg34627_paia-ccma.pdf",
            title: "https://www.justice.gov.za/legislation/notices/2011/20110923_gg34627_paia-ccma.pdf",
            needsVerification: true,
        },
        {
            id: 5,
            href: "https://inforegulator.org.za/wp-content/uploads/2025/08/PROTECTION-OF-PERSONAL-INFORMATION-ACT-4-OF-2013.pdf",
            title: "https://inforegulator.org.za/wp-content/uploads/2025/08/PROTECTION-OF-PERSONAL-INFORMATION-ACT-4-OF-2013.pdf",
        },
        {
            id: 6,
            href: "https://www.labour.gov.za/DocumentCenter/Forms/Basic%20Conditions%20of%20Employment/Form%20BCEA1A%20-%20Summary%20of%20the%20Act%20-%20English.doc?utm_source=chatgpt.com",
            title: "ANNEXURE",
        },
        {
            id: 7,
            href: "https://inforegulator.org.za/wp-content/uploads/2025/05/POPIA-document-gazz.pdf",
            title: "https://inforegulator.org.za/wp-content/uploads/2025/05/POPIA-document-gazz.pdf",
            needsVerification: true,
        },
        {
            id: 8,
            href: "https://www.labour.gov.za/DocumentCenter/Forms/Basic%20Conditions%20of%20Employment/Sample%20-%20Domestic%20worker%20employment%20contract.doc?utm_source=chatgpt.com",
            title: "Sample - Domestic worker employment contract.doc",
        },
        {
            id: 9,
            href: "https://inforegulator.org.za/popia/",
            title: "https://inforegulator.org.za/popia/",
        },
    ] as FootnoteLink[],
};

// TODO: SOURCE LINK NEEDS VERIFICATION for footnotes [1], [3], [4], and [7].
// Their URL targets do not appear to match the labels or source-log descriptions in the draft.


