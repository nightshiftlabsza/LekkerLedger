"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    User,
    ShieldCheck,
    Cloud,
    HelpCircle,
    Check,
    ChevronRight,
    Info,
    BookOpen,
    Scale,
    Settings,
    FileText,
    Building2,
    Save,
    Trash2,
    AlertTriangle,
    Smartphone,
    Database,
    Globe,
    Loader2,
    Zap,
    ArrowRight,
    Download,
    Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SideDrawer } from "@/components/layout/side-drawer";
import { getSettings, saveSettings, resetAllData, getCurrentTaxYearRange, exportData, importData } from "@/lib/storage";
import { EmployerSettings } from "@/lib/schema";
import { useToast } from "@/components/ui/toast";
import { GoogleSync } from "@/components/google-sync";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, Monitor } from "lucide-react";

type SettingsTab = "profile" | "compliance" | "sync" | "guide";

function SettingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = React.useState<SettingsTab>("profile");
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [saved, setSaved] = React.useState(false);
    const { theme, setTheme } = useTheme();

    const THEME_OPTIONS = [
        { value: "system" as const, label: "Auto", icon: Monitor },
        { value: "light" as const, label: "Light", icon: Sun },
        { value: "dark" as const, label: "Dark", icon: Moon },
    ];

    React.useEffect(() => {
        async function load() {
            const s = await getSettings();
            setSettings(s);
            setLoading(false);

            // Handle tab parameter
            const tabParam = searchParams.get("tab");
            if (tabParam === "sync") {
                setActiveTab("sync");
            } else if (tabParam === "profile") {
                setActiveTab("profile");
            } else if (tabParam === "compliance") {
                setActiveTab("compliance");
            } else if (tabParam === "guide") {
                setActiveTab("guide");
            }
        }
        load();
    }, [searchParams]);

    const handleSave = async (updated: Partial<EmployerSettings>) => {
        if (!settings) return;
        setSaving(true);
        const newSettings = { ...settings, ...updated };
        setSettings(newSettings);
        await saveSettings(newSettings);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    if (loading || !settings) return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-base)]">
            <header className="sticky top-0 z-30 px-4 py-3 glass-panel border-b border-[var(--border-subtle)]">
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <Skeleton className="h-9 w-9 rounded-xl" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </header>
            <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 space-y-8">
                <Skeleton className="h-16 w-full rounded-[2.5rem]" />
                <section className="space-y-4">
                    <Skeleton className="h-3 w-32 ml-1" />
                    <Skeleton className="h-48 w-full rounded-2xl" />
                </section>
                <section className="space-y-4">
                    <Skeleton className="h-3 w-32 ml-1" />
                    <Skeleton className="h-32 w-full rounded-2xl" />
                </section>
            </main>
        </div>
    );

    const TabButton = ({ id, icon: Icon, label }: { id: SettingsTab; icon: any; label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 flex-1 ${activeTab === id
                ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20 scale-105"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"
                }`}
        >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-base)]">
            <header className="sticky top-0 z-30 px-4 py-3 glass-panel border-b border-[var(--border-subtle)]">
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    <SideDrawer />
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <h1 className="font-bold text-base text-[var(--text-primary)]">Settings</h1>
                </div>
            </header>

            <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 pb-32 overflow-x-hidden">
                {/* Modern Tab Switcher */}
                <div className="flex bg-[var(--bg-surface)] p-1.5 rounded-[2.5rem] mb-8 border border-[var(--border-subtle)]">
                    <TabButton id="profile" icon={Building2} label="Profile" />
                    <TabButton id="compliance" icon={ShieldCheck} label="BCEA" />
                    <TabButton id="sync" icon={Cloud} label="Sync" />
                    <TabButton id="guide" icon={HelpCircle} label="Guide" />
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === "profile" && (
                        <div className="space-y-6">
                            <section className="space-y-4">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Employer Information</h2>
                                <Card className="glass-panel border-none p-5 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ename">Employer Name</Label>
                                        <Input
                                            id="ename"
                                            value={settings.employerName}
                                            onChange={(e) => setSettings({ ...settings, employerName: e.target.value })}
                                            placeholder="e.g. John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="eaddr">Physical Address</Label>
                                        <Input
                                            id="eaddr"
                                            value={settings.employerAddress}
                                            onChange={(e) => setSettings({ ...settings, employerAddress: e.target.value })}
                                            placeholder="e.g. 123 Main St, Cape Town"
                                        />
                                    </div>
                                    <Button onClick={() => handleSave({})} disabled={saving} className="w-full bg-amber-500 text-white font-bold h-11">
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                        {saved ? "Settings Saved" : "Save Changes"}
                                    </Button>
                                </Card>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">App Experience</h2>
                                <Card className="glass-panel border-none p-1 overflow-hidden">
                                    <div className="flex items-center justify-between p-4 hover:bg-[var(--bg-subtle)] transition-colors border-b border-[var(--border-subtle)]">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500"><Smartphone className="h-4 w-4" /></div>
                                            <div>
                                                <p className="text-sm font-bold">Simple Mode</p>
                                                <p className="text-[10px] text-[var(--text-muted)]">Hide advanced compliance tools and graphs</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={settings.simpleMode}
                                            onCheckedChange={(val) => handleSave({ simpleMode: val })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 hover:bg-[var(--bg-subtle)] transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500"><Zap className="h-4 w-4" /></div>
                                            <div>
                                                <p className="text-sm font-bold">Advanced Mode</p>
                                                <p className="text-[10px] text-[var(--text-muted)]">Show raw calculation logs and legal references</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={settings.advancedMode}
                                            onCheckedChange={(val) => handleSave({ advancedMode: val })}
                                        />
                                    </div>

                                    {/* Theme Switcher added here */}
                                    <div className="flex flex-col p-4 border-t border-[var(--border-subtle)]">
                                        <p className="text-sm font-bold mb-1">Appearance</p>
                                        <p className="text-[10px] text-[var(--text-muted)] mb-3">Choose how LekkerLedger looks</p>
                                        <div
                                            className="flex items-center rounded-lg p-1 gap-1"
                                            style={{ backgroundColor: "var(--bg-subtle)" }}
                                        >
                                            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                                                const active = theme === value;
                                                return (
                                                    <button
                                                        key={value}
                                                        onClick={() => setTheme(value)}
                                                        className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-md text-xs font-medium transition-all duration-200 active-scale"
                                                        style={{
                                                            backgroundColor: active ? "var(--bg-surface)" : "transparent",
                                                            color: active ? "var(--amber-500)" : "var(--text-muted)",
                                                            boxShadow: active ? "var(--shadow-sm)" : "none",
                                                        }}
                                                    >
                                                        <Icon className="h-4 w-4" />
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </Card>
                            </section>
                        </div>
                    )}

                    {activeTab === "compliance" && (
                        <div className="space-y-6">
                            <section className="space-y-4">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Registrations</h2>
                                <Card className="glass-panel border-none p-5 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="uifref">uFiling / UIF Reference</Label>
                                        <Input
                                            id="uifref"
                                            value={settings.uifRefNumber}
                                            onChange={(e) => setSettings({ ...settings, uifRefNumber: e.target.value })}
                                            placeholder="e.g. U1234567-8"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sdlref">SDL Reference (Optional)</Label>
                                        <Input
                                            id="sdlref"
                                            value={settings.sdlNumber}
                                            onChange={(e) => setSettings({ ...settings, sdlNumber: e.target.value })}
                                            placeholder="e.g. L123456789"
                                        />
                                        <p className="text-[10px] text-[var(--text-muted)]">Payroll {"<"} R500k/year is SDL exempt.</p>
                                    </div>
                                    <Button onClick={() => handleSave({})} disabled={saving} className="w-full bg-amber-500 text-white font-bold h-11">
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                        Save Registration Details
                                    </Button>
                                </Card>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Tax Year Info</h2>
                                <Card className="bg-emerald-500/10 border-emerald-500/20 p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                                            <Scale className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-400">Current SA Tax Year</p>
                                            <p className="text-xs text-emerald-700/70 dark:text-emerald-500/70">Source: SARS BCEA Schedule</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-black text-emerald-950 dark:text-emerald-200">
                                        <span>Year {getCurrentTaxYearRange().label}</span>
                                        <span className="text-[10px] opacity-60">Ends 28 Feb</span>
                                    </div>
                                </Card>
                            </section>
                        </div>
                    )}

                    {activeTab === "sync" && (
                        <div className="space-y-6">
                            <GoogleSync proStatus={settings.proStatus} />

                            <section className="space-y-4">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Backup & Restore</h2>
                                <Card className="glass-panel border-none p-5 space-y-3">
                                    <p className="text-xs text-[var(--text-secondary)]">Save a copy of all your employees and payslips as a JSON file, or restore from a previous backup.</p>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1 gap-2 text-xs h-10 font-bold"
                                            onClick={async () => {
                                                try {
                                                    const json = await exportData();
                                                    const blob = new Blob([json], { type: "application/json" });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement("a");
                                                    a.href = url;
                                                    a.download = `lekkerledger-backup-${new Date().toISOString().split('T')[0]}.json`;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    document.body.removeChild(a);
                                                    URL.revokeObjectURL(url);
                                                } catch (e) {
                                                    alert("Export failed.");
                                                }
                                            }}
                                        >
                                            <Download className="h-3.5 w-3.5" /> Download Backup
                                        </Button>
                                        <label className="flex-1">
                                            <span className="sr-only">Restore from backup</span>
                                            <div className="flex items-center justify-center gap-2 text-xs h-10 font-bold border border-input rounded-md px-4 cursor-pointer hover:bg-[var(--bg-subtle)] transition-colors">
                                                <Upload className="h-3.5 w-3.5" /> Restore Backup
                                            </div>
                                            <input
                                                type="file"
                                                className="sr-only"
                                                accept=".json"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    if (!confirm("This will replace ALL your current data. Are you sure?")) return;
                                                    const reader = new FileReader();
                                                    reader.onload = async (ev) => {
                                                        try {
                                                            await importData(ev.target?.result as string);
                                                            alert("Restored successfully. Reloading...");
                                                            window.location.reload();
                                                        } catch { alert("Restore failed — check the file."); }
                                                    };
                                                    reader.readAsText(file);
                                                }}
                                            />
                                        </label>
                                    </div>
                                </Card>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Danger Zone</h2>
                                <Card className="glass-panel border-none p-1">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-between text-rose-500 hover:bg-rose-500/10 h-14 px-4"
                                        onClick={async () => {
                                            if (confirm("This will permanently delete ALL data on this device. Continue?")) {
                                                await resetAllData();
                                                window.location.href = "/";
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Database className="h-4 w-4" />
                                            <span className="font-bold text-sm">Reset All App Data</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </Card>
                            </section>
                        </div>
                    )}

                    {activeTab === "guide" && (
                        <div className="space-y-6 pb-12">
                            <section className="space-y-4">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Sync Masterclass</h2>

                                <Card className="bg-zinc-900 border-none p-6 text-white overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <Cloud className="h-32 w-32" />
                                    </div>
                                    <div className="relative z-10 space-y-4">
                                        <div className="flex items-center gap-2 text-amber-500">
                                            <Smartphone className="h-5 w-5" />
                                            <ArrowRight className="h-4 w-4 text-zinc-600" />
                                            <Globe className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-xl font-black">Android ↔ Web Persistence</h3>
                                        <p className="text-sm text-zinc-400 leading-relaxed">
                                            LekkerLedger uses **Google Drive AppData** to sync your records. This is a private, encrypted vault that only this app can access.
                                        </p>
                                        <div className="space-y-3 pt-2">
                                            <Step number="1" text="Enable Sync in the 'Sync' tab above." />
                                            <Step number="2" text="Sign in with the SAME Google account on both devices." />
                                            <Step number="3" text="Data syncs automatically every time you save a payslip." />
                                        </div>
                                    </div>
                                </Card>

                                <Card className="glass-panel border-none p-5 space-y-5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                            <HelpCircle className="h-5 w-5" />
                                        </div>
                                        <h3 className="font-bold text-sm uppercase tracking-wider">Common Questions</h3>
                                    </div>

                                    <QandA
                                        q="Is my data safe in Google Drive?"
                                        a="Yes. We use the AppData folder, which is invisible to you in your drive and cannot be accessed by other users or apps. Your employee IDs and rates stay private."
                                    />
                                    <QandA
                                        q="What if I delete the app?"
                                        a="As long as you enabled Sync, your data remains in your Google Account. Re-install the app or log in on the web to restore instantly."
                                    />
                                </Card>

                                <Card className="bg-amber-500 p-5 text-white flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <h4 className="font-bold uppercase text-[10px] tracking-widest opacity-80">Ready to sync?</h4>
                                        <p className="text-sm font-bold">Configure your cloud vault now.</p>
                                    </div>
                                    <Link href="/settings?tab=sync">
                                        <Button variant="outline" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20 font-bold">
                                            Go to Sync
                                        </Button>
                                    </Link>
                                </Card>
                            </section>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen flex flex-col bg-[var(--bg-base)]">
                <header className="sticky top-0 z-30 px-4 py-3 glass-panel border-b border-[var(--border-subtle)]">
                    <div className="max-w-xl mx-auto flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-xl" />
                        <Skeleton className="h-9 w-9 rounded-xl" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </header>
                <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 space-y-8">
                    <Skeleton className="h-16 w-full rounded-[2.5rem]" />
                    <section className="space-y-4">
                        <Skeleton className="h-3 w-32 ml-1" />
                        <Skeleton className="h-48 w-full rounded-2xl" />
                    </section>
                </main>
            </div>
        }>
            <SettingsContent />
        </React.Suspense>
    );
}

function Step({ number, text }: { number: string; text: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="h-5 w-5 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{number}</span>
            <p className="text-xs text-zinc-300">{text}</p>
        </div>
    );
}

function QandA({ q, a }: { q: string; a: string }) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-black text-[var(--text-primary)]">Q: {q}</p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{a}</p>
        </div>
    );
}
