"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    CheckCircle2, FileText, BookOpen, ArrowRight, Upload,
    ChevronRight, Building2, Save, Smartphone, Database, Loader2, Zap,
    AlignVerticalJustifyCenter, Moon, Sun, Monitor,
    ShieldCheck, Download, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { getSettings, saveSettings, resetAllData, exportData, importData, getEmployees } from "@/lib/storage";
import { EmployerSettings, Employee } from "@/lib/schema";
import { useToast } from "@/components/ui/toast";
import { GoogleSync } from "@/components/google-sync";
import { useUI } from "@/components/theme-provider";
import { PLAN_ORDER, PLANS, getPlanDisplayPrice, getPlanPeriodLabel, getPlanSavingsLabel } from "@/src/config/plans";
import { getUserPlan, canUseDriveSync } from "../../../lib/entitlements";

type SettingsTab = "general" | "storage" | "plan" | "exports" | "support";

function SettingsContent() {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = React.useState<SettingsTab>("general");
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [, setEmployees] = React.useState<Employee[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [saved, setSaved] = React.useState(false);
    const { theme, setTheme, setDensity } = useUI();

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
            else if (tabParam === "general") setActiveTab("general");
            else if (tabParam === "plan") setActiveTab("plan");
            else if (tabParam === "exports") setActiveTab("exports");
            else if (tabParam === "support") setActiveTab("support");
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
            <div className="flex bg-[var(--surface-1)] p-2 rounded-[2rem] mb-2 border border-[var(--border)] overflow-x-auto scrollbar-hide">
                <div className="flex min-w-max gap-1">
                    <TabButton id="general" icon={Building2} label="General" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton id="storage" icon={Database} label="Storage & Sync" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton id="plan" icon={ShieldCheck} label="Plan" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton id="exports" icon={Download} label="Exports" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton id="support" icon={HelpCircle} label="Support" activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
            </div>
            <p className="lg:hidden text-[9px] text-center text-[var(--text-muted)] font-black uppercase tracking-widest mb-6">Swipe for more tabs</p>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === "general" && (
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
                                <div className="space-y-2">
                                    <Label htmlFor="ephone">Contact Phone</Label>
                                    <Input id="ephone" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} placeholder="e.g. 021 123 4567" />
                                </div>
                                <Button onClick={() => handleSave({})} disabled={saving} className="w-full bg-[var(--primary)] text-white font-bold h-11">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                    {saved ? "Settings Saved" : "Save Changes"}
                                </Button>
                            </Card>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">App Experience</h2>
                            <Card className="glass-panel border-none p-1 overflow-hidden">
                                <div className="flex items-center justify-between p-4 hover:bg-[var(--surface-2)] transition-colors border-b border-[var(--border)]">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--focus)]"><Smartphone className="h-4 w-4" /></div>
                                        <div>
                                            <p className="text-sm font-bold">Simple Mode</p>
                                            <p className="text-[10px] text-[var(--text-muted)]">Hide advanced compliance tools and graphs</p>
                                        </div>
                                    </div>
                                    <Switch checked={settings.simpleMode} onCheckedChange={(val) => handleSave({ simpleMode: val })} />
                                </div>
                                <div className="flex items-center justify-between p-4 hover:bg-[var(--surface-2)] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500"><Zap className="h-4 w-4" /></div>
                                        <div>
                                            <p className="text-sm font-bold">Advanced Mode</p>
                                            <p className="text-[10px] text-[var(--text-muted)]">Show raw calculation logs and legal references</p>
                                        </div>
                                    </div>
                                    <Switch checked={settings.advancedMode} onCheckedChange={(val) => handleSave({ advancedMode: val })} />
                                </div>
                                <div className="flex items-center justify-between p-4 hover:bg-[var(--surface-2)] transition-colors border-b border-[var(--border)]">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><AlignVerticalJustifyCenter className="h-4 w-4" /></div>
                                        <div>
                                            <p className="text-sm font-bold">Compact Layout</p>
                                            <p className="text-[10px] text-[var(--text-muted)]">Reduce padding and spacing to show more data</p>
                                        </div>
                                    </div>
                                    <Switch checked={settings.density === "compact"} onCheckedChange={(val) => handleSave({ density: val ? "compact" : "comfortable" })} />
                                </div>

                                <div className="flex flex-col p-4 border-t border-[var(--border)]">
                                    <p className="text-sm font-bold mb-1">Appearance</p>
                                    <p className="text-[10px] text-[var(--text-muted)] mb-3">Choose how LekkerLedger looks</p>
                                    <div className="flex items-center rounded-lg p-1 gap-1" style={{ backgroundColor: "var(--surface-2)" }}>
                                        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                                            const active = theme === value;
                                            return (
                                                <button key={value} onClick={() => setTheme(value)} aria-pressed={active}
                                                    className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-md text-xs font-medium transition-all duration-200 active-scale"
                                                    style={{
                                                        backgroundColor: active ? "var(--surface-1)" : "transparent",
                                                        color: active ? "var(--primary)" : "var(--text-muted)",
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

                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Registrations</h2>
                            <Card className="glass-panel border-none p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="eid">Employer ID / Co. Reg</Label>
                                        <Input id="eid" value={settings.employerIdNumber} onChange={(e) => setSettings({ ...settings, employerIdNumber: e.target.value })} placeholder="ID Number" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="uifref">uFiling Reference</Label>
                                        <Input id="uifref" value={settings.uifRefNumber} onChange={(e) => setSettings({ ...settings, uifRefNumber: e.target.value })} placeholder="U123456...-1" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="cfref">CF Registration (COIDA)</Label>
                                        <Input id="cfref" value={settings.cfNumber} onChange={(e) => setSettings({ ...settings, cfNumber: e.target.value })} placeholder="99000..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sdlref">SDL Ref (Optional)</Label>
                                        <Input id="sdlref" value={settings.sdlNumber} onChange={(e) => setSettings({ ...settings, sdlNumber: e.target.value })} placeholder="L123456..." />
                                    </div>
                                </div>
                                <Button onClick={() => handleSave({})} disabled={saving} className="w-full bg-[var(--primary)] text-white font-bold h-11">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                    Save Registrations
                                </Button>
                            </Card>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Privacy & Security</h2>
                            <Card className="glass-panel border-none p-4 flex items-center justify-between">
                                <div className="space-y-1 pr-4">
                                    <p className="text-sm font-bold text-[var(--text)]">PII Obfuscation</p>
                                    <p className="text-xs text-[var(--text-muted)]">Mask sensitive text when saving to local storage.</p>
                                </div>
                                <Switch checked={settings.piiObfuscationEnabled} onCheckedChange={(val) => handleSave({ piiObfuscationEnabled: val })} />
                            </Card>
                        </section>
                    </div>
                )}

                {activeTab === "storage" && (
                    <div className="space-y-6">
                        <GoogleSync driveSyncAllowed={canUseDriveSync(getUserPlan(settings))} />

                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Storage Rules</h2>
                            <Card className="glass-panel border-none p-5 space-y-4 text-sm text-[var(--text-muted)] leading-relaxed">
                                <p><strong>1. Local First:</strong> All records are stored securely on this device&apos;s browser until you manually wipe them or your browser clears its cache.</p>
                                <p><strong>2. Google Drive Sync:</strong> If connected, your data is continuously backed up to a dedicated, hidden folder in your Google Drive.</p>
                                <p><strong>3. PDF Generation:</strong> PDF payslips and contracts never leave your device unless you share or export them explicitly.</p>
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

                {activeTab === "plan" && (() => {
                    const currentPlan = getUserPlan(settings);
                    const currentCycle = settings.billingCycle === "monthly" ? "monthly" : "yearly";
                    const displayCycle = currentPlan.id === "free" ? "yearly" : currentCycle;

                    return (
                        <div className="space-y-6">
                            <section className="space-y-4">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Current Plan</h2>
                                <Card className="border-[var(--primary)] border-2 glass-panel p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-[var(--primary)]/5 blur-2xl pointer-events-none" />

                                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                                        <div className="space-y-2">
                                            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{currentPlan.label}</p>
                                            <h3 className="type-h3 text-[var(--text)]">{currentPlan.bestFor}</h3>
                                            <p className="text-sm text-[var(--text-muted)] max-w-2xl">{currentPlan.description}</p>
                                            <p className="text-xs font-bold text-[var(--primary-hover)] uppercase tracking-wider">
                                                {currentPlan.id === "free"
                                                    ? "Free plan active"
                                                    : settings.paidUntil
                                                        ? `Paid through ${new Date(settings.paidUntil).toLocaleDateString("en-ZA")}`
                                                        : "Paid plan active"}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 lg:min-w-[220px]">
                                            <div className="flex items-end gap-2">
                                                <span className="text-3xl font-semibold type-mono text-[var(--text)]">{getPlanDisplayPrice(currentPlan, displayCycle)}</span>
                                                <span className="pb-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{getPlanPeriodLabel(currentPlan, displayCycle)}</span>
                                            </div>
                                            {currentPlan.pricing.yearly && (
                                                <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">{getPlanSavingsLabel(currentPlan)}</p>
                                            )}
                                        </div>
                                    </div>

                                    <ul className="mt-6 space-y-3">
                                        {currentPlan.marketingBullets.map((bullet, index) => (
                                            <li key={`${currentPlan.id}-${index}`} className="flex items-center gap-2 text-sm text-[var(--text-muted)] font-medium">
                                                <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />
                                                {bullet}
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-6">
                                        <Link href="/upgrade" className="block">
                                            <Button className="w-full bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] font-bold" disabled={currentPlan.id === "pro"}>
                                                {currentPlan.id === "pro" ? "Highest plan active" : "Review paid options"}
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Compare Plans</h2>
                                <div className="grid gap-4 xl:grid-cols-3">
                                    {PLAN_ORDER.map((planId) => {
                                        const plan = PLANS[planId];
                                        const isCurrent = currentPlan.id === plan.id;
                                        const cycle = plan.id === "free" ? "yearly" : currentCycle;
                                        return (
                                            <Card key={plan.id} className={`glass-panel border ${plan.id === "pro" ? "border-[var(--primary)]" : "border-[var(--border)]"} p-5`}>
                                                <div className="space-y-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{plan.label}</p>
                                                            <h3 className="text-lg font-black text-[var(--text)] mt-2">{plan.bestFor}</h3>
                                                        </div>
                                                        {plan.badge && (
                                                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${plan.id === "pro" ? "bg-[var(--primary)] text-white" : "bg-[var(--accent-subtle)] text-[var(--primary)]"}`}>
                                                                {plan.badge}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                                        <div className="flex items-end gap-2">
                                                            <span className="text-3xl font-semibold type-mono text-[var(--text)]">{getPlanDisplayPrice(plan, cycle)}</span>
                                                            <span className="pb-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{getPlanPeriodLabel(plan, cycle)}</span>
                                                        </div>
                                                        {plan.pricing.yearly && <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">{getPlanSavingsLabel(plan)}</p>}
                                                    </div>

                                                    <ul className="space-y-2.5">
                                                        {plan.marketingBullets.map((bullet) => (
                                                            <li key={bullet} className="flex items-start gap-2.5 text-sm text-[var(--text-muted)]">
                                                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                                                                <span>{bullet}</span>
                                                            </li>
                                                        ))}
                                                    </ul>

                                                    <Link href="/upgrade" className="block">
                                                        <Button variant={isCurrent ? "outline" : "default"} className={`w-full font-bold ${isCurrent ? "" : "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"}`} disabled={isCurrent}>
                                                            {isCurrent ? "Current plan" : `Choose ${plan.label}`}
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>
                    );
                })()}

                {activeTab === "exports" && (
                    <div className="space-y-6">
                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Raw Data Backup & Restore</h2>
                            <Card className="glass-panel border-none p-5 space-y-4">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button variant="outline" className="flex-1 gap-2 text-xs h-12 font-black rounded-xl border-[var(--border)]"
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
                                        <Download className="h-4 w-4 text-[var(--primary)]" /> Download Full JSON
                                    </Button>
                                    <label className="flex-1">
                                        <div className="flex items-center justify-center gap-2 text-xs h-12 font-black border border-[var(--border)] rounded-xl px-4 cursor-pointer hover:bg-[var(--surface-2)] transition-all">
                                            <Upload className="h-4 w-4 text-[var(--blue-500)]" /> Restore JSON Array
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
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Payroll Exports</h2>
                            <Link href="/ufiling" className="block">
                                <Card className="glass-panel border-none p-5 flex items-center justify-between hover:bg-[var(--surface-2)] transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[var(--text)]">uFiling CSV Declarations</p>
                                            <p className="text-xs text-[var(--text-muted)]">Generate Department of Labour submissions</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
                                </Card>
                            </Link>
                        </section>
                    </div>
                )}

                {activeTab === "support" && (
                    <div className="space-y-6">
                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Help & Resources</h2>
                            <Card className="glass-panel border-none overflow-hidden">
                                <Link href="/help/compliance" className="flex items-center justify-between p-4 hover:bg-[var(--surface-2)] border-b border-[var(--border)] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="h-5 w-5 text-[var(--blue-500)]" />
                                        <div>
                                            <p className="text-sm font-bold">BCEA Compliance Guide</p>
                                            <p className="text-[10px] text-[var(--text-muted)]">Read the minimum wages and rules</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                                </Link>
                                <a href="mailto:support@lekkerledger.co.za" className="flex items-center justify-between p-4 hover:bg-[var(--surface-2)] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <HelpCircle className="h-5 w-5 text-[var(--primary)]" />
                                        <div>
                                            <p className="text-sm font-bold">Contact Support</p>
                                            <p className="text-[10px] text-[var(--text-muted)]">Email the LekkerLedger team</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />
                                </a>
                            </Card>
                        </section>

                        <div className="text-center pt-8 opacity-50 space-y-1">
                            <p className="type-overline">LekkerLedger v2.4.0</p>
                            <p className="text-[10px]">Made with resilience in South Africa.</p>
                        </div>
                    </div>
                )}
            </div>
        </div >
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
            className="flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-200 min-w-[80px]"
            style={{
                backgroundColor: active ? "var(--primary)" : "transparent",
                color: active ? "#ffffff" : "var(--text-muted)",
                boxShadow: active ? "var(--shadow-1)" : "none",
            }}>
            <Icon className="h-4 w-4" />{label}
        </button>
    );
}




