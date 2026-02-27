"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SideDrawer } from "@/components/layout/side-drawer";
import { getSettings, saveSettings } from "@/lib/storage";
import { EmployerSettings } from "@/lib/schema";

export default function SettingsPage() {
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [saved, setSaved] = React.useState(false);
    const [form, setForm] = React.useState<EmployerSettings>({
        employerName: "",
        employerAddress: "",
        employerIdNumber: "",
        uifRefNumber: "",
        sdlNumber: "",
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
        setSaved(false);
        await saveSettings(form);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
            <header
                className="sticky top-0 z-30 px-4 py-3"
                style={{
                    backgroundColor: "var(--bg-surface)",
                    borderBottom: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-sm)",
                }}
            >
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    <SideDrawer />
                    <Link href="/dashboard">
                        <button
                            aria-label="Back"
                            className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors hover:bg-[var(--bg-subtle)]"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                    </Link>
                    <h1 className="font-bold text-base tracking-tight" style={{ color: "var(--text-primary)" }}>
                        Settings
                    </h1>
                </div>
            </header>

            <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 space-y-5">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--amber-500)" }} />
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="space-y-5">
                        {/* Employer Details */}
                        <Card className="animate-slide-up">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Building2 className="h-4 w-4" style={{ color: "var(--amber-500)" }} />
                                    <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                        Employer Details
                                    </h2>
                                </div>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                    These details appear on employment contracts and uFiling CSV exports.
                                </p>

                                <div className="space-y-2">
                                    <Label htmlFor="employer-name">Employer Full Name</Label>
                                    <Input
                                        id="employer-name"
                                        placeholder="e.g. John & Sarah Smith"
                                        value={form.employerName}
                                        onChange={(e) => setForm({ ...form, employerName: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="employer-address">Address</Label>
                                    <Input
                                        id="employer-address"
                                        placeholder="e.g. 12 Protea Street, Sandton, 2196"
                                        value={form.employerAddress}
                                        onChange={(e) => setForm({ ...form, employerAddress: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="employer-id">Employer ID Number</Label>
                                    <Input
                                        id="employer-id"
                                        placeholder="SA ID or Passport Number"
                                        value={form.employerIdNumber}
                                        onChange={(e) => setForm({ ...form, employerIdNumber: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* UIF / Tax References */}
                        <Card className="animate-slide-up">
                            <CardContent className="p-5 space-y-4">
                                <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                    UIF & Tax References
                                </h2>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                    Optional. Used in the uFiling CSV export and on payslip PDFs.
                                </p>

                                <div className="space-y-2">
                                    <Label htmlFor="uif-ref">uFiling Reference Number</Label>
                                    <Input
                                        id="uif-ref"
                                        placeholder="e.g. U123456789"
                                        value={form.uifRefNumber}
                                        onChange={(e) => setForm({ ...form, uifRefNumber: e.target.value })}
                                    />
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        Find this on your uFiling account or UIF registration letter.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sdl-number">SDL Number (optional)</Label>
                                    <Input
                                        id="sdl-number"
                                        placeholder="e.g. L123456789"
                                        value={form.sdlNumber}
                                        onChange={(e) => setForm({ ...form, sdlNumber: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Save */}
                        <Button
                            type="submit"
                            className="w-full gap-2 h-12 text-base"
                            disabled={saving}
                        >
                            {saving ? (
                                <><Loader2 className="h-5 w-5 animate-spin" /> Saving…</>
                            ) : saved ? (
                                <><CheckCircle2 className="h-5 w-5" /> Saved!</>
                            ) : (
                                <><Save className="h-5 w-5" /> Save Settings</>
                            )}
                        </Button>

                        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                            All data is stored on your device only. Nothing is sent to any server.
                        </p>
                    </form>
                )}
            </main>
        </div>
    );
}
