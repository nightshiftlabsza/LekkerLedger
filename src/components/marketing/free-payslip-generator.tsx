"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Download, FileLock2, Mail, MoonStar, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { getBrowserAppOrigin } from "@/lib/app-origin";
import { calculatePayslip } from "@/lib/calculator";
import { generatePayslipPdfBytes, getPayslipFilename } from "@/lib/pdf";
import { downloadPdf } from "@/lib/share";
import type { Employee, EmployerSettings, PayslipInput } from "@/lib/schema";

type FreePayslipFormState = {
    employerName: string;
    employerAddress: string;
    employeeName: string;
    employeeId: string;
    employeeRole: string;
    hourlyRate: string;
    payPeriodStart: string;
    payPeriodEnd: string;
    daysWorked: string;
    ordinaryHours: string;
    overtimeHours: string;
    sundayHours: string;
    publicHolidayHours: string;
    otherDeductions: string;
};

type QuotaStatus = {
    email: string;
    monthKey: string;
    downloadsUsed: number;
    remainingDownloads: number;
    usedThisMonth: boolean;
};

const DEFAULT_FORM: FreePayslipFormState = {
    employerName: "",
    employerAddress: "",
    employeeName: "",
    employeeId: "",
    employeeRole: "Domestic Worker",
    hourlyRate: "30.23",
    payPeriodStart: "",
    payPeriodEnd: "",
    daysWorked: "22",
    ordinaryHours: "176",
    overtimeHours: "0",
    sundayHours: "0",
    publicHolidayHours: "0",
    otherDeductions: "0",
};

function parseNumber(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function buildPayload(form: FreePayslipFormState): { employee: Employee; payslip: PayslipInput; settings: EmployerSettings } | null {
    if (!form.employerName.trim() || !form.employeeName.trim() || !form.payPeriodStart || !form.payPeriodEnd) {
        return null;
    }

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
        startDate: form.payPeriodStart,
        ordinarilyWorksSundays: false,
        ordinaryHoursPerDay: 8,
        frequency: "Monthly",
    };

    const payslip: PayslipInput = {
        id: crypto.randomUUID(),
        householdId: "free-tool",
        employeeId: employee.id,
        payPeriodStart: new Date(form.payPeriodStart),
        payPeriodEnd: new Date(form.payPeriodEnd),
        ordinaryHours: parseNumber(form.ordinaryHours),
        overtimeHours: parseNumber(form.overtimeHours),
        sundayHours: parseNumber(form.sundayHours),
        publicHolidayHours: parseNumber(form.publicHolidayHours),
        daysWorked: parseNumber(form.daysWorked),
        shortFallHours: 0,
        hourlyRate: parseNumber(form.hourlyRate),
        includeAccommodation: false,
        accommodationCost: undefined,
        advanceAmount: 0,
        otherDeductions: parseNumber(form.otherDeductions),
        createdAt: new Date(),
        ordinarilyWorksSundays: false,
        ordinaryHoursPerDay: 8,
        annualLeaveTaken: 0,
        sickLeaveTaken: 0,
        familyLeaveTaken: 0,
    };

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
        simpleMode: false,
        advancedMode: false,
        density: "comfortable",
        piiObfuscationEnabled: true,
        installationId: "free-tool",
        usageHistory: [],
        customLeaveTypes: [],
    };

    return { employee, payslip, settings };
}

function Field({
    label,
    children,
    hint,
}: {
    label: string;
    children: React.ReactNode;
    hint?: string;
}) {
    return (
        <label className="space-y-2">
            <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</span>
            {children}
            {hint ? <span className="block text-xs leading-5 text-[var(--text-muted)]">{hint}</span> : null}
        </label>
    );
}

export function FreePayslipGenerator() {
    const supabase = React.useMemo(() => createClient(), []);
    const [form, setForm] = React.useState<FreePayslipFormState>(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
        return {
            ...DEFAULT_FORM,
            payPeriodStart: start,
            payPeriodEnd: end,
        };
    });
    const [verificationEmail, setVerificationEmail] = React.useState("");
    const [verifiedEmail, setVerifiedEmail] = React.useState("");
    const [quota, setQuota] = React.useState<QuotaStatus | null>(null);
    const [quotaError, setQuotaError] = React.useState("");
    const [verificationMessage, setVerificationMessage] = React.useState("");
    const [sendingVerification, setSendingVerification] = React.useState(false);
    const [downloading, setDownloading] = React.useState(false);
    const [checkingQuota, setCheckingQuota] = React.useState(false);

    const payload = React.useMemo(() => buildPayload(form), [form]);
    const breakdown = React.useMemo(() => (payload ? calculatePayslip(payload.payslip) : null), [payload]);

    const updateField = React.useCallback((key: keyof FreePayslipFormState, value: string) => {
        setForm((current) => ({ ...current, [key]: value }));
    }, []);

    const refreshQuota = React.useCallback(async () => {
        setCheckingQuota(true);
        setQuotaError("");
        try {
            const response = await fetch("/api/free-payslip/quota", {
                method: "GET",
                cache: "no-store",
            });

            if (response.status === 401) {
                setQuota(null);
                setVerifiedEmail("");
                return;
            }

            const data = await response.json();
            if (!response.ok) {
                throw new Error(typeof data?.error === "string" ? data.error : "The free monthly limit could not be checked.");
            }

            setQuota(data as QuotaStatus);
            setVerifiedEmail((data as QuotaStatus).email);
        } catch (error) {
            setQuotaError(error instanceof Error ? error.message : "The free monthly limit could not be checked.");
        } finally {
            setCheckingQuota(false);
        }
    }, []);

    React.useEffect(() => {
        let cancelled = false;

        async function loadVerifiedState() {
            const { data: { user } } = await supabase.auth.getUser();
            if (cancelled) return;

            if (user?.email) {
                setVerifiedEmail(user.email);
                setVerificationEmail(user.email);
                void refreshQuota();
            }
        }

        void loadVerifiedState();
        return () => {
            cancelled = true;
        };
    }, [refreshQuota, supabase.auth]);

    const sendVerificationLink = React.useCallback(async () => {
        const email = verificationEmail.trim().toLowerCase();
        if (!email) {
            setVerificationMessage("Enter your email address first.");
            return;
        }

        setSendingVerification(true);
        setVerificationMessage("");

        try {
            const next = "/resources/tools/domestic-worker-payslip?verified=1";
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${getBrowserAppOrigin()}/api/auth/callback?next=${encodeURIComponent(next)}`,
                },
            });

            if (error) {
                throw error;
            }

            setVerificationMessage("Verification link sent. Open it on this device, then come back here to download the PDF.");
        } catch (error) {
            setVerificationMessage(error instanceof Error ? error.message : "The verification email could not be sent.");
        } finally {
            setSendingVerification(false);
        }
    }, [supabase.auth, verificationEmail]);

    const handleUseDifferentEmail = React.useCallback(async () => {
        await supabase.auth.signOut();
        setVerifiedEmail("");
        setQuota(null);
        setVerificationEmail("");
        setVerificationMessage("");
        setQuotaError("");
    }, [supabase.auth]);

    const handleDownload = React.useCallback(async () => {
        if (!payload || !breakdown) {
            setQuotaError("Complete the form first so the payslip preview can be prepared.");
            return;
        }

        if (!verifiedEmail) {
            setQuotaError("Verify your email first. We only use it to enforce the one-payslip-per-month limit.");
            return;
        }

        if (quota?.usedThisMonth) {
            setQuotaError("This verified email has already downloaded its free payslip for this month.");
            return;
        }

        setDownloading(true);
        setQuotaError("");

        try {
            const pdfBytes = await generatePayslipPdfBytes(payload.employee, payload.payslip, payload.settings, "en", true);
            const quotaResponse = await fetch("/api/free-payslip/quota", {
                method: "POST",
                cache: "no-store",
            });
            const quotaData = await quotaResponse.json();
            if (!quotaResponse.ok) {
                throw new Error(typeof quotaData?.error === "string" ? quotaData.error : "The free monthly limit could not be updated.");
            }

            setQuota(quotaData as QuotaStatus);
            downloadPdf(pdfBytes, getPayslipFilename(payload.employee, payload.payslip));
        } catch (error) {
            setQuotaError(error instanceof Error ? error.message : "The PDF could not be downloaded.");
        } finally {
            setDownloading(false);
        }
    }, [breakdown, payload, quota?.usedThisMonth, verifiedEmail]);

    return (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(22rem,0.8fr)]">
            <section className="space-y-6">
                <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)] sm:p-8">
                    <div className="max-w-3xl space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                            <ShieldCheck className="h-3.5 w-3.5 text-[var(--primary)]" />
                            Public free tool
                        </div>
                        <h1 className="font-serif text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl">
                            Domestic worker payslip generator
                        </h1>
                        <p className="max-w-2xl text-base leading-8 text-[var(--text-muted)]">
                            Use this page to prepare one monthly payslip PDF on this verified email. It helps produce a payslip with the common payment details employers usually need, while keeping the payroll figures on your device.
                        </p>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-md)] sm:p-8">
                    <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Employer name">
                            <Input value={form.employerName} onChange={(event) => updateField("employerName", event.target.value)} placeholder="Household employer name" />
                        </Field>
                        <Field label="Employee name">
                            <Input value={form.employeeName} onChange={(event) => updateField("employeeName", event.target.value)} placeholder="Employee full name" />
                        </Field>
                        <Field label="Employer address">
                            <textarea
                                value={form.employerAddress}
                                onChange={(event) => updateField("employerAddress", event.target.value)}
                                placeholder="Street address"
                                className="min-h-[96px] w-full rounded-[12px] border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text)] outline-none transition-all focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                            />
                        </Field>
                        <div className="grid gap-5">
                            <Field label="Employee role">
                                <Input value={form.employeeRole} onChange={(event) => updateField("employeeRole", event.target.value)} placeholder="Domestic worker" />
                            </Field>
                            <Field label="ID / passport" hint="Optional, but useful when you share the payslip.">
                                <Input value={form.employeeId} onChange={(event) => updateField("employeeId", event.target.value)} placeholder="ID or passport number" />
                            </Field>
                        </div>
                        <Field label="Pay period start">
                            <Input type="date" value={form.payPeriodStart} onChange={(event) => updateField("payPeriodStart", event.target.value)} />
                        </Field>
                        <Field label="Pay period end">
                            <Input type="date" value={form.payPeriodEnd} onChange={(event) => updateField("payPeriodEnd", event.target.value)} />
                        </Field>
                        <Field label="Hourly rate (R)">
                            <Input type="number" step="0.01" value={form.hourlyRate} onChange={(event) => updateField("hourlyRate", event.target.value)} />
                        </Field>
                        <Field label="Days worked">
                            <Input type="number" value={form.daysWorked} onChange={(event) => updateField("daysWorked", event.target.value)} />
                        </Field>
                        <Field label="Ordinary hours">
                            <Input type="number" step="0.01" value={form.ordinaryHours} onChange={(event) => updateField("ordinaryHours", event.target.value)} />
                        </Field>
                        <Field label="Overtime hours">
                            <Input type="number" step="0.01" value={form.overtimeHours} onChange={(event) => updateField("overtimeHours", event.target.value)} />
                        </Field>
                        <Field label="Sunday hours">
                            <Input type="number" step="0.01" value={form.sundayHours} onChange={(event) => updateField("sundayHours", event.target.value)} />
                        </Field>
                        <Field label="Public holiday hours">
                            <Input type="number" step="0.01" value={form.publicHolidayHours} onChange={(event) => updateField("publicHolidayHours", event.target.value)} />
                        </Field>
                        <Field label="Other agreed deductions (R)" hint="Only include deductions you have already agreed and recorded separately.">
                            <Input type="number" step="0.01" value={form.otherDeductions} onChange={(event) => updateField("otherDeductions", event.target.value)} />
                        </Field>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-md)] sm:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="space-y-2">
                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Email gate before PDF</p>
                            <h2 className="font-serif text-2xl font-bold text-[var(--text)]">Verify once, then download</h2>
                            <p className="max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
                                We keep your email address and the monthly quota only. We do not keep the payroll figures, payslip content, or PDF data on our server.
                            </p>
                        </div>
                        {verifiedEmail ? (
                            <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text)]">
                                Verified as <span className="font-bold">{verifiedEmail}</span>
                            </div>
                        ) : null}
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
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

                    {verificationMessage ? (
                        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{verificationMessage}</p>
                    ) : null}

                    <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text)]">
                            {checkingQuota
                                ? "Checking this month's limit..."
                                : quota?.usedThisMonth
                                    ? "This verified email has already used its free PDF for this month."
                                    : "One free PDF download per verified email, per calendar month."}
                        </div>
                        {verifiedEmail ? (
                            <Button type="button" variant="outline" onClick={() => void handleUseDifferentEmail()}>
                                <RefreshCw className="h-4 w-4" />
                                Use a different email
                            </Button>
                        ) : null}
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Button type="button" size="lg" onClick={() => void handleDownload()} loading={downloading} disabled={quota?.usedThisMonth}>
                            <Download className="h-4 w-4" />
                            Download payslip PDF
                        </Button>
                        <Link href="/pricing">
                            <Button type="button" size="lg" variant="outline">
                                See paid plans
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    {quotaError ? (
                        <p className="mt-4 text-sm font-medium text-[var(--danger)]">{quotaError}</p>
                    ) : null}
                </div>
            </section>

            <aside className="space-y-6 xl:sticky xl:top-24">
                <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-md)] sm:p-8">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Live preview</p>
                    <div className="mt-4 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-1)] p-5">
                        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
                            <div>
                                <p className="font-serif text-2xl font-bold text-[var(--text)]">{form.employeeName || "Employee name"}</p>
                                <p className="mt-1 text-sm text-[var(--text-muted)]">{form.employeeRole || "Role"}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Actual amount paid</p>
                                <p className="mt-1 font-serif text-3xl font-bold text-[var(--text)]">
                                    {breakdown ? `R ${breakdown.netPay.toFixed(2)}` : "R 0.00"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm text-[var(--text)]">
                            <div className="flex items-center justify-between"><span>Gross pay</span><strong>{breakdown ? `R ${breakdown.grossPay.toFixed(2)}` : "R 0.00"}</strong></div>
                            <div className="flex items-center justify-between"><span>Employee UIF</span><strong>{breakdown ? `R ${breakdown.deductions.uifEmployee.toFixed(2)}` : "R 0.00"}</strong></div>
                            <div className="flex items-center justify-between"><span>Other deductions</span><strong>R {parseNumber(form.otherDeductions).toFixed(2)}</strong></div>
                            <div className="flex items-center justify-between"><span>Ordinary hours</span><strong>{parseNumber(form.ordinaryHours).toFixed(2)}h</strong></div>
                            <div className="flex items-center justify-between"><span>Overtime hours</span><strong>{parseNumber(form.overtimeHours).toFixed(2)}h</strong></div>
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-md)] sm:p-8">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Why paid plans exist</p>
                    <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--text-muted)]">
                        <p>
                            The free tool is intentionally narrow: one PDF per month, no dashboard, no saved worker records, and no cloud backup.
                        </p>
                        <p>
                            Paid plans are for households that want an organised workspace: employee records, encrypted sync, documents, contracts, and plan-based feature access across devices.
                        </p>
                    </div>
                    <div className="mt-5 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                        <div className="flex items-start gap-3">
                            <BadgeCheck className="mt-1 h-5 w-5 text-[var(--primary)]" />
                            <div className="space-y-2 text-sm leading-6 text-[var(--text-muted)]">
                                <p className="font-semibold text-[var(--text)]">Standard</p>
                                <p>Up to 3 employees, encrypted sync, leave tracking, contracts, documents hub, uFiling export, and ROE downloads.</p>
                                <p className="font-semibold text-[var(--text)]">Pro</p>
                                <p>Unlimited employees, multiple households, vault uploads, year-end summaries, and full-history export.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-raised),var(--surface-1))] p-6 shadow-[var(--shadow-md)] sm:p-8">
                    <div className="flex items-center gap-3">
                        <FileLock2 className="h-5 w-5 text-[var(--primary)]" />
                        <MoonStar className="h-5 w-5 text-[var(--focus)]" />
                    </div>
                    <p className="mt-4 font-serif text-2xl font-bold text-[var(--text)]">Designed to stay calm in light and dark mode</p>
                    <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                        This page keeps the free flow separate from the dashboard and keeps the payroll details in your browser until you choose to download the PDF.
                    </p>
                </div>
            </aside>
        </div>
    );
}
