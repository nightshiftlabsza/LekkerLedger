"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, MapPin, Building2, ChevronRight, CheckCircle2, ChevronLeft, Loader2, ShieldCheck, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSettings, saveSettings } from "@/lib/storage";
import { EmployerSettings } from "@/lib/schema";
import { getUserPlan } from "@/lib/entitlements";

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = React.useState(1);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [form, setForm] = React.useState<EmployerSettings>({
        employerName: "",
        employerAddress: "",
        employerIdNumber: "",
        uifRefNumber: "",
        cfNumber: "",
        sdlNumber: "",
        phone: "",
        logoData: "",
        proStatus: "free",
        billingCycle: "monthly",
        activeHouseholdId: "default",
        defaultLanguage: "en",
        simpleMode: false,
        advancedMode: false,
        density: "comfortable",
        googleSyncEnabled: false,
        piiObfuscationEnabled: true,
        installationId: "",
        usageHistory: []
    });

    React.useEffect(() => {
        async function load() {
            const s = await getSettings();
            setForm(s);
            setLoading(false);
        }
        load();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await saveSettings(form);
        setSaving(false);
        const selectedPlan = getUserPlan(form);
        if (selectedPlan.id !== "free" && !form.googleSyncEnabled) {
            router.push("/open-app?source=onboarding&recommended=google&next=/dashboard");
            return;
        }
        router.push("/dashboard");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--primary)" }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Step indicators */}
                    <div className="flex justify-center gap-2 mb-8">
                        {[1, 2].map((i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? "w-8" : "w-2 opacity-30"
                                    }`}
                                style={{ backgroundColor: "var(--primary)" }}
                            />
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-6 animate-slide-up">
                            <div className="text-center space-y-2">
                                <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>
                                    Welcome to LekkerLedger
                                </h1>
                                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                                    Start locally now. If you move onto a paid plan, Google connection is the recommended setup for restoring records across browsers and devices.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <Card>
                                    <CardContent className="p-5 space-y-4">
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                <BookOpen className="h-5 w-5" style={{ color: "var(--primary)" }} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>The Law Made Simple</h3>
                                                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                                    LekkerLedger includes common payroll checks for domestic work, so you do not have to calculate minimum wage or UIF manually.
                                                </p>
                                                <Link href="/rules" className="text-xs font-semibold mt-2 inline-block" style={{ color: "var(--primary)" }}>
                                                    Read the 4 Golden Rules &rarr;
                                                </Link>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-5 space-y-4">
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                <ShieldCheck className="h-5 w-5" style={{ color: "var(--primary)" }} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>Private & Open Source</h3>
                                                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                                    Your payroll data stays on your device by default. If you enable Google backup later, the backup lives in your own Google Drive app data area. LekkerLedger does not maintain a central employee database and your payroll records stay private from us.
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-2">
                                                    <Github className="h-3 w-3" style={{ color: "var(--text-muted)" }} />
                                                    <a href="https://github.com/nightshiftlabsza/LekkerLedger" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold hover:underline" style={{ color: "var(--text-muted)" }}>
                                                        Code is freely available on GitHub
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 bg-zinc-950 text-white rounded-xl border-none">
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                <ShieldCheck className="h-5 w-5 text-[var(--focus)]" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm">Clear Records, Less Admin</h3>
                                                <p className="text-[11px] mt-1 text-zinc-400 leading-relaxed">
                                                    Consistent payslips protect both employer and employee. Paid plans also work best with Google-connected backup so your records can travel with you when needed.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Button className="w-full gap-2 h-12 text-base font-bold" onClick={() => setStep(2)}>
                                Next: Employer Details <ChevronRight className="h-5 w-5" />
                            </Button>

                            <div className="text-center pt-2 space-y-2">
                                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                    Join South African households organising their payroll records.
                                </p>
                                <div className="pt-2">
                                    <Link href="/open-app" className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)] hover:underline">
                                        Returning user? Open the app
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleSave} className="space-y-6 animate-slide-up">
                            <div className="text-center space-y-2">
                                <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>
                                    Employer Details
                                </h1>
                                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                                    By law, your name and address must appear on your employee&apos;s payslip.
                                </p>
                            </div>

                            <Card>
                                <CardContent className="p-5 space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="employer-name">Your Full Name</Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-3 h-4 w-4" style={{ color: "var(--text-muted)" }} />
                                            <Input
                                                id="employer-name"
                                                placeholder="e.g. Sipho & Nolwazi Nkosi"
                                                className="pl-9"
                                                value={form.employerName}
                                                onChange={(e) => setForm({ ...form, employerName: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="employer-address">Your Address</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-4 w-4" style={{ color: "var(--text-muted)" }} />
                                            <Input
                                                id="employer-address"
                                                placeholder="e.g. 12 Protea St, Sandton"
                                                className="pl-9"
                                                value={form.employerAddress}
                                                onChange={(e) => setForm({ ...form, employerAddress: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="uif-ref">UIF Reference (Optional)</Label>
                                        <Input
                                            id="uif-ref"
                                            placeholder="e.g. U123456789"
                                            value={form.uifRefNumber}
                                            onChange={(e) => setForm({ ...form, uifRefNumber: e.target.value })}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex gap-3">
                                <Button type="button" variant="outline" size="lg" className="px-3" onClick={() => setStep(1)}>
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                                <Button type="submit" className="flex-1 gap-2 h-12 text-base font-bold" disabled={saving}>
                                    {saving ? (
                                        <><Loader2 className="h-5 w-5 animate-spin" /> Saving…</>
                                    ) : (
                                        <><CheckCircle2 className="h-5 w-5" /> Save & Start</>
                                    )}
                                </Button>
                            </div>

                            <p className="text-center text-[10px] px-8 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                Designed with POPIA principles in mind. Saved locally by default; backed up in your own Google account only if you enable it.
                            </p>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}




