"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    ShieldCheck, Cloud, HelpCircle, ChevronRight, Scale, Building2,
    Save, Smartphone, Database, Globe, Loader2, Zap, ArrowRight,
    Download, Upload, Shield, Users, Info, Clock, AlertCircle, HardDrive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { getSettings, saveSettings, resetAllData, getCurrentTaxYearRange, exportData, importData, getEmployees } from "@/lib/storage";
import { EmployerSettings, Employee } from "@/lib/schema";
import { useToast } from "@/components/ui/toast";
import { GoogleSync } from "@/components/google-sync";
import { useUI } from "@/components/theme-provider";
import { Moon, Sun, Monitor, AlignVerticalJustifyCenter } from "lucide-react";

type SettingsTab = "profile" | "compliance" | "privacy" | "storage" | "households";

function SettingsContent() {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = React.useState<SettingsTab>("profile");
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [saved, setSaved] = React.useState(false);
    const { theme, setTheme, density, setDensity } = useUI();

    const THEME_OPTIONS = [
        { value: "system" as const, label: "Auto", icon: Monitor },
        { value: "light" as const, label: "Light", icon: Sun },
        { value: "dark" as const, label: "Dark", icon: Moon },
    ];

    React.useEffect(() => {
        async function load() {
            const [s, emps] = await Promise.all([getSettings(), getEmployees()]);
            setSettings(s);
            setEmployees(emps);
            setLoading(false);
            const tabParam = searchParams.get("tab");
            if (tabParam === "sync" || tabParam === "storage") setActiveTab("storage");
            else if (tabParam === "profile") setActiveTab("profile");
            else if (tabParam === "compliance") setActiveTab("compliance");
            else if (tabParam === "privacy") setActiveTab("privacy");
            else if (tabParam === "households") setActiveTab("households");
        }
        load();
    }, [searchParams]);

    const handleSave = async (updated: Partial<EmployerSettings>) => {
        if (!settings) return;
        setSaving(true);
        const newSettings = { ...settings, ...updated };
        if (updated.density) setDensity(updated.density);
        setSettings(newSettings);
        await saveSettings(newSettings);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    if (loading || !settings) {
        return (
            <>
                <PageHeader title="Settings" />
                <CardSkeleton />
                <CardSkeleton />
            </>
        );
    }

    return (
        <div className="max-w-3xl mx-auto pb-20">
            <PageHeader title="Settings" />

            {/* Tab switcher */}
            <div className="flex bg-[var(--bg-surface)] p-1.5 rounded-[2.5rem] mb-2 border border-[var(--border-subtle)] overflow-x-auto scrollbar-hide">
                <div className="flex min-w-max gap-1">
                    <TabButton id="profile" icon={Building2} label="Profile" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton id="compliance" icon={Info} label="BCEA" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton id="privacy" icon={Shield} label="Privacy" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton id="storage" icon={Database} label="Storage" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton id="households" icon={Users} label="Family" activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
            </div>
            <p className="text-[9px] text-center text-[var(--text-muted)] font-black uppercase tracking-widest mb-6">Swipe for more tabs</p>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === "profile" && (
                    <div className="space-y-6">
                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Employer Information</h2>
                            <Card className="glass-panel border-none p-5 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ename">Employer Name</Label>
                                    <Input id="ename" value={settings.employerName} onChange={(e) => setSettings({ ...settings, employerName: e.target.value })} placeholder="e.g. John Doe" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="eaddr">Physical Address</Label>
                                    <Input id="eaddr" value={settings.employerAddress} onChange={(e) => setSettings({ ...settings, employerAddress: e.target.value })} placeholder="e.g. 123 Main St, Cape Town" />
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
                                    <Switch checked={settings.simpleMode} onCheckedChange={(val) => handleSave({ simpleMode: val })} />
                                </div>
                                <div className="flex items-center justify-between p-4 hover:bg-[var(--bg-subtle)] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500"><Zap className="h-4 w-4" /></div>
                                        <div>
                                            <p className="text-sm font-bold">Advanced Mode</p>
                                            <p className="text-[10px] text-[var(--text-muted)]">Show raw calculation logs and legal references</p>
                                        </div>
                                    </div>
                                    <Switch checked={settings.advancedMode} onCheckedChange={(val) => handleSave({ advancedMode: val })} />
                                </div>
                                <div className="flex items-center justify-between p-4 hover:bg-[var(--bg-subtle)] transition-colors border-b border-[var(--border-subtle)]">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><AlignVerticalJustifyCenter className="h-4 w-4" /></div>
                                        <div>
                                            <p className="text-sm font-bold">Compact Layout</p>
                                            <p className="text-[10px] text-[var(--text-muted)]">Reduce padding and spacing to show more data</p>
                                        </div>
                                    </div>
                                    <Switch checked={settings.density === "compact"} onCheckedChange={(val) => handleSave({ density: val ? "compact" : "comfortable" })} />
                                </div>

                                <div className="flex flex-col p-4 border-t border-[var(--border-subtle)]">
                                    <p className="text-sm font-bold mb-1">Appearance</p>
                                    <p className="text-[10px] text-[var(--text-muted)] mb-3">Choose how LekkerLedger looks</p>
                                    <div className="flex items-center rounded-lg p-1 gap-1" style={{ backgroundColor: "var(--bg-subtle)" }}>
                                        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                                            const active = theme === value;
                                            return (
                                                <button key={value} onClick={() => setTheme(value)} aria-pressed={active}
                                                    className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-md text-xs font-medium transition-all duration-200 active-scale"
                                                    style={{
                                                        backgroundColor: active ? "var(--bg-surface)" : "transparent",
                                                        color: active ? "var(--amber-500)" : "var(--text-muted)",
                                                        boxShadow: active ? "var(--shadow-sm)" : "none",
                                                    }}>
                                                    <Icon className="h-4 w-4" />{label}
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
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Informational Guidelines</h2>
                                <span className="text-[9px] font-black text-[var(--amber-600)] uppercase">Updated March 2026</span>
                            </div>
                            <Card className="glass-panel border-none p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0"><Scale className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-sm font-bold text-[var(--text-primary)]">BCEA Compliance</p>
                                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                                The Basic Conditions of Employment Act (BCEA) sets minimum standards for domestic workers in South Africa.
                                                LekkerLedger calculates values based on the latest SD7 schedules, but these remain informational.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0"><ShieldCheck className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-sm font-bold text-[var(--text-primary)]">Registrations</p>
                                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                                Ensure you update your UIF and SDL reference numbers if you exceed R500k/year in total payroll.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-[var(--border-subtle)] grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="uifref">uFiling Reference</Label>
                                        <Input id="uifref" value={settings.uifRefNumber} onChange={(e) => setSettings({ ...settings, uifRefNumber: e.target.value })} placeholder="U123456...-1" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sdlref">SDL Ref (Optional)</Label>
                                        <Input id="sdlref" value={settings.sdlNumber} onChange={(e) => setSettings({ ...settings, sdlNumber: e.target.value })} placeholder="L123456..." />
                                    </div>
                                </div>

                                <Button onClick={() => handleSave({})} disabled={saving} className="w-full bg-amber-500 text-white font-black h-12 shadow-lg shadow-amber-500/20">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                    Save Reference Numbers
                                </Button>
                            </Card>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Tax Year Context</h2>
                            <Card className="bg-emerald-500/10 border-emerald-500/20 p-5">
                                <div className="flex justify-between items-center text-sm font-black text-emerald-950 dark:text-emerald-200">
                                    <span>Financial Year {getCurrentTaxYearRange().label}</span>
                                    <span className="text-[10px] opacity-60">Ends 28 Feb</span>
                                </div>
                            </Card>
                        </section>
                    </div>
                )}

                {activeTab === "privacy" && (
                    <div className="space-y-6">
                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Data Obfuscation</h2>
                            <Card className="glass-panel border-none p-0 overflow-hidden">
                                <div className="p-6 space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-[var(--amber-500)]/10 flex items-center justify-center text-[var(--amber-600)] shrink-0">
                                            <Shield className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-bold text-[var(--text-primary)]">PII Protection</p>
                                                <Switch
                                                    checked={settings.piiObfuscationEnabled}
                                                    onCheckedChange={(val) => handleSave({ piiObfuscationEnabled: val })}
                                                />
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                                When enabled, sensitive fields (names, ID numbers, rates) are encoded before being saved to local storage.
                                                This adds a layer of protection against direct file access on this device.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-t border-[var(--border-subtle)] flex items-center gap-3">
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                    <p className="text-[10px] font-medium text-[var(--text-muted)]">
                                        Changing this will only affect records saved or imported from this point forward.
                                    </p>
                                </div>
                            </Card>
                        </section>
                    </div>
                )}

                {activeTab === "storage" && (
                    <div className="space-y-6">
                        <GoogleSync proStatus={settings.proStatus} />

                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Export & Maintenance</h2>
                            <Card className="glass-panel border-none p-5 space-y-4">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button variant="outline" className="flex-1 gap-2 text-xs h-11 font-black rounded-xl border-[var(--border-default)]"
                                        onClick={async () => {
                                            try {
                                                const json = await exportData();
                                                const blob = new Blob([json], { type: "application/json" });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement("a"); a.href = url;
                                                a.download = `lekkerledger-backup-${new Date().toISOString().split('T')[0]}.json`;
                                                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                                                URL.revokeObjectURL(url);
                                            } catch { alert("Export failed."); }
                                        }}>
                                        <Download className="h-4 w-4" /> Download Backup
                                    </Button>
                                    <label className="flex-1">
                                        <div className="flex items-center justify-center gap-2 text-xs h-11 font-black border border-[var(--border-default)] rounded-xl px-4 cursor-pointer hover:bg-[var(--bg-subtle)] transition-all">
                                            <Upload className="h-4 w-4" /> Restore JSON
                                        </div>
                                        <input type="file" className="sr-only" accept=".json"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                if (!confirm("This will replace ALL your current data. Are you sure?")) return;
                                                const reader = new FileReader();
                                                reader.onload = async (ev) => {
                                                    try {
                                                        const res = await importData(ev.target?.result as string);
                                                        if (res.success) {
                                                            alert("Restored successfully. Reloading...");
                                                            window.location.reload();
                                                        } else {
                                                            alert(res.error || "Restore failed.");
                                                        }
                                                    } catch { alert("Restore failed — check the file."); }
                                                };
                                                reader.readAsText(file);
                                            }} />
                                    </label>
                                </div>
                            </Card>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Danger Zone</h2>
                            <Card className="border-rose-200 dark:border-rose-900/30 bg-rose-500/5">
                                <Button variant="ghost" className="w-full justify-between text-rose-500 hover:bg-rose-500/10 h-14 px-4 rounded-xl"
                                    onClick={async () => {
                                        if (confirm("This will permanently delete ALL data (employees, payslips, settings) on this device. Continue?")) {
                                            await resetAllData();
                                            window.location.href = "/";
                                        }
                                    }}>
                                    <div className="flex items-center gap-3">
                                        <Database className="h-4 w-4" />
                                        <span className="font-bold text-sm">Wipe All Local Data</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </Card>
                        </section>
                    </div>
                )}

                {activeTab === "households" && (
                    <div className="space-y-6">
                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Household Members</h2>
                            <div className="grid grid-cols-1 gap-3">
                                {employees.map(emp => (
                                    <Link key={emp.id} href={`/app/employees?id=${emp.id}`}>
                                        <Card className="glass-panel border-none p-4 flex items-center justify-between hover:bg-[var(--bg-subtle)] transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-[var(--bg-subtle)] flex items-center justify-center font-black group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                                    {emp.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[var(--text-primary)]">{emp.name}</p>
                                                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-black">{emp.role}</p>
                                                </div>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--amber-500)] group-hover:translate-x-1 transition-all" />
                                        </Card>
                                    </Link>
                                ))}
                                <Link href="/app/employees/new">
                                    <Button variant="outline" className="w-full border-dashed border-2 py-8 rounded-2xl gap-2 font-black text-xs uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--amber-500)] transition-all">
                                        Add New Member
                                    </Button>
                                </Link>
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <React.Suspense fallback={
            <>
                <PageHeader title="Settings" />
                <CardSkeleton />
                <CardSkeleton />
            </>
        }>
            <SettingsContent />
        </React.Suspense>
    );
}

function TabButton({ id, icon: Icon, label, activeTab, setActiveTab }: { id: SettingsTab; icon: React.ElementType; label: string; activeTab: SettingsTab; setActiveTab: (id: SettingsTab) => void }) {
    const active = activeTab === id;
    return (
        <button onClick={() => setActiveTab(id)} aria-pressed={active}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 px-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-200 min-w-max"
            style={{
                backgroundColor: active ? "var(--amber-500)" : "transparent",
                color: active ? "#ffffff" : "var(--text-muted)",
                boxShadow: active ? "var(--shadow-sm)" : "none",
            }}>
            <Icon className="h-4 w-4" />{label}
        </button>
    );
}

function Step({ number, text }: { number: string; text: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="h-6 w-6 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center shrink-0">{number}</span>
            <p className="text-sm text-zinc-300">{text}</p>
        </div>
    );
}

function QandA({ q, a }: { q: string; a: string }) {
    return (
        <div className="space-y-1 border-b border-[var(--border-subtle)] pb-4 last:border-0 last:pb-0">
            <p className="text-sm font-bold text-[var(--text-primary)]">{q}</p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{a}</p>
        </div>
    );
}
