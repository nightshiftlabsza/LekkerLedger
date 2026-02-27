"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, MapPin, Building2, ChevronRight, CheckCircle2, ChevronLeft, Loader2, ShieldCheck, Github, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSettings, saveSettings } from "@/lib/storage";
import { EmployerSettings } from "@/lib/schema";

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
        sdlNumber: "",
        logoData: "",
        proStatus: "free",
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
        router.push("/dashboard");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-base)" }}>
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--amber-500)" }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Step indicators */}
                    <div className="flex justify-center gap-2 mb-8">
                        {[1, 2].map((i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? "w-8" : "w-2 opacity-30"
                                    }`}
                                style={{ backgroundColor: "var(--amber-500)" }}
                            />
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-6 animate-slide-up">
                            <div className="text-center space-y-2">
                                <h1 className="text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                                    Welcome to LekkerLedger
                                </h1>
                                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                    Before we generate your first legal payslip, let's get you set up.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <Card>
                                    <CardContent className="p-5 space-y-4">
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                <BookOpen className="h-5 w-5" style={{ color: "var(--amber-500)" }} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>The Law Made Simple</h3>
                                                <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                                                    LekkerLedger bakes in all the rules of the Basic Conditions of Employment Act. You don't have to calculate Min Wage, UIF or Leave days manually.
                                                </p>
                                                <Link href="/rules" className="text-xs font-semibold mt-2 inline-block" style={{ color: "var(--amber-500)" }}>
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
                                                <ShieldCheck className="h-5 w-5" style={{ color: "var(--green-500)" }} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>100% Private & Open Source</h3>
                                                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                                    Your privacy is our number one priority. <strong>Your data is saved strictly to this device only</strong> (and exclusively to your own Google Drive when you sign in).
                                                    We have zero servers, zero databases, and absolutely zero access to your or your employee's personal details.
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
                                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm">Peace of Mind</h3>
                                                <p className="text-[11px] mt-1 text-zinc-400 leading-relaxed">
                                                    In SA, a single procedural error in a payslip can lead to CCMA awards of up to 12 months' salary. LekkerLedger is your digital safety net.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Button className="w-full gap-2 h-12 text-base font-bold" onClick={() => setStep(2)}>
                                Next: Employer Details <ChevronRight className="h-5 w-5" />
                            </Button>

                            <div className="text-center pt-2">
                                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                    Join thousands of households simplifying their compliance.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleSave} className="space-y-6 animate-slide-up">
                            <div className="text-center space-y-2">
                                <h1 className="text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                                    Employer Details
                                </h1>
                                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                    By law, your name and address must appear on your employee's payslip.
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
                                Your data is protected by POPIA compliant local-only storage. We never see your details.
                            </p>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}
