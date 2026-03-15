/* eslint-disable @typescript-eslint/no-explicit-any */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Locator, Page } from "@playwright/test";
import type { AuditAction, AuditMetrics, AuditResult, AuditStep, SeedMode } from "./types";

const LOCALFORAGE_SCRIPT_PATH = path.join(process.cwd(), "node_modules", "localforage", "dist", "localforage.js");
const E2E_AUTH_BYPASS_COOKIE = "ll-e2e-auth-bypass";
const AUDIT_BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3002";

export const AUDIT_IDS = {
    defaultHouseholdId: "default",
    employeeA: "11111111-1111-4111-8111-111111111111",
    employeeB: "22222222-2222-4222-8222-222222222222",
    employeeC: "33333333-3333-4333-8333-333333333333",
    draftPeriodId: "period-draft-april-2026",
    lockedPeriodId: "period-locked-march-2026",
    contractId: "44444444-4444-4444-8444-444444444444",
    payslipA: "payslip-thandi-april-2026",
    payslipB: "payslip-sipho-march-2026",
    documentA: "document-payslip-april",
    documentB: "document-contract-thandi",
    leaveA: "leave-thandi-annual-april",
} as const;

const STORE_NAMES = [
    "employees",
    "payslips",
    "leave",
    "settings",
    "audit_logs",
    "pay_periods",
    "documents",
    "document_files",
    "contracts",
    "households",
] as const;

const today = "2026-04-30T10:00:00.000Z";

function buildSeedPayload(mode: SeedMode) {
    const households = [
        {
            id: AUDIT_IDS.defaultHouseholdId,
            name: "Main household",
            createdAt: new Date(0).toISOString(),
        },
    ];

    const globalSettings = {
        employerName: "Nomsa Dlamini",
        employerAddress: "18 Acacia Avenue, Northcliff, Johannesburg, 2195",
        employerIdNumber: "",
        uifRefNumber: "U123456789",
        cfNumber: "9900012345",
        sdlNumber: "",
        phone: "082 555 0101",
        proStatus: "standard",
        billingCycle: "monthly",
        activeHouseholdId: AUDIT_IDS.defaultHouseholdId,
        logoData: "",
        defaultLanguage: "en",
        simpleMode: false,
        advancedMode: false,
        density: "comfortable",
        googleSyncEnabled: false,
        piiObfuscationEnabled: true,
        installationId: "audit-installation-id",
        usageHistory: [],
    };

    const householdSettings = {
        employerName: globalSettings.employerName,
        employerAddress: globalSettings.employerAddress,
        employerIdNumber: globalSettings.employerIdNumber,
        uifRefNumber: globalSettings.uifRefNumber,
        cfNumber: globalSettings.cfNumber,
        sdlNumber: globalSettings.sdlNumber,
        phone: globalSettings.phone,
        logoData: "",
    };

    if (mode === "empty") {
        return {
            households,
            settings: globalSettings,
            householdSettings,
            employees: [],
            payslips: [],
            leave: [],
            payPeriods: [],
            documents: [],
            contracts: [],
        };
    }

    const employees = [
        {
            id: AUDIT_IDS.employeeA,
            householdId: AUDIT_IDS.defaultHouseholdId,
            name: "Thandi Dlamini",
            idNumber: "9002150836082",
            role: "Domestic Worker",
            hourlyRate: 30.23,
            phone: "0821111111",
            startDate: "2025-01-10",
            ordinarilyWorksSundays: false,
            ordinaryHoursPerDay: 8,
            frequency: "Monthly",
        },
        {
            id: AUDIT_IDS.employeeB,
            householdId: AUDIT_IDS.defaultHouseholdId,
            name: "Sipho Maseko",
            idNumber: "8701015010086",
            role: "Gardener",
            hourlyRate: 35,
            phone: "0822222222",
            startDate: "2024-09-01",
            ordinarilyWorksSundays: false,
            ordinaryHoursPerDay: 8,
            frequency: "Monthly",
        },
    ];

    if (mode === "starter") {
        return {
            households,
            settings: globalSettings,
            householdSettings,
            employees,
            payslips: [],
            leave: [],
            payPeriods: [],
            documents: [],
            contracts: [],
        };
    }

    const payPeriods = [
        {
            id: AUDIT_IDS.draftPeriodId,
            householdId: AUDIT_IDS.defaultHouseholdId,
            name: "April 2026",
            startDate: "2026-04-01T00:00:00.000Z",
            endDate: "2026-04-30T00:00:00.000Z",
            payDate: "2026-04-30T00:00:00.000Z",
            status: "review",
            entries: [
                {
                    employeeId: AUDIT_IDS.employeeA,
                    ordinaryHours: 176,
                    overtimeHours: 2,
                    sundayHours: 0,
                    publicHolidayHours: 0,
                    leaveDays: 1,
                    advanceAmount: 0,
                    otherDeductions: 0,
                    note: "",
                    status: "complete",
                },
                {
                    employeeId: AUDIT_IDS.employeeB,
                    ordinaryHours: 160,
                    overtimeHours: 0,
                    sundayHours: 4,
                    publicHolidayHours: 0,
                    leaveDays: 0,
                    advanceAmount: 0,
                    otherDeductions: 0,
                    note: "",
                    status: "partial",
                },
            ],
            lockedAt: undefined,
            createdAt: today,
            updatedAt: today,
        },
        {
            id: AUDIT_IDS.lockedPeriodId,
            householdId: AUDIT_IDS.defaultHouseholdId,
            name: "March 2026",
            startDate: "2026-03-01T00:00:00.000Z",
            endDate: "2026-03-31T00:00:00.000Z",
            payDate: "2026-03-31T00:00:00.000Z",
            status: "locked",
            entries: [
                {
                    employeeId: AUDIT_IDS.employeeA,
                    ordinaryHours: 168,
                    overtimeHours: 0,
                    sundayHours: 0,
                    publicHolidayHours: 8,
                    leaveDays: 0,
                    advanceAmount: 0,
                    otherDeductions: 0,
                    note: "",
                    status: "complete",
                },
            ],
            lockedAt: "2026-04-02T09:15:00.000Z",
            createdAt: "2026-03-01T08:00:00.000Z",
            updatedAt: "2026-04-02T09:15:00.000Z",
        },
    ];

    const payslips = [
        {
            id: AUDIT_IDS.payslipA,
            householdId: AUDIT_IDS.defaultHouseholdId,
            employeeId: AUDIT_IDS.employeeA,
            payPeriodStart: new Date("2026-04-01T00:00:00.000Z"),
            payPeriodEnd: new Date("2026-04-30T00:00:00.000Z"),
            ordinaryHours: 176,
            overtimeHours: 2,
            sundayHours: 0,
            publicHolidayHours: 0,
            daysWorked: 22,
            shortFallHours: 0,
            hourlyRate: 30.23,
            includeAccommodation: false,
            accommodationCost: 0,
            otherDeductions: 0,
            createdAt: new Date(today),
            ordinarilyWorksSundays: false,
            ordinaryHoursPerDay: 8,
            annualLeaveTaken: 1,
            sickLeaveTaken: 0,
            familyLeaveTaken: 0,
        },
        {
            id: AUDIT_IDS.payslipB,
            householdId: AUDIT_IDS.defaultHouseholdId,
            employeeId: AUDIT_IDS.employeeB,
            payPeriodStart: new Date("2026-03-01T00:00:00.000Z"),
            payPeriodEnd: new Date("2026-03-31T00:00:00.000Z"),
            ordinaryHours: 160,
            overtimeHours: 0,
            sundayHours: 4,
            publicHolidayHours: 0,
            daysWorked: 20,
            shortFallHours: 0,
            hourlyRate: 35,
            includeAccommodation: false,
            accommodationCost: 0,
            otherDeductions: 0,
            createdAt: new Date("2026-03-31T10:00:00.000Z"),
            ordinarilyWorksSundays: false,
            ordinaryHoursPerDay: 8,
            annualLeaveTaken: 0,
            sickLeaveTaken: 0,
            familyLeaveTaken: 0,
        },
    ];

    const leave = [
        {
            id: AUDIT_IDS.leaveA,
            householdId: AUDIT_IDS.defaultHouseholdId,
            employeeId: AUDIT_IDS.employeeA,
            type: "annual",
            days: 1,
            date: "2026-04-15",
            startDate: "2026-04-15",
            endDate: "2026-04-15",
            exceedsAllowance: false,
            payslipId: AUDIT_IDS.payslipA,
            note: "Family event",
        },
    ];

    const documents = [
        {
            id: AUDIT_IDS.documentA,
            householdId: AUDIT_IDS.defaultHouseholdId,
            type: "payslip",
            employeeId: AUDIT_IDS.employeeA,
            periodId: AUDIT_IDS.draftPeriodId,
            fileName: "Thandi Dlamini - April 2026.pdf",
            mimeType: "application/pdf",
            source: "generated",
            sizeBytes: 128004,
            createdAt: today,
        },
        {
            id: AUDIT_IDS.documentB,
            householdId: AUDIT_IDS.defaultHouseholdId,
            type: "contract",
            employeeId: AUDIT_IDS.employeeA,
            fileName: "Thandi Dlamini Contract.pdf",
            mimeType: "application/pdf",
            source: "generated",
            sizeBytes: 98412,
            createdAt: "2026-02-14T08:00:00.000Z",
        },
    ];

    const contracts = [
        {
            id: AUDIT_IDS.contractId,
            householdId: AUDIT_IDS.defaultHouseholdId,
            employeeId: AUDIT_IDS.employeeA,
            status: "active",
            version: 1,
            signedAt: "2025-01-10",
            effectiveDate: "2025-01-10",
            jobTitle: "Domestic Worker",
            placeOfWork: "18 Acacia Avenue, Northcliff, Johannesburg, 2195",
            duties: ["Cleaning", "Laundry", "Child supervision"],
            workingHours: {
                daysPerWeek: 5,
                startAt: "08:00",
                endAt: "17:00",
                breakDuration: 60,
            },
            salary: {
                amount: 30.23,
                frequency: "Monthly",
            },
            leave: {
                annualDays: 21,
                sickDays: 30,
            },
            terms: {
                accommodationProvided: false,
                accommodationDetails: "",
                overtimeAgreement: "Overtime must be agreed in advance and paid according to the BCEA.",
                sundayHolidayAgreement: "Sunday and public-holiday work must be agreed and paid at the correct rate.",
                noticeClause: "Notice periods follow the BCEA and should be given in writing.",
                lawyerReviewAcknowledged: true,
            },
            createdAt: "2025-01-10T08:00:00.000Z",
            updatedAt: today,
        },
    ];

    return {
        households,
        settings: globalSettings,
        householdSettings,
        employees,
        payslips,
        leave,
        payPeriods,
        documents,
        contracts,
    };
}

export async function setViewportForDevice(page: Page, device: AuditAction["device"]) {
    const sizes = {
        mobile: { width: 375, height: 812 },
        tablet: { width: 768, height: 1024 },
        desktop: { width: 1280, height: 900 },
    };
    await page.setViewportSize(sizes[device]);
}

export async function resetAndSeedAuditState(page: Page, mode: SeedMode) {
    await page.context().addCookies([
        {
            name: E2E_AUTH_BYPASS_COOKIE,
            value: "1",
            url: AUDIT_BASE_URL,
        },
    ]);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.addScriptTag({ path: LOCALFORAGE_SCRIPT_PATH });

    const payload = buildSeedPayload(mode);
    await page.evaluate(async ({ storeNames, payload }) => {
        function encodeStoredRecord(value: unknown) {
            return btoa(encodeURIComponent(JSON.stringify(value)));
        }

        function deleteDb(name: string) {
            return new Promise<void>((resolve) => {
                const request = indexedDB.deleteDatabase(name);
                request.onsuccess = resolve as () => void;
                request.onerror = resolve as () => void;
                request.onblocked = resolve as () => void;
            });
        }

        const wipeIndexedDb = async () => {
            if (!("indexedDB" in globalThis) || typeof indexedDB.databases !== "function") return;
            const databases = await indexedDB.databases();
            await Promise.all(databases.map((db) => db.name ? deleteDb(db.name) : Promise.resolve()));
        };

        await wipeIndexedDb();
        globalThis.localStorage.clear();
        globalThis.sessionStorage.clear();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const localforageApi = (globalThis as any).localforage;

        await Promise.all(
            storeNames.map(async (storeName) => {
                const store = localforageApi.createInstance({ name: "LekkerLedger", storeName });
                await store.clear();
            })
        );

        const settingsStore = localforageApi.createInstance({ name: "LekkerLedger", storeName: "settings" });
        const householdStore = localforageApi.createInstance({ name: "LekkerLedger", storeName: "households" });
        const employeeStore = localforageApi.createInstance({ name: "LekkerLedger", storeName: "employees" });
        const payslipStore = localforageApi.createInstance({ name: "LekkerLedger", storeName: "payslips" });
        const leaveStore = localforageApi.createInstance({ name: "LekkerLedger", storeName: "leave" });
        const payPeriodStore = localforageApi.createInstance({ name: "LekkerLedger", storeName: "pay_periods" });
        const documentStore = localforageApi.createInstance({ name: "LekkerLedger", storeName: "documents" });
        const contractStore = localforageApi.createInstance({ name: "LekkerLedger", storeName: "contracts" });

        await settingsStore.setItem("employer-settings", payload.settings);
        await settingsStore.setItem(`employer-settings::${payload.settings.activeHouseholdId}`, payload.householdSettings);

        await Promise.all(payload.households.map((household: { id: string }) => householdStore.setItem(household.id, household)));
        await Promise.all(payload.employees.map((employee: { id: string }) => employeeStore.setItem(employee.id, encodeStoredRecord(employee))));
        await Promise.all(payload.payslips.map((payslip: { id: string }) => payslipStore.setItem(payslip.id, encodeStoredRecord(payslip))));
        await Promise.all(payload.leave.map((record: { id: string }) => leaveStore.setItem(record.id, encodeStoredRecord(record))));
        await Promise.all(payload.payPeriods.map((period: { id: string }) => payPeriodStore.setItem(period.id, encodeStoredRecord(period))));
        await Promise.all(payload.documents.map((doc: { id: string }) => documentStore.setItem(doc.id, encodeStoredRecord(doc))));
        await Promise.all(payload.contracts.map((contract: { id: string }) => contractStore.setItem(contract.id, encodeStoredRecord(contract))));
    }, { storeNames: [...STORE_NAMES], payload });
}

async function getRoleLocator(page: Page, step: Extract<AuditStep, { type: "clickByRole" }>): Promise<Locator> {
    if (step.role === "button") {
        return page.getByRole("button", { name: step.name, exact: step.exact });
    }
    if (step.role === "tab") {
        return page.getByRole("tab", { name: step.name, exact: step.exact });
    }
    return page.getByRole("link", { name: step.name, exact: step.exact });
}

export async function runAuditStep(page: Page, step: AuditStep) {
    switch (step.type) {
        case "clickByRole": {
            const locator = await getRoleLocator(page, step);
            await locator.first().waitFor({ state: "visible" });
            await locator.first().scrollIntoViewIfNeeded();
            await locator.first().click();
            break;
        }
        case "clickTestId": {
            const locator = page.getByTestId(step.testId).first();
            await locator.waitFor({ state: "visible" });
            await locator.scrollIntoViewIfNeeded();
            await locator.click();
            break;
        }
        case "clickSelector": {
            const locator = page.locator(step.selector).first();
            await locator.waitFor({ state: "visible" });
            await locator.scrollIntoViewIfNeeded();
            await locator.click();
            break;
        }
        case "fill":
            await page.locator(step.selector).first().fill(step.value);
            break;
        case "press":
            await page.keyboard.press(step.key);
            break;
        case "waitForUrl":
            await page.waitForURL(new RegExp(step.pattern));
            break;
        case "assertText":
            await page.waitForFunction((text) => {
                const matches = Array.from(document.querySelectorAll<HTMLElement>("body *")).filter((element) => {
                    const rect = element.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) return false;
                    return (element.textContent || "").includes(text);
                });
                return matches.length > 0;
            }, step.text);
            break;
    }

    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(400);
}

export async function collectAuditMetrics(page: Page): Promise<AuditMetrics> {
    return page.evaluate(() => {
        const numeric = (value: string) => Number.parseFloat(value) || 0;
        const visibleElements = Array.from(document.querySelectorAll<HTMLElement>("body *"));
        const viewportWidth = window.innerWidth;
        const overflowThreshold = 4;
        const tinyTextCount = visibleElements.filter((element) => {
            const rect = element.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return false;
            const fontSize = numeric(getComputedStyle(element).fontSize);
            return (element.textContent || "").replaceAll(/\s+/g, "").length >= 2 && fontSize > 0 && fontSize < 12;
        }).length;

        const undersizedTargetsCount = Array.from(document.querySelectorAll<HTMLElement>("a, button, input, select, textarea, [role='button'], [role='link']"))
            .filter((element) => {
                const rect = element.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) return false;
                return rect.width < 44 || rect.height < 44;
            }).length;

        const overflowOffenders = visibleElements.filter((element) => {
            const rect = element.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return false;
            const style = getComputedStyle(element);
            if (style.position === "fixed") return false;
            if ((element.textContent || "").trim() === "" && style.position === "absolute" && style.filter !== "none") {
                return false;
            }
            const overlapsViewport = rect.right > 0 && rect.left < viewportWidth;
            if (!overlapsViewport) return false;
            return rect.right > viewportWidth + overflowThreshold || rect.left < -overflowThreshold;
        });

        const visibleFixedBottomBars = visibleElements.filter((element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return rect.width > 0
                && rect.height > 0
                && (style.position === "fixed" || style.position === "sticky")
                && rect.bottom >= window.innerHeight - 8
                && rect.height >= 40;
        }).length;

        return {
            innerWidth: viewportWidth,
            docScrollWidth: document.documentElement.scrollWidth,
            overflow: overflowOffenders.length > 0,
            tinyTextCount,
            undersizedTargetsCount,
            visibleFixedBottomBars,
        };
    });
}

function inferIssues(metrics: AuditMetrics, consoleErrors: string[], pageErrors: string[]): string[] {
    const issues: string[] = [];
    const isTouchLayout = metrics.innerWidth <= 768;
    const meaningfulConsoleErrors = consoleErrors.filter((entry) => {
        const trimmed = entry.trim();
        if (trimmed === "%o") return false;
        if (trimmed.startsWith("Can't perform a React state update on a component that hasn't mounted yet.")) return false;
        return true;
    });
    const meaningfulPageErrors = pageErrors.filter((entry) => !entry.includes("Execution context was destroyed, most likely because of a navigation"));

    if (metrics.overflow) {
        issues.push("Horizontal overflow detected.");
    }

    if (isTouchLayout && metrics.tinyTextCount > 28) {
        issues.push(`High density of tiny text (${metrics.tinyTextCount} visible elements below 12px).`);
    }

    if (isTouchLayout && metrics.undersizedTargetsCount > 16) {
        issues.push(`Too many undersized tap targets (${metrics.undersizedTargetsCount} below 44px).`);
    }

    if (meaningfulPageErrors.length > 0) {
        issues.push(`Runtime errors present (${meaningfulPageErrors.length}).`);
    }

    if (meaningfulConsoleErrors.length > 0) {
        issues.push(`Console errors present (${meaningfulConsoleErrors.length}).`);
    }

    return issues;
}

export async function runAuditAction(page: Page, action: AuditAction): Promise<AuditResult> {
    page.setDefaultTimeout(12_000);
    page.setDefaultNavigationTimeout(30_000);
    await setViewportForDevice(page, action.device);
    await resetAndSeedAuditState(page, action.seed);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const onConsole = (msg: { type(): string; text(): string }) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
    };
    const onPageError = (error: Error) => pageErrors.push(error.message);
    page.on("console", onConsole);
    page.on("pageerror", onPageError);

    const screenshotDir = path.join(process.cwd(), "e2e-screenshots", "audit");
    await mkdir(screenshotDir, { recursive: true });

    try {
        await page.goto(action.route, { waitUntil: "domcontentloaded", timeout: 15_000 });
        await page.waitForTimeout(800);
        for (const step of action.steps ?? []) {
            await runAuditStep(page, step);
        }
    } catch (error) {
        pageErrors.push(error instanceof Error ? error.message : String(error));
    }

    let metrics: AuditMetrics;
    try {
        metrics = await collectAuditMetrics(page);
    } catch (error) {
        pageErrors.push(error instanceof Error ? error.message : String(error));
        metrics = {
            innerWidth: 0,
            docScrollWidth: 0,
            overflow: false,
            tinyTextCount: 0,
            undersizedTargetsCount: 0,
            visibleFixedBottomBars: 0,
        };
    }
    const issues = inferIssues(metrics, consoleErrors, pageErrors);
    const screenshotPath = path.join(screenshotDir, `${action.id}-${action.device}.png`);
    try {
        await page.screenshot({ path: screenshotPath, fullPage: true });
    } catch (error) {
        pageErrors.push(error instanceof Error ? error.message : String(error));
    }

    page.off("console", onConsole);
    page.off("pageerror", onPageError);

    const filteredConsoleErrors = consoleErrors.filter((entry) => {
        const trimmed = entry.trim();
        if (trimmed === "%o") return false;
        if (trimmed.startsWith("Can't perform a React state update on a component that hasn't mounted yet.")) return false;
        return true;
    });
    const filteredPageErrors = pageErrors.filter((entry) => !entry.includes("Execution context was destroyed, most likely because of a navigation"));

    return {
        action,
        status: issues.length > 0 ? "failed" : "passed",
        finalUrl: page.url(),
        screenshotPath,
        consoleErrors: filteredConsoleErrors,
        pageErrors: filteredPageErrors,
        issues,
        metrics,
    };
}

function describeSeverity(result: AuditResult): string {
    if (result.pageErrors.length > 0 || result.metrics.overflow) return "high";
    if (result.issues.length > 0) return "medium";
    return "info";
}

function describeRule(result: AuditResult): string {
    if (result.metrics.overflow) return "Responsive Rules / Mobile layout containment";
    if (result.metrics.innerWidth <= 768 && result.metrics.tinyTextCount > 28) return "Civic Ledger readability and scanability";
    if (result.metrics.innerWidth <= 768 && result.metrics.undersizedTargetsCount > 16) return "Mobile tap target minimums from UX guidelines";
    if (result.pageErrors.length > 0) return "Stability and recovery states";
    return "No rule breach detected";
}

function describeRecommendation(result: AuditResult): string {
    if (result.metrics.overflow) return "Restructure the layout at this breakpoint and remove any width assumptions that exceed the viewport.";
    if (result.metrics.innerWidth <= 768 && result.metrics.tinyTextCount > 28) return "Condense the information architecture for phone instead of shrinking the typography.";
    if (result.metrics.innerWidth <= 768 && result.metrics.undersizedTargetsCount > 16) return "Promote important links and controls to 44px touch-safe targets.";
    if (result.pageErrors.length > 0) return "Stabilize the route and add guard states before rendering dependent client logic.";
    if (result.consoleErrors.length > 0) return "Investigate console failures and add focused regression coverage for this route.";
    return "No change required from this run.";
}

export async function writeAuditReport(results: AuditResult[]) {
    const reportDir = path.join(process.cwd(), "e2e-reports");
    await mkdir(reportDir, { recursive: true });
    const reportPath = path.join(reportDir, "latest-audit-report.md");

    const lines = [
        "# LekkerLedger Audit Report",
        "",
        `Generated: ${new Date().toISOString()}`,
        `Actions run: ${results.length}`,
        `Failures: ${results.filter((result) => result.status === "failed").length}`,
        "",
        "## Summary",
        "",
        ...results.reduce<string[]>((acc, result) => {
            if (acc.some((line) => line.startsWith(`- ${result.action.group}:`))) return acc;
            const groupResults = results.filter((entry) => entry.action.group === result.action.group);
            acc.push(`- ${result.action.group}: ${groupResults.length} actions, ${groupResults.filter((entry) => entry.status === "failed").length} flagged`);
            return acc;
        }, []),
        "",
        "## Detailed Results",
        "",
    ];

    for (const result of results) {
        lines.push(`### ${result.action.label}`);
        lines.push(`- Severity: ${describeSeverity(result)}`);
        lines.push(`- Status: ${result.status}`);
        lines.push(`- Route: ${result.action.route}`);
        lines.push(`- Device: ${result.action.device}`);
        lines.push(`- Final URL: ${result.finalUrl}`);
        lines.push(`- Screenshot: ${result.screenshotPath.replaceAll("\\", "/")}`);
        lines.push(`- UX rule: ${describeRule(result)}`);
        lines.push(`- Recommendation: ${describeRecommendation(result)}`);
        lines.push(`- Repro: Open ${result.action.route} on ${result.action.device} and run the scripted steps for "${result.action.label}".`);
        if (result.issues.length > 0) {
            lines.push(`- Issues: ${result.issues.join(" | ")}`);
        }
        lines.push(`- Metrics: overflow=${result.metrics.overflow}, tinyText=${result.metrics.tinyTextCount}, undersizedTargets=${result.metrics.undersizedTargetsCount}, fixedBottomBars=${result.metrics.visibleFixedBottomBars}`);
        if (result.pageErrors.length > 0) {
            lines.push(`- Page errors: ${result.pageErrors.join(" | ")}`);
        }
        if (result.consoleErrors.length > 0) {
            lines.push(`- Console errors: ${result.consoleErrors.join(" | ")}`);
        }
        lines.push("");
    }

    await writeFile(reportPath, `${lines.join("\n")}\n`, "utf8");
    return reportPath;
}
