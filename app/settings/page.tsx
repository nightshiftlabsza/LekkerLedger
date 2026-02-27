"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Building2, CheckCircle2, Image as ImageIcon, Upload, X, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SideDrawer } from "@/components/layout/side-drawer";
import { getSettings, saveSettings } from "@/lib/storage";
import { EmployerSettings } from "@/lib/schema";
import { GoogleSync } from "@/components/google-sync";

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
                        {/* Logo Upload (Pro Feature) */}
                        <Card className="animate-slide-up">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4" style={{ color: "var(--amber-500)" }} />
                                        <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                            Business Logo
                                        </h2>
                                    </div>
                                    {form.proStatus !== "pro" && (
                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Sparkles className="h-2 w-2" /> Pro
                                        </span>
                                    )}
                                </div>

                                {form.proStatus === "pro" ? (
                                    <>
                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                            Your logo will appear on the top left of your payslips and contracts.
                                        </p>

                                        <div className="flex items-center gap-4">
                                            {form.logoData ? (
                                                <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                                                    <img src={form.logoData} alt="Logo" className="h-full w-full object-contain" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setForm({ ...form, logoData: "" })}
                                                        className="absolute top-1 right-1 h-5 w-5 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="h-20 w-20 rounded-xl border-2 border-dashed border-[var(--border-strong)] flex flex-col items-center justify-center" style={{ color: "var(--text-muted)" }}>
                                                    <ImageIcon className="h-6 w-6 opacity-20" />
                                                </div>
                                            )}

                                            <div className="flex-1">
                                                <Label htmlFor="logo-upload" className="cursor-pointer">
                                                    <div className="flex items-center gap-2 text-sm font-medium hover:text-[var(--amber-500)] transition-colors">
                                                        <Upload className="h-4 w-4" />
                                                        {form.logoData ? "Change Logo" : "Upload Logo"}
                                                    </div>
                                                    <input
                                                        id="logo-upload"
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    setForm({ ...form, logoData: reader.result as string });
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                    />
                                                </Label>
                                                <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                                                    PNG or JPG. Square or landscape works best.
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <Link href="/pricing" className="block p-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-amber-800">Unlock custom branding</p>
                                                <p className="text-[10px] text-amber-700/70 leading-relaxed max-w-[200px]">Add your personal or company logo to all payslips and contracts.</p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-amber-500" />
                                        </div>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>

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

                        <GoogleSync proStatus={form.proStatus} />

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
