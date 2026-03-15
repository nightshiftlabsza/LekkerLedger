"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    BadgeCheck,
    CheckCircle2,
    Download,
    FileCheck2,
    Mail,
    RefreshCw,
    ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Stepper } from "@/components/ui/stepper";
import { createClient } from "@/lib/supabase/client";
import { getBrowserAppOrigin } from "@/lib/app-origin";
import { calculatePayslip, NMW_RATE } from "@/lib/calculator";
import {
    buildFreePayslipVerificationHref,
    parseFreePayslipVerificationState,
} from "@/lib/free-payslip-verification";
import { generatePayslipPdfBytes, getPayslipFilename } from "@/lib/pdf";
import { derivePayslipDraft, getMonthBounds, getMonthKey, normalizePayslipDraftToInput } from "@/lib/payslip-draft";
import { downloadPdf } from "@/lib/share";
import type { Employee, EmployerSettings, PayslipInput } from "@/lib/schema";

type FreePayslipFormState = {
    employerName: string;
    employerAddress: string;
    employeeName: string;
    employeeId: string;
    employeeRole: string;
    hourlyRate: string;
    monthKey: string;
    standardWorkingDaysThisMonth: string;
    ordinaryHoursOverride: string;
    overtimeHours: string;
    sundayHours: string;
    publicHolidayHours: string;
    shortShiftCount: string;
    shortShiftWorkedHours: string;
    otherDeductions: string;
};

type QuotaStatus = {
    email: string;
    monthKey: string;
    downloadsUsed: number;
    remainingDownloads: number;
    usedThisMonth: boolean;
};

type WizardStep = {
    label: string;
    question: string;
    summary: string;
};

type FieldErrors = Partial<Record<keyof FreePayslipFormState, string>>;
type VerificationState = "unverified" | "waiting" | "verified" | "quota-used" | "success";
type NoticeTone = "info" | "warning" | "danger" | "success";

const STEPS: WizardStep[] = [
    {
        label: "Worker",
        question: "Who is this payslip for?",
        summary: "Add the household and worker details that belong on the document.",
    },
    {
        label: "Month",
        question: "Which month is this payslip for?",
        summary: "Choose the month once and we fill in the period dates for you.",
    },
    {
        label: "Hours",
        question: "How much did they work?",
        summary: "Capture the rate, ordinary time, and any extra paid hours.",
    },
    {
        label: "Deductions",
        question: "Any deductions to show?",
        summary: "Add only deductions that were already agreed and recorded separately.",
    },
    {
        label: "Review",
        question: "Review the payslip and download it",
        summary: "Check the final figures, verify your email, and download the PDF.",
    },
];

const DEFAULT_FORM: FreePayslipFormState = {
    employerName: "",
    employerAddress: "",
    employeeName: "",
    employeeId: "",
    employeeRole: "Domestic Worker",
    hourlyRate: NMW_RATE.toFixed(2),
    monthKey: "",
    standardWorkingDaysThisMonth: "22",
    ordinaryHoursOverride: "",
    overtimeHours: "0",
    sundayHours: "0",
    publicHolidayHours: "0",
    shortShiftCount: "0",
    shortShiftWorkedHours: "0",
    otherDeductions: "0",
};

const FREE_PAYSLIP_DRAFT_STORAGE_KEY = "free-payslip-wizard-draft";

function parseNumber(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function buildPayload(form: FreePayslipFormState): { employee: Employee; payslip: PayslipInput; settings: EmployerSettings } | null {
    if (!form.employerName.trim() || !form.employeeName.trim() || !form.monthKey) {
        return null;
    }

    const monthBounds = getMonthBounds(form.monthKey);
    const employee: Employee = {
        id: crypto.randomUUID(),
        householdId: "free-tool",
        name: form.employeeName.trim(),
        idNumber: form.employeeId.trim(),
        role: form.employeeRole.trim() || "Domestic Worker",
        hourlyRate: parseNumber(form.hourlyRate),
        phone: "",
        email: "",
        address: "",
        startDate: monthBounds.start.toISOString().slice(0, 10),
        startDateIsApproximate: false,
        leaveCycleStartDate: "",
        leaveCycleEndDate: "",
        annualLeaveBalanceAsOfDate: "",
        ordinarilyWorksSundays: false,
        ordinaryHoursPerDay: 8,
        frequency: "Monthly",
    };

    const payslip: PayslipInput = normalizePayslipDraftToInput({
        id: crypto.randomUUID(),
        householdId: "free-tool",
        employeeId: employee.id,
        monthKey: form.monthKey,
        standardWorkingDaysThisMonth: parseNumber(form.standardWorkingDaysThisMonth),
        ordinaryHoursPerDay: 8,
        ordinaryHoursOverride: form.ordinaryHoursOverride.trim() ? parseNumber(form.ordinaryHoursOverride) : null,
        overtimeHours: parseNumber(form.overtimeHours),
        sundayHours: parseNumber(form.sundayHours),
        publicHolidayHours: parseNumber(form.publicHolidayHours),
        shortShiftCount: parseNumber(form.shortShiftCount),
        shortShiftWorkedHours: parseNumber(form.shortShiftWorkedHours),
        hourlyRate: parseNumber(form.hourlyRate),
        ordinarilyWorksSundays: false,
        includeAccommodation: false,
        accommodationCost: undefined,
        otherDeductions: parseNumber(form.otherDeductions),
        createdAt: new Date(),
        annualLeaveTaken: 0,
        sickLeaveTaken: 0,
        familyLeaveTaken: 0,
    });

    const settings: EmployerSettings = {
        employerName: form.employerName.trim(),
        employerAddress: form.employerAddress.trim(),
        employerIdNumber: "",
        uifRefNumber: "",
        cfNumber: "",
        sdlNumber: "",
        phone: "",
        employerEmail: "",
        proStatus: "free",
        paidUntil: undefined,
        billingCycle: "monthly",
        activeHouseholdId: "free-tool",
        logoData: undefined,
        defaultLanguage: "en",
        density: "comfortable",
        piiObfuscationEnabled: true,
        installationId: "free-tool",
        usageHistory: [],
        customLeaveTypes: [],
    };

    return { employee, payslip, settings };
}

function loadSavedDraft() {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        const rawDraft = window.sessionStorage.getItem(FREE_PAYSLIP_DRAFT_STORAGE_KEY);
        if (!rawDraft) return null;
        return JSON.parse(rawDraft) as {
            form?: FreePayslipFormState;
            currentStep?: number;
            verificationEmail?: string;
        };
    } catch {
        return null;
    }
}

function getNoticeStyles(tone: NoticeTone) {
    if (tone === "danger") {
        return "border-[var(--danger)]/25 bg-[color:color-mix(in_srgb,var(--danger)_8%,var(--surface-raised))] text-[var(--text)]";
    }

    if (tone === "warning") {
        return "border-[var(--warning)]/30 bg-[color:color-mix(in_srgb,var(--warning)_10%,var(--surface-raised))] text-[var(--text)]";
    }

    if (tone === "success") {
        return "border-[var(--success)]/25 bg-[color:color-mix(in_srgb,var(--success)_10%,var(--surface-raised))] text-[var(--text)]";
    }

    return "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]";
}

function TextField({
    id,
    label,
    hint,
    error,
    children,
}: Readonly<{
    id: string;
    label: string;
    hint?: string;
    error?: string;
    children: React.ReactNode;
}>) {
    return (
        <label htmlFor={id} className="block space-y-2">
            <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</span>
            {children}
            {hint ? <span className="block text-sm leading-6 text-[var(--text-muted)]">{hint}</span> : null}
            {error ? <span className="block text-sm font-medium text-[var(--danger)]">{error}</span> : null}
        </label>
    );
}

function SummaryRow({
    label,
    value,
    accent = false,
}: Readonly<{
    label: string;
    value: string;
    accent?: boolean;
}>) {
    return (
        <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-[var(--text-muted)]">{label}</span>
            <span className={accent ? "font-bold text-[var(--primary)]" : "font-semibold text-[var(--text)]"}>{value}</span>
        </div>
    );
}

function ActionBar({
    currentStep,
    onBack,
    onNext,
    nextLabel,
    nextDisabled = false,
    nextLoading = false,
}: Readonly<{
    currentStep: number;
    onBack: () => void;
    onNext: () => void;
    nextLabel: string;
    nextDisabled?: boolean;
    nextLoading?: boolean;
}>) {
    return (
        <>
            <div className="hidden items-center justify-between gap-3 border-t border-[var(--border)] pt-6 md:flex">
                <Button type="button" variant="outline" onClick={onBack} disabled={currentStep === 0}>
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <Button type="button" size="lg" onClick={onNext} disabled={nextDisabled} loading={nextLoading}>
                    {nextLabel}
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>

            <div
                className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border)] bg-[var(--surface-raised)]/95 px-4 py-3 backdrop-blur md:hidden"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
            >
                <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={currentStep === 0}>
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <Button type="button" size="lg" className="flex-[1.4]" onClick={onNext} disabled={nextDisabled} loading={nextLoading}>
                        {nextLabel}
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </>
    );
}

export function FreePayslipGenerator() {
    const supabase = React.useMemo(() => createClient(), []);
    const searchParams = useSearchParams();
    const callbackState = React.useMemo(
        () => parseFreePayslipVerificationState(searchParams ? searchParams.get("freePayslipVerification") : null),
        [searchParams],
    );
    const [form, setForm] = React.useState<FreePayslipFormState>(() => {
        const savedDraft = loadSavedDraft();
        return {
            ...DEFAULT_FORM,
            monthKey: getMonthKey(new Date()),
            ...savedDraft?.form,
        };
    });
    const [currentStep, setCurrentStep] = React.useState(() => {
        const savedDraft = loadSavedDraft();
        return typeof savedDraft?.currentStep === "number" ? savedDraft.currentStep : 0;
    });
    const [errors, setErrors] = React.useState<FieldErrors>({});
    const [verificationEmail, setVerificationEmail] = React.useState(() => {
        const savedDraft = loadSavedDraft();
        return savedDraft?.verificationEmail ?? "";
    });
    const [verifiedEmail, setVerifiedEmail] = React.useState("");
    const [quota, setQuota] = React.useState<QuotaStatus | null>(null);
    const [verificationState, setVerificationState] = React.useState<VerificationState>("unverified");
    const [statusTone, setStatusTone] = React.useState<NoticeTone>("info");
    const [statusMessage, setStatusMessage] = React.useState("");
    const [sendingVerification, setSendingVerification] = React.useState(false);
    const [checkingVerification, setCheckingVerification] = React.useState(false);
    const [downloading, setDownloading] = React.useState(false);

    const derivedDraft = React.useMemo(() => derivePayslipDraft({
        householdId: "free-tool",
        employeeId: "preview",
        monthKey: form.monthKey,
        standardWorkingDaysThisMonth: parseNumber(form.standardWorkingDaysThisMonth),
        ordinaryHoursPerDay: 8,
        ordinaryHoursOverride: form.ordinaryHoursOverride.trim() ? parseNumber(form.ordinaryHoursOverride) : null,
        overtimeHours: parseNumber(form.overtimeHours),
        sundayHours: parseNumber(form.sundayHours),
        publicHolidayHours: parseNumber(form.publicHolidayHours),
        shortShiftCount: parseNumber(form.shortShiftCount),
        shortShiftWorkedHours: parseNumber(form.shortShiftWorkedHours),
        hourlyRate: parseNumber(form.hourlyRate),
        ordinarilyWorksSundays: false,
        includeAccommodation: false,
        otherDeductions: parseNumber(form.otherDeductions),
    }), [form]);

    const payload = React.useMemo(() => buildPayload(form), [form]);
    const breakdown = React.useMemo(() => (payload ? calculatePayslip(payload.payslip) : null), [payload]);
    const totalPremiumHours = parseNumber(form.overtimeHours) + parseNumber(form.sundayHours) + parseNumber(form.publicHolidayHours);
    const hourlyRate = parseNumber(form.hourlyRate);
    const hasBelowMinimumWage = hourlyRate > 0 && hourlyRate < NMW_RATE;
    const reviewReady = Boolean(payload && breakdown);

    const updateField = React.useCallback((key: keyof FreePayslipFormState, value: string) => {
        setForm((current) => ({ ...current, [key]: value }));
        setErrors((current) => {
            if (!current[key]) return current;
            const nextErrors = { ...current };
            delete nextErrors[key];
            return nextErrors;
        });
    }, []);

    const applyVerificationState = React.useCallback((
        state: VerificationState,
        message: string,
        tone: NoticeTone,
        nextQuota: QuotaStatus | null,
        nextVerifiedEmail: string,
    ) => {
        setVerificationState(state);
        setStatusMessage(message);
        setStatusTone(tone);
        setQuota(nextQuota);
        setVerifiedEmail(nextVerifiedEmail);
        if (nextVerifiedEmail) {
            setVerificationEmail(nextVerifiedEmail);
        }
    }, []);

    const refreshVerification = React.useCallback(async (
        source: "mount" | "callback" | "manual" | "focus",
    ) => {
        if (verificationState === "success" && source !== "manual") {
            return;
        }

        setCheckingVerification(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const hasSession = Boolean(user?.email);
            const shouldCheckQuota = hasSession
                || callbackState === "success"
                || source === "manual"
                || source === "focus"
                || (source === "mount" && Boolean(verificationEmail));

            if (!shouldCheckQuota) {
                if (callbackState === "invalid-link") {
                    applyVerificationState(
                        verificationEmail ? "waiting" : "unverified",
                        "That link is invalid or expired. Send a fresh link and open it on this phone.",
                        "danger",
                        null,
                        "",
                    );
                } else if (callbackState === "missing-session") {
                    applyVerificationState(
                        verificationEmail ? "waiting" : "unverified",
                        "We could not confirm this email on this device yet. Open a fresh link on the same phone, then check again.",
                        "warning",
                        null,
                        "",
                    );
                } else if (!verificationEmail) {
                    applyVerificationState("unverified", "", "info", null, "");
                }
                return;
            }

            const response = await fetch("/api/free-payslip/quota", {
                method: "GET",
                cache: "no-store",
            });

            if (response.status === 401) {
                const waitingMessage = callbackState === "success" || callbackState === "missing-session"
                    ? "We are still waiting for the verified session on this device. Open the link on this phone, then check again."
                    : "Open the link from your email on this device, then come back here to finish the download.";
                applyVerificationState(
                    verificationEmail ? "waiting" : "unverified",
                    waitingMessage,
                    callbackState === "missing-session" ? "warning" : "info",
                    null,
                    "",
                );
                return;
            }

            const data = await response.json() as QuotaStatus | { error?: string };
            if (!response.ok) {
                throw new Error(typeof data === "object" && data && "error" in data && typeof data.error === "string"
                    ? data.error
                    : "The free monthly limit could not be checked.");
            }

            const nextQuota = data as QuotaStatus;
            if (nextQuota.usedThisMonth) {
                applyVerificationState(
                    "quota-used",
                    "This verified email has already used its free PDF for this month.",
                    "warning",
                    nextQuota,
                    nextQuota.email,
                );
                return;
            }

            applyVerificationState(
                "verified",
                source === "callback" || callbackState === "success"
                    ? "Email verified on this device. You can download the PDF now."
                    : "This email is verified for this month.",
                "success",
                nextQuota,
                nextQuota.email,
            );
        } catch (error) {
            applyVerificationState(
                verificationEmail ? "waiting" : "unverified",
                error instanceof Error ? error.message : "The verification status could not be checked.",
                "danger",
                null,
                "",
            );
        } finally {
            setCheckingVerification(false);
        }
    }, [applyVerificationState, callbackState, supabase.auth, verificationEmail, verificationState]);

    React.useEffect(() => {
        void refreshVerification(callbackState ? "callback" : "mount");
    }, [callbackState, refreshVerification]);

    React.useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        window.sessionStorage.setItem(FREE_PAYSLIP_DRAFT_STORAGE_KEY, JSON.stringify({
            form,
            currentStep,
            verificationEmail,
        }));
    }, [currentStep, form, verificationEmail]);

    React.useEffect(() => {
        function recheckFromFocus() {
            if (document.visibilityState === "visible" && verificationState === "waiting") {
                void refreshVerification("focus");
            }
        }

        function recheckFromWindowFocus() {
            if (verificationState === "waiting") {
                void refreshVerification("focus");
            }
        }

        document.addEventListener("visibilitychange", recheckFromFocus);
        window.addEventListener("focus", recheckFromWindowFocus);

        return () => {
            document.removeEventListener("visibilitychange", recheckFromFocus);
            window.removeEventListener("focus", recheckFromWindowFocus);
        };
    }, [refreshVerification, verificationState]);

    const validateStep = React.useCallback((stepIndex: number) => {
        const nextErrors: FieldErrors = {};

        if (stepIndex === 0) {
            if (!form.employerName.trim()) nextErrors.employerName = "Add the household employer name.";
            if (!form.employerAddress.trim()) nextErrors.employerAddress = "Add the employer address shown on the payslip.";
            if (!form.employeeName.trim()) nextErrors.employeeName = "Add the worker's full name.";
            if (!form.employeeRole.trim()) nextErrors.employeeRole = "Add the worker's role.";
        }

        if (stepIndex === 1) {
            if (!form.monthKey) nextErrors.monthKey = "Choose the month for this payslip.";
        }

        if (stepIndex === 2) {
            if (!form.hourlyRate.trim()) {
                nextErrors.hourlyRate = "Add the hourly rate.";
            } else if (parseNumber(form.hourlyRate) < NMW_RATE) {
                nextErrors.hourlyRate = `The hourly rate must be at least R${NMW_RATE.toFixed(2)}.`;
            }

            const daysWorked = parseNumber(form.standardWorkingDaysThisMonth);
            if (daysWorked < 0) {
                nextErrors.standardWorkingDaysThisMonth = "Working days cannot be negative.";
            }

            if (daysWorked === 0 && totalPremiumHours <= 0 && parseNumber(form.shortShiftWorkedHours) <= 0) {
                nextErrors.standardWorkingDaysThisMonth = "Add standard working days or extra paid hours for this month.";
            }

            if (daysWorked > 0 && derivedDraft.ordinaryHours <= 0) {
                nextErrors.ordinaryHoursOverride = "Ordinary hours must be greater than 0 when days worked are entered.";
            }
        }

        if (stepIndex === 3 && parseNumber(form.otherDeductions) < 0) {
            nextErrors.otherDeductions = "Deductions cannot be negative.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }, [derivedDraft.ordinaryHours, form, totalPremiumHours]);

    const goNext = React.useCallback(() => {
        if (!validateStep(currentStep)) {
            return;
        }

        setCurrentStep((step) => Math.min(step + 1, STEPS.length - 1));
    }, [currentStep, validateStep]);

    const goBack = React.useCallback(() => {
        setCurrentStep((step) => Math.max(step - 1, 0));
    }, []);

    const sendVerificationLink = React.useCallback(async () => {
        const email = verificationEmail.trim().toLowerCase();
        if (!email) {
            setStatusMessage("Enter your email address first.");
            setStatusTone("danger");
            return;
        }

        setSendingVerification(true);
        setStatusMessage("");

        try {
            const next = buildFreePayslipVerificationHref("success");
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${getBrowserAppOrigin()}/api/auth/callback?next=${encodeURIComponent(next)}`,
                },
            });

            if (error) {
                throw error;
            }

            setVerificationState("waiting");
            setStatusTone("info");
            setStatusMessage("Verification link sent. Open it on this phone, then come back here and check again.");
        } catch (error) {
            setStatusTone("danger");
            setStatusMessage(error instanceof Error ? error.message : "The verification email could not be sent.");
        } finally {
            setSendingVerification(false);
        }
    }, [supabase.auth, verificationEmail]);

    const handleUseDifferentEmail = React.useCallback(async () => {
        await supabase.auth.signOut();
        await fetch("/api/free-payslip/session", {
            method: "DELETE",
            cache: "no-store",
        }).catch(() => undefined);

        setVerificationEmail("");
        applyVerificationState("unverified", "", "info", null, "");
    }, [applyVerificationState, supabase.auth]);

    const handleDownload = React.useCallback(async () => {
        if (!reviewReady || !payload || !breakdown) {
            setStatusTone("danger");
            setStatusMessage("Complete the payslip details first so the PDF can be prepared.");
            return;
        }

        if (verificationState !== "verified") {
            setStatusTone("warning");
            setStatusMessage("Verify your email on this device before downloading the PDF.");
            return;
        }

        setDownloading(true);

        try {
            const pdfBytes = await generatePayslipPdfBytes(payload.employee, payload.payslip, payload.settings, "en", true);
            const quotaResponse = await fetch("/api/free-payslip/quota", {
                method: "POST",
                cache: "no-store",
            });
            const quotaData = await quotaResponse.json() as QuotaStatus | { error?: string };

            if (!quotaResponse.ok) {
                if (quotaResponse.status === 409) {
                    applyVerificationState(
                        "quota-used",
                        typeof quotaData === "object" && quotaData && "error" in quotaData && typeof quotaData.error === "string"
                            ? quotaData.error
                            : "This verified email has already used its free PDF for this month.",
                        "warning",
                        null,
                        verifiedEmail,
                    );
                    return;
                }

                if (quotaResponse.status === 401) {
                    applyVerificationState(
                        "waiting",
                        "This verified session expired before download. Open the email link on this device again, then check once more.",
                        "warning",
                        null,
                        "",
                    );
                    return;
                }

                throw new Error(typeof quotaData === "object" && quotaData && "error" in quotaData && typeof quotaData.error === "string"
                    ? quotaData.error
                    : "The free monthly limit could not be updated.");
            }

            downloadPdf(pdfBytes, getPayslipFilename(payload.employee, payload.payslip));
            const consumedQuota = quotaData as QuotaStatus;
            setQuota(consumedQuota);
            setVerificationState("success");
            setStatusTone("success");
            setStatusMessage("Payslip downloaded. If you need this saved for next month, the paid workspace keeps worker details, history, and documents together.");
        } catch (error) {
            setStatusTone("danger");
            setStatusMessage(error instanceof Error ? error.message : "The PDF could not be downloaded.");
        } finally {
            setDownloading(false);
        }
    }, [applyVerificationState, breakdown, payload, reviewReady, verificationState, verifiedEmail]);

    const gateCardTitle = verificationState === "success"
        ? "Download complete"
        : verificationState === "quota-used"
            ? "This month's free PDF is already used"
            : verificationState === "verified"
                ? "Email verified"
                : verificationState === "waiting"
                    ? "Check your email"
                    : "Verify your email";

    const gatePrimaryAction = verificationState === "unverified"
        ? (
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Input
                    type="email"
                    value={verificationEmail}
                    onChange={(event) => setVerificationEmail(event.target.value)}
                    placeholder="you@example.com"
                />
                <Button type="button" size="lg" onClick={() => void sendVerificationLink()} loading={sendingVerification}>
                    <Mail className="h-4 w-4" />
                    Send verification link
                </Button>
            </div>
        )
        : verificationState === "waiting"
            ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                    <Button type="button" size="lg" onClick={() => void refreshVerification("manual")} loading={checkingVerification}>
                        <RefreshCw className="h-4 w-4" />
                        I opened the link on this device
                    </Button>
                    <Button type="button" variant="outline" onClick={() => void sendVerificationLink()} loading={sendingVerification}>
                        Send a new link
                    </Button>
                </div>
            )
            : verificationState === "verified"
                ? (
                    <Button type="button" size="lg" onClick={() => void handleDownload()} loading={downloading}>
                        <Download className="h-4 w-4" />
                        Download payslip PDF
                    </Button>
                )
                : null;

    return (
        <section id="free-payslip-wizard" data-testid="free-payslip-wizard" className="space-y-6 scroll-mt-24">
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                            <ShieldCheck className="h-3.5 w-3.5 text-[var(--primary)]" />
                            Free payslip wizard
                        </div>
                        <h2 className="font-serif text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
                            Create this month&apos;s payslip step by step
                        </h2>
                        <p className="max-w-2xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
                            Work through one question at a time, review the final figures, then verify your email before the PDF download.
                        </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text)]">
                        Step <span className="font-bold">{currentStep + 1}</span> of {STEPS.length}
                    </div>
                </div>

                <div className="mt-6 overflow-x-auto pb-2">
                    <div>
                        <Stepper
                            steps={STEPS}
                            currentStep={currentStep}
                            onStepClick={(index) => {
                                if (index <= currentStep) setCurrentStep(index);
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-md)] sm:p-8">
                <div className="space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {STEPS[currentStep].label}
                    </p>
                    <h3 className="font-serif text-2xl font-bold text-[var(--text)] sm:text-[2rem]">
                        {STEPS[currentStep].question}
                    </h3>
                    <p className="max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
                        {STEPS[currentStep].summary}
                    </p>
                </div>

                {currentStep === 0 ? (
                    <div className="mt-8 grid gap-5 md:grid-cols-2">
                        <TextField id="free-employer-name" label="Employer name" error={errors.employerName}>
                            <Input
                                id="free-employer-name"
                                value={form.employerName}
                                onChange={(event) => updateField("employerName", event.target.value)}
                                placeholder="Household employer name"
                                error={errors.employerName}
                            />
                        </TextField>

                        <TextField id="free-employee-name" label="Worker name" error={errors.employeeName}>
                            <Input
                                id="free-employee-name"
                                value={form.employeeName}
                                onChange={(event) => updateField("employeeName", event.target.value)}
                                placeholder="Worker full name"
                                error={errors.employeeName}
                            />
                        </TextField>

                        <TextField id="free-employer-address" label="Employer address" error={errors.employerAddress}>
                            <textarea
                                id="free-employer-address"
                                value={form.employerAddress}
                                onChange={(event) => updateField("employerAddress", event.target.value)}
                                placeholder="Street address"
                                className={`min-h-[120px] w-full rounded-[12px] border bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text)] outline-none transition-all focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 ${errors.employerAddress ? "border-[var(--danger)]" : "border-[var(--border)]"}`}
                            />
                        </TextField>

                        <div className="grid gap-5">
                            <TextField id="free-employee-role" label="Worker role" error={errors.employeeRole}>
                                <Input
                                    id="free-employee-role"
                                    value={form.employeeRole}
                                    onChange={(event) => updateField("employeeRole", event.target.value)}
                                    placeholder="Domestic worker"
                                    error={errors.employeeRole}
                                />
                            </TextField>

                            <TextField
                                id="free-employee-id"
                                label="ID or passport"
                                hint="Optional, but helpful when the payslip is shared later."
                            >
                                <Input
                                    id="free-employee-id"
                                    value={form.employeeId}
                                    onChange={(event) => updateField("employeeId", event.target.value)}
                                    placeholder="ID or passport number"
                                />
                            </TextField>
                        </div>
                    </div>
                ) : null}

                {currentStep === 1 ? (
                    <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
                        <div className="space-y-5">
                            <TextField
                                id="free-payslip-month"
                                label="Payslip month"
                                hint="We use the first and last day of that calendar month for the pay period."
                                error={errors.monthKey}
                            >
                                <Input
                                    id="free-payslip-month"
                                    type="month"
                                    value={form.monthKey}
                                    onChange={(event) => updateField("monthKey", event.target.value)}
                                    error={errors.monthKey}
                                />
                            </TextField>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <TextField id="free-period-start" label="Period start">
                                    <Input id="free-period-start" type="date" value={format(derivedDraft.payPeriodStart, "yyyy-MM-dd")} readOnly />
                                </TextField>
                                <TextField id="free-period-end" label="Period end">
                                    <Input id="free-period-end" type="date" value={format(derivedDraft.payPeriodEnd, "yyyy-MM-dd")} readOnly />
                                </TextField>
                            </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">What happens here?</p>
                            <p className="mt-3 text-lg font-semibold text-[var(--text)]">Choose the month once.</p>
                            <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                                The review screen will show the matching start and end dates automatically, so this step stays short.
                            </p>
                        </div>
                    </div>
                ) : null}

                {currentStep === 2 ? (
                    <div className="mt-8 space-y-6">
                        {hasBelowMinimumWage ? (
                            <div className="rounded-[1.5rem] border border-[var(--danger)]/30 bg-[color:color-mix(in_srgb,var(--danger)_8%,var(--surface-raised))] p-4 text-sm leading-7 text-[var(--text)]">
                                The hourly rate must be at least <strong>R{NMW_RATE.toFixed(2)}</strong> for March 2026 rules.
                            </div>
                        ) : null}

                        <div className="grid gap-5 md:grid-cols-2">
                            <TextField id="free-hourly-rate" label="Hourly rate (R)" error={errors.hourlyRate}>
                                <Input
                                    id="free-hourly-rate"
                                    type="number"
                                    step="0.01"
                                    value={form.hourlyRate}
                                    onChange={(event) => updateField("hourlyRate", event.target.value)}
                                    error={errors.hourlyRate}
                                />
                            </TextField>

                            <TextField
                                id="free-working-days"
                                label="Standard working days this month"
                                hint="Use the normal number of workdays for this month."
                                error={errors.standardWorkingDaysThisMonth}
                            >
                                <Input
                                    id="free-working-days"
                                    type="number"
                                    min="0"
                                    value={form.standardWorkingDaysThisMonth}
                                    onChange={(event) => updateField("standardWorkingDaysThisMonth", event.target.value)}
                                    error={errors.standardWorkingDaysThisMonth}
                                />
                            </TextField>

                            <TextField
                                id="free-ordinary-hours"
                                label="Ordinary hours"
                                hint={derivedDraft.hasManualOrdinaryHoursOverride
                                    ? `Manual override in use. Auto-calculated hours would be ${derivedDraft.autoOrdinaryHours}.`
                                    : `Auto-calculated as ${derivedDraft.autoOrdinaryHours} hours from ${parseNumber(form.standardWorkingDaysThisMonth)} standard days x 8 hours.`}
                                error={errors.ordinaryHoursOverride}
                            >
                                <div className="space-y-2">
                                    <Input
                                        id="free-ordinary-hours"
                                        type="number"
                                        step="0.01"
                                        value={form.ordinaryHoursOverride || (derivedDraft.autoOrdinaryHours ? String(derivedDraft.autoOrdinaryHours) : "")}
                                        onChange={(event) => updateField("ordinaryHoursOverride", event.target.value)}
                                        error={errors.ordinaryHoursOverride}
                                    />
                                    {derivedDraft.hasManualOrdinaryHoursOverride ? (
                                        <button
                                            type="button"
                                            className="text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline"
                                            onClick={() => updateField("ordinaryHoursOverride", "")}
                                        >
                                            Use the auto-calculated hours instead
                                        </button>
                                    ) : null}
                                </div>
                            </TextField>

                            <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">At a glance</p>
                                <div className="mt-4 space-y-3">
                                    <SummaryRow label="Ordinary hours" value={`${derivedDraft.ordinaryHours.toFixed(2)}h`} />
                                    <SummaryRow label="4-hour top-up" value={`${derivedDraft.shortFallHours.toFixed(2)}h`} />
                                    <SummaryRow label="Extra paid hours" value={`${totalPremiumHours.toFixed(2)}h`} />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-5 md:grid-cols-3">
                            <TextField id="free-overtime-hours" label="Overtime hours">
                                <Input
                                    id="free-overtime-hours"
                                    type="number"
                                    step="0.01"
                                    value={form.overtimeHours}
                                    onChange={(event) => updateField("overtimeHours", event.target.value)}
                                />
                            </TextField>
                            <TextField id="free-sunday-hours" label="Sunday hours">
                                <Input
                                    id="free-sunday-hours"
                                    type="number"
                                    step="0.01"
                                    value={form.sundayHours}
                                    onChange={(event) => updateField("sundayHours", event.target.value)}
                                />
                            </TextField>
                            <TextField
                                id="free-public-holiday-hours"
                                label="Public holiday hours"
                                hint="Use this only for hours actually worked on the public holiday."
                            >
                                <Input
                                    id="free-public-holiday-hours"
                                    type="number"
                                    step="0.01"
                                    value={form.publicHolidayHours}
                                    onChange={(event) => updateField("publicHolidayHours", event.target.value)}
                                />
                            </TextField>
                        </div>

                        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                            <div className="flex items-center gap-2">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Short shifts (4-hour rule)</p>
                                <InfoTooltip
                                    label="Explain the 4-hour rule"
                                    tooltip="If someone worked more than 0 but less than 4 hours on a day, they still need to be paid for at least 4 hours for that day."
                                />
                            </div>
                            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                                Add the short shifts only when the worker was present for less than 4 hours on a day.
                            </p>
                            <div className="mt-5 grid gap-5 md:grid-cols-2">
                                <TextField id="free-short-shift-count" label="How many short shifts?">
                                    <Input
                                        id="free-short-shift-count"
                                        type="number"
                                        min="0"
                                        value={form.shortShiftCount}
                                        onChange={(event) => updateField("shortShiftCount", event.target.value)}
                                    />
                                </TextField>
                                <TextField id="free-short-shift-hours" label="Hours actually worked across them">
                                    <Input
                                        id="free-short-shift-hours"
                                        type="number"
                                        step="0.01"
                                        value={form.shortShiftWorkedHours}
                                        onChange={(event) => updateField("shortShiftWorkedHours", event.target.value)}
                                    />
                                </TextField>
                            </div>
                            <div className="mt-4 rounded-[1rem] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text)]">
                                Extra paid hours added by the 4-hour rule: <strong>{derivedDraft.shortFallHours.toFixed(2)}h</strong>
                            </div>
                        </div>
                    </div>
                ) : null}

                {currentStep === 3 ? (
                    <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
                        <div className="space-y-5">
                            <TextField
                                id="free-other-deductions"
                                label="Other agreed deductions (R)"
                                hint="Only include deductions that were already agreed and recorded separately."
                                error={errors.otherDeductions}
                            >
                                <Input
                                    id="free-other-deductions"
                                    type="number"
                                    step="0.01"
                                    value={form.otherDeductions}
                                    onChange={(event) => updateField("otherDeductions", event.target.value)}
                                    error={errors.otherDeductions}
                                />
                            </TextField>
                        </div>

                        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Keep this calm and exact</p>
                            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--text-muted)]">
                                <li>UIF is calculated automatically when the month qualifies.</li>
                                <li>Only add extra deductions that are lawful and already agreed.</li>
                                <li>The review screen will show gross pay, deductions, and net pay before download.</li>
                            </ul>
                        </div>
                    </div>
                ) : null}

                {currentStep === 4 ? (
                    <div className="mt-8 space-y-6 pb-24 md:pb-0">
                        <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-2)] p-5 sm:p-6">
                            <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Payslip review</p>
                                    <h4 className="mt-2 font-serif text-2xl font-bold text-[var(--text)]">
                                        {form.employeeName || "Worker name"}
                                    </h4>
                                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                                        {form.employeeRole || "Domestic worker"} · {form.monthKey ? format(getMonthBounds(form.monthKey).start, "MMMM yyyy") : "Choose a month"}
                                    </p>
                                </div>
                                <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Net pay</p>
                                    <p className="mt-1 font-serif text-3xl font-bold text-[var(--text)]">
                                        {breakdown ? `R ${breakdown.netPay.toFixed(2)}` : "R 0.00"}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-5 lg:grid-cols-2">
                                <div className="space-y-4 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Document details</p>
                                    <SummaryRow label="Employer" value={form.employerName || "-"} />
                                    <SummaryRow label="Worker" value={form.employeeName || "-"} />
                                    <SummaryRow label="ID / passport" value={form.employeeId || "Not added"} />
                                    <SummaryRow
                                        label="Pay period"
                                        value={form.monthKey ? `${format(derivedDraft.payPeriodStart, "dd MMM yyyy")} to ${format(derivedDraft.payPeriodEnd, "dd MMM yyyy")}` : "-"}
                                    />
                                </div>

                                <div className="space-y-4 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Hours and rate</p>
                                    <SummaryRow label="Hourly rate" value={`R ${hourlyRate.toFixed(2)}`} />
                                    <SummaryRow label="Ordinary hours" value={`${derivedDraft.ordinaryHours.toFixed(2)}h`} />
                                    <SummaryRow label="Overtime" value={`${parseNumber(form.overtimeHours).toFixed(2)}h`} />
                                    <SummaryRow label="Sunday" value={`${parseNumber(form.sundayHours).toFixed(2)}h`} />
                                    <SummaryRow label="Public holiday" value={`${parseNumber(form.publicHolidayHours).toFixed(2)}h`} />
                                </div>
                            </div>

                            <div className="mt-5 grid gap-5 lg:grid-cols-2">
                                <div className="space-y-4 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Pay totals</p>
                                    <SummaryRow label="Gross pay" value={breakdown ? `R ${breakdown.grossPay.toFixed(2)}` : "R 0.00"} />
                                    <SummaryRow label="Employee UIF" value={breakdown ? `R ${breakdown.deductions.uifEmployee.toFixed(2)}` : "R 0.00"} />
                                    <SummaryRow label="Other deductions" value={`R ${parseNumber(form.otherDeductions).toFixed(2)}`} />
                                    <SummaryRow label="Net pay" value={breakdown ? `R ${breakdown.netPay.toFixed(2)}` : "R 0.00"} accent />
                                </div>

                                <div className="space-y-4 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Before download</p>
                                    <ul className="space-y-3 text-sm leading-7 text-[var(--text-muted)]">
                                        <li>Check the worker name, month, and rate one last time.</li>
                                        <li>The PDF is prepared on your device.</li>
                                        <li>Email is used only to verify the free monthly download limit.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:p-6" data-testid={`free-payslip-gate-${verificationState}`}>
                            <div className="space-y-2">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Download step</p>
                                <h4 className="font-serif text-2xl font-bold text-[var(--text)]">{gateCardTitle}</h4>
                                <p className="max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
                                    {verificationState === "success"
                                        ? "The free PDF is done. If you want next month to feel easier, the paid workspace keeps worker details, records, and documents ready for you."
                                        : "Verify the email on this device before the PDF download. We only keep the verified email and monthly quota, not the payroll figures or PDF contents."}
                                </p>
                            </div>

                            {verifiedEmail && verificationState !== "success" ? (
                                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--text)]">
                                    <BadgeCheck className="h-4 w-4 text-[var(--primary)]" />
                                    Verified as <span className="font-semibold">{verifiedEmail}</span>
                                </div>
                            ) : null}

                            {statusMessage ? (
                                <div className={`mt-5 rounded-[1.25rem] border px-4 py-3 text-sm leading-6 ${getNoticeStyles(statusTone)}`}>
                                    {statusMessage}
                                </div>
                            ) : null}

                            {gatePrimaryAction ? <div className="mt-5">{gatePrimaryAction}</div> : null}

                            {verificationState === "success" || verificationState === "quota-used" ? (
                                <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                                    <div className="flex items-start gap-3">
                                        <FileCheck2 className="mt-1 h-5 w-5 text-[var(--primary)]" />
                                        <div className="space-y-2">
                                            <p className="font-semibold text-[var(--text)]">Want this saved and ready next month?</p>
                                            <p className="text-sm leading-7 text-[var(--text-muted)]">
                                                Paid plans keep worker details, payslip history, and supporting documents in one place so next month starts from a saved record instead of a blank form.
                                            </p>
                                            <Link href="/pricing" className="inline-flex">
                                                <Button type="button" variant="outline">
                                                    See plans that save your records
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {verificationState !== "success" && verificationState !== "unverified" ? (
                                <button
                                    type="button"
                                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline"
                                    onClick={() => void handleUseDifferentEmail()}
                                >
                                    Use a different email
                                </button>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {currentStep < STEPS.length - 1 ? (
                    <ActionBar
                        currentStep={currentStep}
                        onBack={goBack}
                        onNext={goNext}
                        nextLabel="Continue"
                    />
                ) : null}

                {currentStep === STEPS.length - 1 && !reviewReady ? (
                    <div className="mt-6 rounded-[1.5rem] border border-[var(--warning)]/30 bg-[color:color-mix(in_srgb,var(--warning)_10%,var(--surface-raised))] px-4 py-3 text-sm leading-7 text-[var(--text)]">
                        <AlertTriangle className="mr-2 inline h-4 w-4 text-[var(--warning)]" />
                        Finish the earlier steps first so the review figures can be prepared.
                    </div>
                ) : null}
            </div>

            {verificationState === "success" ? (
                <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-1 h-6 w-6 text-[var(--success)]" />
                        <div>
                            <h3 className="font-serif text-2xl font-bold text-[var(--text)]">Free payslip done</h3>
                            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
                                You have used this month&apos;s free download on <span className="font-semibold text-[var(--text)]">{verifiedEmail || quota?.email}</span>.
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}
