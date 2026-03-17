"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { AlertTriangle, ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, ChevronDown, ChevronUp, Download, FileCheck2, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Stepper } from "@/components/ui/stepper";
import { createClient } from "@/lib/supabase/client";
import { getBrowserAppOrigin } from "@/lib/app-origin";
import { calculatePayslip, NMW_RATE } from "@/lib/calculator";
import { buildFreePayslipVerificationHref, parseFreePayslipVerificationState } from "@/lib/free-payslip-verification";
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

type WizardStep = { label: string; question: string; summary: string };
type FieldErrors = Partial<Record<keyof FreePayslipFormState, string>>;
type VerificationState = "unverified" | "waiting" | "verified" | "quota-used" | "success";
type NoticeTone = "info" | "warning" | "danger" | "success";

const STEPS: WizardStep[] = [
    { label: "Setup", question: "Who should appear on the payslip?", summary: "Add the employer and worker details first, then move straight into this month's payroll." },
    { label: "Hours", question: "Set the month and ordinary time", summary: "Choose the month, confirm the rate, and capture the ordinary working pattern." },
    { label: "Extra Pay", question: "Add overtime and premium hours", summary: "Keep overtime, Sunday work, and public-holiday work separate so the review stays easy to check." },
    { label: "Deductions", question: "Add any agreed deductions", summary: "Only include deductions that were already agreed and recorded outside the payslip." },
    { label: "Review", question: "Review and generate the PDF", summary: "Check the figures, verify your email at the end, and generate the payslip PDF." },
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
const parseNumber = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

function buildPayload(form: FreePayslipFormState): { employee: Employee; payslip: PayslipInput; settings: EmployerSettings } | null {
    if (!form.employerName.trim() || !form.employeeName.trim() || !form.monthKey) return null;
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
    const payslip = normalizePayslipDraftToInput({
        id: crypto.randomUUID(), householdId: "free-tool", employeeId: employee.id, monthKey: form.monthKey,
        standardWorkingDaysThisMonth: parseNumber(form.standardWorkingDaysThisMonth), ordinaryHoursPerDay: 8,
        ordinaryHoursOverride: form.ordinaryHoursOverride.trim() ? parseNumber(form.ordinaryHoursOverride) : null,
        overtimeHours: parseNumber(form.overtimeHours), sundayHours: parseNumber(form.sundayHours),
        publicHolidayHours: parseNumber(form.publicHolidayHours), shortShiftCount: parseNumber(form.shortShiftCount),
        shortShiftWorkedHours: parseNumber(form.shortShiftWorkedHours), hourlyRate: parseNumber(form.hourlyRate),
        ordinarilyWorksSundays: false, includeAccommodation: false, accommodationCost: undefined,
        otherDeductions: parseNumber(form.otherDeductions), createdAt: new Date(), annualLeaveTaken: 0, sickLeaveTaken: 0, familyLeaveTaken: 0,
    });
    const settings: EmployerSettings = {
        employerName: form.employerName.trim(), employerAddress: form.employerAddress.trim(), employerIdNumber: "", uifRefNumber: "", cfNumber: "", sdlNumber: "", phone: "", employerEmail: "", proStatus: "free", paidUntil: undefined, billingCycle: "monthly", activeHouseholdId: "free-tool", logoData: undefined, defaultLanguage: "en", density: "comfortable", piiObfuscationEnabled: true, installationId: "free-tool", usageHistory: [], customLeaveTypes: [],
    };
    return { employee, payslip, settings };
}

function loadSavedDraft() {
    if (typeof window === "undefined") return null;
    try {
        const rawDraft = window.sessionStorage.getItem(FREE_PAYSLIP_DRAFT_STORAGE_KEY);
        return rawDraft ? JSON.parse(rawDraft) as { form?: FreePayslipFormState; currentStep?: number; verificationEmail?: string } : null;
    } catch {
        return null;
    }
}

function getNoticeStyles(tone: NoticeTone) {
    if (tone === "danger") return "border-[var(--danger)]/25 bg-[color:color-mix(in_srgb,var(--danger)_8%,var(--surface-raised))] text-[var(--text)]";
    if (tone === "warning") return "border-[var(--warning)]/30 bg-[color:color-mix(in_srgb,var(--warning)_10%,var(--surface-raised))] text-[var(--text)]";
    if (tone === "success") return "border-[var(--success)]/25 bg-[color:color-mix(in_srgb,var(--success)_10%,var(--surface-raised))] text-[var(--text)]";
    return "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]";
}

function TextField({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
    return <label htmlFor={id} className="block space-y-2"><span className="block text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</span>{children}{hint ? <span className="block text-sm leading-6 text-[var(--text-muted)]">{hint}</span> : null}{error ? <span className="block text-sm font-medium text-[var(--danger)]">{error}</span> : null}</label>;
}

function SummaryRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
    return <div className="flex items-center justify-between gap-4 text-sm"><span className="text-[var(--text-muted)]">{label}</span><span className={accent ? "font-bold text-[var(--primary)]" : "font-semibold text-[var(--text)]"}>{value}</span></div>;
}

function WizardActionBar({ currentStep, onBack, onNext }: { currentStep: number; onBack: () => void; onNext: () => void }) {
    return <div className="sticky bottom-0 z-20 mt-8 border-t border-[var(--border)] bg-[var(--surface-raised)]/95 px-1 py-4 backdrop-blur"><div className="flex items-center gap-3"><Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={currentStep === 0}><ArrowLeft className="h-4 w-4" />Back</Button><Button type="button" size="lg" className="flex-[1.2]" onClick={onNext}>Continue<ArrowRight className="h-4 w-4" /></Button></div></div>;
}

export function FreePayslipGenerator() {
    const supabase = React.useMemo(() => createClient(), []);
    const searchParams = useSearchParams();
    const callbackState = React.useMemo(() => parseFreePayslipVerificationState(searchParams ? searchParams.get("freePayslipVerification") : null), [searchParams]);
    const [form, setForm] = React.useState<FreePayslipFormState>(() => ({ ...DEFAULT_FORM, monthKey: getMonthKey(new Date()), ...loadSavedDraft()?.form }));
    const [currentStep, setCurrentStep] = React.useState(() => typeof loadSavedDraft()?.currentStep === "number" ? loadSavedDraft()!.currentStep! : 0);
    const [errors, setErrors] = React.useState<FieldErrors>({});
    const [verificationEmail, setVerificationEmail] = React.useState(() => loadSavedDraft()?.verificationEmail ?? "");
    const [showIdentityField, setShowIdentityField] = React.useState(() => Boolean(loadSavedDraft()?.form?.employeeId));
    const [showShortShiftHelper, setShowShortShiftHelper] = React.useState(() => Boolean(loadSavedDraft()?.form?.shortShiftCount && loadSavedDraft()?.form?.shortShiftCount !== "0"));
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
    const breakdown = React.useMemo(() => payload ? calculatePayslip(payload.payslip) : null, [payload]);
    const totalPremiumHours = parseNumber(form.overtimeHours) + parseNumber(form.sundayHours) + parseNumber(form.publicHolidayHours);
    const hourlyRate = parseNumber(form.hourlyRate);

    const updateField = React.useCallback((key: keyof FreePayslipFormState, value: string) => {
        setForm((current) => ({ ...current, [key]: value }));
        setErrors((current) => {
            if (!current[key]) return current;
            const nextErrors = { ...current };
            delete nextErrors[key];
            return nextErrors;
        });
    }, []);

    const applyVerificationState = React.useCallback((state: VerificationState, message: string, tone: NoticeTone, nextQuota: QuotaStatus | null, nextVerifiedEmail: string) => {
        setVerificationState(state);
        setStatusMessage(message);
        setStatusTone(tone);
        setQuota(nextQuota);
        setVerifiedEmail(nextVerifiedEmail);
        if (nextVerifiedEmail) setVerificationEmail(nextVerifiedEmail);
    }, []);

    const refreshVerification = React.useCallback(async (source: "mount" | "callback" | "manual" | "focus") => {
        if (verificationState === "success" && source !== "manual") return;
        setCheckingVerification(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const shouldCheckQuota = Boolean(user?.email) || callbackState === "success" || source === "manual" || source === "focus" || (source === "mount" && Boolean(verificationEmail));
            if (!shouldCheckQuota) {
                if (callbackState === "invalid-link") applyVerificationState(verificationEmail ? "waiting" : "unverified", "That link is invalid or expired. Send a fresh link and open it on this phone.", "danger", null, "");
                else if (callbackState === "missing-session") applyVerificationState(verificationEmail ? "waiting" : "unverified", "We could not confirm this email on this device yet. Open a fresh link on the same phone, then check again.", "warning", null, "");
                else if (!verificationEmail) applyVerificationState("unverified", "", "info", null, "");
                return;
            }
            const response = await fetch("/api/free-payslip/quota", { method: "GET", cache: "no-store" });
            if (response.status === 401) {
                applyVerificationState(verificationEmail ? "waiting" : "unverified", callbackState === "success" || callbackState === "missing-session" ? "We are still waiting for the verified session on this device. Open the link on this phone, then check again." : "Open the link from your email on this device, then come back here to finish the download.", callbackState === "missing-session" ? "warning" : "info", null, "");
                return;
            }
            const data = await response.json() as QuotaStatus | { error?: string };
            if (!response.ok) throw new Error(typeof data === "object" && data && "error" in data && typeof data.error === "string" ? data.error : "The free monthly limit could not be checked.");
            const nextQuota = data as QuotaStatus;
            if (nextQuota.usedThisMonth) applyVerificationState("quota-used", "This verified email has already used its free PDF for this month.", "warning", nextQuota, nextQuota.email);
            else applyVerificationState("verified", source === "callback" || callbackState === "success" ? "Email verified on this device. You can generate the PDF now." : "This email is verified for this month.", "success", nextQuota, nextQuota.email);
        } catch (error) {
            applyVerificationState(verificationEmail ? "waiting" : "unverified", error instanceof Error ? error.message : "The verification status could not be checked.", "danger", null, "");
        } finally {
            setCheckingVerification(false);
        }
    }, [applyVerificationState, callbackState, supabase.auth, verificationEmail, verificationState]);

    const triggerVerificationRefresh = React.useCallback((source: "mount" | "callback" | "manual" | "focus") => {
        refreshVerification(source).catch(() => undefined);
    }, [refreshVerification]);

    React.useEffect(() => {
        triggerVerificationRefresh(callbackState ? "callback" : "mount");
    }, [callbackState, triggerVerificationRefresh]);
    React.useEffect(() => {
        if (typeof window !== "undefined") window.sessionStorage.setItem(FREE_PAYSLIP_DRAFT_STORAGE_KEY, JSON.stringify({ form, currentStep, verificationEmail }));
    }, [currentStep, form, verificationEmail]);
    React.useEffect(() => {
        const recheck = () => {
            if (verificationState === "waiting") {
                triggerVerificationRefresh("focus");
            }
        };
        document.addEventListener("visibilitychange", recheck);
        window.addEventListener("focus", recheck);
        return () => {
            document.removeEventListener("visibilitychange", recheck);
            window.removeEventListener("focus", recheck);
        };
    }, [triggerVerificationRefresh, verificationState]);
    React.useEffect(() => {
        if ((callbackState || verificationState !== "unverified") && currentStep < STEPS.length - 1) {
            setCurrentStep(STEPS.length - 1);
        }
    }, [callbackState, currentStep, verificationState]);

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
            if (!form.hourlyRate.trim()) nextErrors.hourlyRate = "Add the hourly rate.";
            else if (parseNumber(form.hourlyRate) < NMW_RATE) nextErrors.hourlyRate = `The hourly rate must be at least R${NMW_RATE.toFixed(2)}.`;
            const daysWorked = parseNumber(form.standardWorkingDaysThisMonth);
            if (daysWorked < 0) nextErrors.standardWorkingDaysThisMonth = "Working days cannot be negative.";
            if (daysWorked === 0 && totalPremiumHours <= 0 && parseNumber(form.shortShiftWorkedHours) <= 0) nextErrors.standardWorkingDaysThisMonth = "Add ordinary working days or paid hours first.";
            if (daysWorked > 0 && derivedDraft.ordinaryHours <= 0) nextErrors.ordinaryHoursOverride = "Ordinary hours must be greater than 0 when days worked are entered.";
        }
        if (stepIndex === 2) {
            if (parseNumber(form.overtimeHours) < 0) nextErrors.overtimeHours = "Hours cannot be negative.";
            if (parseNumber(form.sundayHours) < 0) nextErrors.sundayHours = "Hours cannot be negative.";
            if (parseNumber(form.publicHolidayHours) < 0) nextErrors.publicHolidayHours = "Hours cannot be negative.";
        }
        if (stepIndex === 3 && parseNumber(form.otherDeductions) < 0) nextErrors.otherDeductions = "Deductions cannot be negative.";
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }, [derivedDraft.ordinaryHours, form, totalPremiumHours]);

    const goNext = React.useCallback(() => { if (validateStep(currentStep)) setCurrentStep((step) => Math.min(step + 1, STEPS.length - 1)); }, [currentStep, validateStep]);
    const goBack = React.useCallback(() => setCurrentStep((step) => Math.max(step - 1, 0)), []);

    const sendVerificationLink = React.useCallback(async () => {
        const email = verificationEmail.trim().toLowerCase();
        if (!email) {
            setStatusTone("danger");
            setStatusMessage("Enter your email address first.");
            return;
        }
        setSendingVerification(true);
        setStatusMessage("");
        try {
            const next = buildFreePayslipVerificationHref("success");
            const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${getBrowserAppOrigin()}/api/auth/callback?next=${encodeURIComponent(next)}` } });
            if (error) throw error;
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
        await fetch("/api/free-payslip/session", { method: "DELETE", cache: "no-store" }).catch(() => undefined);
        if (typeof window !== "undefined") {
            const nextUrl = new URL(window.location.href);
            nextUrl.searchParams.delete("freePayslipVerification");
            nextUrl.searchParams.delete("verifiedEmail");
            window.history.replaceState({}, "", nextUrl.toString());
        }
        setVerificationEmail("");
        applyVerificationState("unverified", "", "info", null, "");
    }, [applyVerificationState, supabase.auth]);

    const handleSendVerificationClick = React.useCallback(async () => {
        await sendVerificationLink();
    }, [sendVerificationLink]);

    const handleManualVerificationRefresh = React.useCallback(async () => {
        await refreshVerification("manual");
    }, [refreshVerification]);

    const handleDownload = React.useCallback(async () => {
        if (!payload || !breakdown) {
            setStatusTone("danger");
            setStatusMessage("Complete the payslip details first so the PDF can be prepared.");
            return;
        }
        if (verificationState !== "verified") {
            setStatusTone("warning");
            setStatusMessage("Verify your email on this device before generating the PDF.");
            return;
        }
        setDownloading(true);
        try {
            const pdfBytes = await generatePayslipPdfBytes(payload.employee, payload.payslip, payload.settings, "en");
            const quotaResponse = await fetch("/api/free-payslip/quota", { method: "POST", cache: "no-store" });
            const quotaData = await quotaResponse.json() as QuotaStatus | { error?: string };
            const quotaErrorMessage = typeof quotaData === "object" && quotaData && "error" in quotaData && typeof quotaData.error === "string"
                ? quotaData.error
                : null;
            if (!quotaResponse.ok) {
                if (quotaResponse.status === 409) {
                    applyVerificationState(
                        "quota-used",
                        quotaErrorMessage ?? "This verified email has already used its free PDF for this month.",
                        "warning",
                        null,
                        verifiedEmail,
                    );
                    return;
                }
                if (quotaResponse.status === 401) {
                    applyVerificationState("waiting", "This verified session expired before download. Open the email link on this device again, then check once more.", "warning", null, "");
                    return;
                }
                throw new Error(quotaErrorMessage ?? "The free monthly limit could not be updated.");
            }
            downloadPdf(pdfBytes, getPayslipFilename(payload.employee, payload.payslip));
            const consumedQuota = quotaData as QuotaStatus;
            setQuota(consumedQuota);
            setVerificationState("success");
            setStatusTone("success");
            setStatusMessage("Payslip downloaded. If you want next month ready faster, the paid workspace keeps worker details, history, and documents together.");
        } catch (error) {
            setStatusTone("danger");
            setStatusMessage(error instanceof Error ? error.message : "The PDF could not be downloaded.");
        } finally {
            setDownloading(false);
        }
    }, [applyVerificationState, breakdown, payload, verificationState, verifiedEmail]);

    const handleDownloadClick = React.useCallback(async () => {
        await handleDownload();
    }, [handleDownload]);

    const handleUseDifferentEmailClick = React.useCallback(async () => {
        await handleUseDifferentEmail();
    }, [handleUseDifferentEmail]);

    let gateCardTitle = "Verify your email";
    if (verificationState === "success") {
        gateCardTitle = "PDF generated";
    } else if (verificationState === "quota-used") {
        gateCardTitle = "This month's free PDF is already used";
    } else if (verificationState === "verified") {
        gateCardTitle = "Ready to generate";
    } else if (verificationState === "waiting") {
        gateCardTitle = "Check your email";
    }
    const gateDescription = verificationState === "success"
        ? "Your free PDF is ready. If you want the same worker details and monthly history saved for next time, the paid workspace keeps everything together."
        : "Verify the email on this device before the PDF is generated. We only use the verified email and quota record here: one free PDF download per verified email, per calendar month.";
    const step = STEPS[currentStep];

    return (
        <section id="free-payslip-wizard" data-testid="free-payslip-wizard" className="scroll-mt-24">
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-md)] sm:p-6 lg:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-3xl space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]"><ShieldCheck className="h-3.5 w-3.5 text-[var(--primary)]" />Free payslip wizard</div>
                        <h1 className="font-serif text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">Create free payslip PDF</h1>
                        <p className="max-w-2xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">Move through the same calm payslip flow we use in the dashboard, then verify your email right at the download step.</p>
                    </div>
                    <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text)]">Step <span className="font-bold">{currentStep + 1}</span> of {STEPS.length}</div>
                </div>
                <div className="mt-5 grid gap-3 lg:grid-cols-3">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Fast</p><p className="mt-1 text-sm leading-6 text-[var(--text)]">Start typing immediately and finish the monthly payslip in one pass.</p></div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Trusted</p><p className="mt-1 text-sm leading-6 text-[var(--text)]">Built for South African domestic-worker payslip details and monthly review.</p></div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Private</p><p className="mt-1 text-sm leading-6 text-[var(--text)]">The payslip figures stay on this device until you generate the PDF.</p></div>
                </div>
                <div className="mt-6 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-[var(--shadow-sm)] sm:p-5"><Stepper steps={STEPS} currentStep={currentStep} onStepClick={(index) => { if (index <= currentStep) setCurrentStep(index); }} /></div>
                {currentStep === 1 && hourlyRate > 0 && hourlyRate < NMW_RATE ? <div className="mt-6 rounded-[1.5rem] border border-[var(--danger)]/30 bg-[color:color-mix(in_srgb,var(--danger)_8%,var(--surface-raised))] px-4 py-3 text-sm leading-7 text-[var(--text)]">The hourly rate must be at least <strong>R{NMW_RATE.toFixed(2)}</strong> for the current domestic-worker minimum wage.</div> : null}
                <div className="mt-6 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
                    <div className="space-y-2"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{step.label}</p><h2 className="font-serif text-2xl font-bold text-[var(--text)] sm:text-[2rem]">{step.question}</h2><p className="max-w-2xl text-sm leading-7 text-[var(--text-muted)]">{step.summary}</p></div>
                    {currentStep === 0 ? <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]"><div className="space-y-5"><div className="grid gap-5 md:grid-cols-2"><TextField id="free-employer-name" label="Employer name" error={errors.employerName}><Input id="free-employer-name" value={form.employerName} onChange={(event) => updateField("employerName", event.target.value)} placeholder="Household employer name" error={errors.employerName} /></TextField><TextField id="free-employee-name" label="Worker name" error={errors.employeeName}><Input id="free-employee-name" value={form.employeeName} onChange={(event) => updateField("employeeName", event.target.value)} placeholder="Worker full name" error={errors.employeeName} /></TextField></div><TextField id="free-employer-address" label="Employer address" error={errors.employerAddress}><textarea id="free-employer-address" value={form.employerAddress} onChange={(event) => updateField("employerAddress", event.target.value)} placeholder="Street address" className={`min-h-[120px] w-full rounded-[12px] border bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text)] outline-none transition-all focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 ${errors.employerAddress ? "border-[var(--danger)]" : "border-[var(--border)]"}`} /></TextField><TextField id="free-employee-role" label="Worker role" error={errors.employeeRole}><Input id="free-employee-role" value={form.employeeRole} onChange={(event) => updateField("employeeRole", event.target.value)} placeholder="Domestic worker" error={errors.employeeRole} /></TextField><div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4"><button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setShowIdentityField((current) => !current)}><div><p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Optional identity field</p><p className="mt-1 text-sm font-semibold text-[var(--text)]">Add ID or passport only if you want it printed on the payslip.</p></div>{showIdentityField ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}</button>{showIdentityField ? <div className="mt-4"><TextField id="free-employee-id" label="ID or passport" hint="Optional for a basic payslip."><Input id="free-employee-id" value={form.employeeId} onChange={(event) => updateField("employeeId", event.target.value)} placeholder="ID or passport number" /></TextField></div> : null}</div></div><div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">What goes on the PDF</p><div className="mt-4 space-y-3"><SummaryRow label="Employer" value={form.employerName || "Add employer details"} /><SummaryRow label="Worker" value={form.employeeName || "Add worker details"} /><SummaryRow label="Role" value={form.employeeRole || "Domestic worker"} /><SummaryRow label="ID / passport" value={form.employeeId || "Optional"} /></div></div></div> : null}
                    {currentStep === 1 ? <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]"><div className="space-y-5"><div className="grid gap-5 md:grid-cols-2"><TextField id="free-payslip-month" label="Payslip month" hint="We use the first and last day of that calendar month automatically." error={errors.monthKey}><Input id="free-payslip-month" type="month" value={form.monthKey} onChange={(event) => updateField("monthKey", event.target.value)} error={errors.monthKey} /></TextField><TextField id="free-hourly-rate" label="Hourly rate (R)" error={errors.hourlyRate}><Input id="free-hourly-rate" type="number" step="0.01" value={form.hourlyRate} onChange={(event) => updateField("hourlyRate", event.target.value)} error={errors.hourlyRate} /></TextField></div><div className="grid gap-4 sm:grid-cols-2"><TextField id="free-period-start" label="Period start"><Input id="free-period-start" type="date" value={format(derivedDraft.payPeriodStart, "yyyy-MM-dd")} readOnly /></TextField><TextField id="free-period-end" label="Period end"><Input id="free-period-end" type="date" value={format(derivedDraft.payPeriodEnd, "yyyy-MM-dd")} readOnly /></TextField></div><TextField id="free-working-days" label="Standard working days this month" hint="Example: if the worker usually works Monday to Friday and worked 20 normal days this month, enter 20." error={errors.standardWorkingDaysThisMonth}><div className="flex items-center gap-2"><Input id="free-working-days" type="number" min="0" value={form.standardWorkingDaysThisMonth} onChange={(event) => updateField("standardWorkingDaysThisMonth", event.target.value)} error={errors.standardWorkingDaysThisMonth} /><InfoTooltip label="Explain standard working days" tooltip="Enter the normal number of workdays for this payslip month. LekkerLedger uses this to calculate ordinary hours automatically." /></div></TextField><TextField id="free-ordinary-hours" label="Ordinary hours" hint={derivedDraft.hasManualOrdinaryHoursOverride ? `Manual override in use. Auto-calculated hours would be ${derivedDraft.autoOrdinaryHours}.` : `Auto-calculated as ${derivedDraft.autoOrdinaryHours} hours from ${parseNumber(form.standardWorkingDaysThisMonth)} standard days x 8 hours.`} error={errors.ordinaryHoursOverride}><div className="space-y-2"><div className="flex items-center gap-2"><Input id="free-ordinary-hours" type="number" step="0.01" value={form.ordinaryHoursOverride || (derivedDraft.autoOrdinaryHours ? String(derivedDraft.autoOrdinaryHours) : "")} onChange={(event) => updateField("ordinaryHoursOverride", event.target.value)} error={errors.ordinaryHoursOverride} /><InfoTooltip label="Explain ordinary hours" tooltip="These are the normal paid hours for the month before overtime, Sunday work, and public-holiday work." /></div>{derivedDraft.hasManualOrdinaryHoursOverride ? <button type="button" className="text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline" onClick={() => updateField("ordinaryHoursOverride", "")}>Use auto-calculated hours</button> : null}</div></TextField><div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] p-4"><button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setShowShortShiftHelper((current) => !current)}><div><p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Short shifts (4-hour rule)</p><p className="mt-1 text-sm font-semibold text-[var(--text)]">Had any shifts under 4 hours this month? Add them here.</p></div>{showShortShiftHelper ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}</button>{showShortShiftHelper ? <div className="mt-4 grid gap-4 sm:grid-cols-2"><TextField id="free-short-shift-count" label="How many short shifts?"><Input id="free-short-shift-count" type="number" min="0" value={form.shortShiftCount} onChange={(event) => updateField("shortShiftCount", event.target.value)} /></TextField><TextField id="free-short-shift-hours" label="Hours actually worked across them"><Input id="free-short-shift-hours" type="number" step="0.01" value={form.shortShiftWorkedHours} onChange={(event) => updateField("shortShiftWorkedHours", event.target.value)} /></TextField></div> : null}</div></div><div className="space-y-4 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Monthly setup</p><p className="text-sm leading-7 text-[var(--text-muted)]">Choose the month once. The wizard uses it to prepare the pay-period dates automatically, so you can focus on the actual work done.</p><div className="space-y-3"><SummaryRow label="Ordinary hours" value={`${derivedDraft.ordinaryHours.toFixed(2)}h`} /><SummaryRow label="4-hour top-up" value={`${derivedDraft.shortFallHours.toFixed(2)}h`} /><SummaryRow label="Extra pay hours" value={`${totalPremiumHours.toFixed(2)}h`} /></div></div></div> : null}
                    {currentStep === 2 ? <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)]"><div className="grid gap-5 md:grid-cols-3"><TextField id="free-overtime-hours" label="Overtime hours" error={errors.overtimeHours}><Input id="free-overtime-hours" type="number" step="0.01" value={form.overtimeHours} onChange={(event) => updateField("overtimeHours", event.target.value)} error={errors.overtimeHours} /></TextField><TextField id="free-sunday-hours" label="Sunday hours" error={errors.sundayHours}><Input id="free-sunday-hours" type="number" step="0.01" value={form.sundayHours} onChange={(event) => updateField("sundayHours", event.target.value)} error={errors.sundayHours} /></TextField><TextField id="free-public-holiday-hours" label="Public holiday hours" hint="Use this only for hours actually worked on the public holiday." error={errors.publicHolidayHours}><div className="flex items-center gap-2"><Input id="free-public-holiday-hours" type="number" step="0.01" value={form.publicHolidayHours} onChange={(event) => updateField("publicHolidayHours", event.target.value)} error={errors.publicHolidayHours} /><InfoTooltip label="Explain public holiday hours" tooltip="Only enter hours actually worked on a public holiday. Do not use this field for a paid day off." /></div></TextField></div><div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Extra pay summary</p><div className="mt-4 space-y-3"><SummaryRow label="Overtime" value={`${parseNumber(form.overtimeHours).toFixed(2)}h`} /><SummaryRow label="Sunday" value={`${parseNumber(form.sundayHours).toFixed(2)}h`} /><SummaryRow label="Public holiday" value={`${parseNumber(form.publicHolidayHours).toFixed(2)}h`} /><SummaryRow label="Total premium hours" value={`${totalPremiumHours.toFixed(2)}h`} accent /></div></div></div> : null}
                    {currentStep === 3 ? <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)]"><TextField id="free-other-deductions" label="Other agreed deductions (R)" hint="Only include deductions that were already agreed and recorded separately." error={errors.otherDeductions}><Input id="free-other-deductions" type="number" step="0.01" value={form.otherDeductions} onChange={(event) => updateField("otherDeductions", event.target.value)} error={errors.otherDeductions} /></TextField><div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Keep this exact</p><ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--text-muted)]"><li>UIF is still calculated automatically when the month qualifies.</li><li>Only add deductions that are lawful and already agreed.</li><li>The next step shows gross pay, deductions, and net pay before the PDF is generated.</li></ul></div></div> : null}
                    {currentStep === 4 ? <div className="mt-8 space-y-6"><div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-2)] p-5 sm:p-6"><div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Payslip review</p><h3 className="mt-2 font-serif text-2xl font-bold text-[var(--text)]">{form.employeeName || "Worker name"}</h3><p className="mt-1 text-sm text-[var(--text-muted)]">{form.employeeRole || "Domestic worker"} · {form.monthKey ? format(getMonthBounds(form.monthKey).start, "MMMM yyyy") : "Choose a month"}</p></div><div className="rounded-[1rem] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Net pay</p><p className="mt-1 font-serif text-3xl font-bold text-[var(--text)]">{breakdown ? `R ${breakdown.netPay.toFixed(2)}` : "R 0.00"}</p></div></div><div className="mt-5 grid gap-5 lg:grid-cols-2"><div className="space-y-4 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-raised)] p-4"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Document details</p><SummaryRow label="Employer" value={form.employerName || "-"} /><SummaryRow label="Worker" value={form.employeeName || "-"} /><SummaryRow label="ID / passport" value={form.employeeId || "Not added"} /><SummaryRow label="Pay period" value={form.monthKey ? `${format(derivedDraft.payPeriodStart, "dd MMM yyyy")} to ${format(derivedDraft.payPeriodEnd, "dd MMM yyyy")}` : "-"} /></div><div className="space-y-4 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-raised)] p-4"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Pay totals</p><SummaryRow label="Gross pay" value={breakdown ? `R ${breakdown.grossPay.toFixed(2)}` : "R 0.00"} /><SummaryRow label="Employee UIF" value={breakdown ? `R ${breakdown.deductions.uifEmployee.toFixed(2)}` : "R 0.00"} /><SummaryRow label="Other deductions" value={`R ${parseNumber(form.otherDeductions).toFixed(2)}`} /><SummaryRow label="Net pay" value={breakdown ? `R ${breakdown.netPay.toFixed(2)}` : "R 0.00"} accent /></div></div></div><div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:p-6" data-testid={`free-payslip-gate-${verificationState}`}><div className="space-y-2"><p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Download step</p><h4 className="font-serif text-2xl font-bold text-[var(--text)]">{gateCardTitle}</h4><p className="max-w-2xl text-sm leading-7 text-[var(--text-muted)]">{gateDescription}</p></div>{verifiedEmail && verificationState !== "success" ? <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--text)]"><BadgeCheck className="h-4 w-4 text-[var(--primary)]" />Verified as <span className="font-semibold">{verifiedEmail}</span></div> : null}{statusMessage ? <div className={`mt-5 rounded-[1.25rem] border px-4 py-3 text-sm leading-6 ${getNoticeStyles(statusTone)}`}>{statusMessage}</div> : null}{verificationState === "unverified" ? <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]"><Input type="email" value={verificationEmail} onChange={(event) => setVerificationEmail(event.target.value)} placeholder="you@example.com" /><Button type="button" size="lg" onClick={handleSendVerificationClick} loading={sendingVerification}><Mail className="h-4 w-4" />Send verification link</Button></div> : verificationState === "waiting" ? <div className="mt-5 flex flex-col gap-3 sm:flex-row"><Button type="button" size="lg" onClick={handleManualVerificationRefresh} loading={checkingVerification}><RefreshCw className="h-4 w-4" />I opened the link on this device</Button><Button type="button" variant="outline" onClick={handleSendVerificationClick} loading={sendingVerification}>Send a new link</Button></div> : verificationState === "verified" ? <div className="mt-5"><Button type="button" size="lg" onClick={handleDownloadClick} loading={downloading}><Download className="h-4 w-4" />Generate payslip PDF</Button></div> : null}{(verificationState === "success" || verificationState === "quota-used") && quota ? <div className="mt-5 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm leading-6 text-[var(--text)]">Free downloads used this month: <strong>{quota.downloadsUsed}</strong>. Remaining this month: <strong>{quota.remainingDownloads}</strong>.</div> : null}{verificationState === "success" || verificationState === "quota-used" ? <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5"><div className="flex items-start gap-3"><FileCheck2 className="mt-1 h-5 w-5 text-[var(--primary)]" /><div className="space-y-2"><p className="font-semibold text-[var(--text)]">Want this saved and ready next month?</p><p className="text-sm leading-7 text-[var(--text-muted)]">Paid plans keep worker details, payslip history, and supporting documents in one place so next month starts from a saved record instead of a blank form.</p><Link href="/pricing" className="inline-flex"><Button type="button" variant="outline">See plans that save your records<ArrowRight className="h-4 w-4" /></Button></Link></div></div></div> : null}{verificationState !== "success" && verificationState !== "unverified" ? <button type="button" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline" onClick={handleUseDifferentEmailClick}>Use a different email</button> : null}{verificationState === "success" ? <div className="mt-6 rounded-[1.5rem] border border-[var(--success)]/25 bg-[color:color-mix(in_srgb,var(--success)_10%,var(--surface-raised))] p-5"><div className="flex items-start gap-3"><CheckCircle2 className="mt-1 h-6 w-6 text-[var(--success)]" /><div><h5 className="font-serif text-xl font-bold text-[var(--text)]">Free payslip done</h5><p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">You have used this month&apos;s free download on <span className="font-semibold text-[var(--text)]">{verifiedEmail || quota?.email}</span>.</p></div></div></div> : null}</div></div> : null}
                    {currentStep === STEPS.length - 1 && (!payload || !breakdown) ? <div className="mt-6 rounded-[1.5rem] border border-[var(--warning)]/30 bg-[color:color-mix(in_srgb,var(--warning)_10%,var(--surface-raised))] px-4 py-3 text-sm leading-7 text-[var(--text)]"><AlertTriangle className="mr-2 inline h-4 w-4 text-[var(--warning)]" />Finish the earlier steps first so the review figures can be prepared.</div> : null}
                    {currentStep < STEPS.length - 1 ? <WizardActionBar currentStep={currentStep} onBack={goBack} onNext={goNext} /> : null}
                </div>
            </div>
        </section>
    );
}

