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
import { CustomLeaveType, EmployerSettings, Employee } from "@/lib/schema";
import { GoogleSync } from "@/components/google-sync";
import { useUI } from "@/components/theme-provider";
import { type BillingCycle, PLAN_ORDER, PLANS, getPlanPricePresentation } from "@/src/config/plans";
import { getArchiveCutoffDate, getArchiveUpgradeHref } from "@/lib/archive";
import { canUseAdvancedLeaveFeatures, canUseAutoBackup, canUseDriveSync, canUseFullHistoryExport, getUserPlan } from "../../../lib/entitlements";

type SettingsTab = "general" | "storage" | "plan" | "exports" | "support";

function SettingsContent() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = React.useState<SettingsTab>("general");
    const [appearanceOpen, setAppearanceOpen] = React.useState(false);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [saved, setSaved] = React.useState(false);
    const [wipeConfirmOpen, setWipeConfirmOpen] = React.useState(false);
    const [wipeConfirmText, setWipeConfirmText] = React.useState("");
    const [wiping, setWiping] = React.useState(false);
    const [editingLeaveTypeId, setEditingLeaveTypeId] = React.useState<string | null>(null);
    const [leaveTypeName, setLeaveTypeName] = React.useState("");
    const [leaveTypeAllowance, setLeaveTypeAllowance] = React.useState("");
    const [leaveTypePaid, setLeaveTypePaid] = React.useState(true);
    const [leaveTypeNote, setLeaveTypeNote] = React.useState("");
    const savedTimerRef = React.useRef<number | null>(null);
    const { theme, setTheme, setDensity } = useUI();

    const THEME_OPTIONS = [
        { value: "system" as const, label: "Auto", icon: Monitor },
        { value: "light" as const, label: "Light", icon: Sun },
        { value: "dark" as const, label: "Dark", icon: Moon },
    ];

    React.useEffect(() => {
        let active = true;
        async function load() {
            const [s, emps] = await Promise.all([getSettings(), getEmployees()]);
            if (!active) return;
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
        return () => {
            active = false;
            if (savedTimerRef.current) {
                window.clearTimeout(savedTimerRef.current);
            }
        };
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
        if (savedTimerRef.current) {
            window.clearTimeout(savedTimerRef.current);
        }
        savedTimerRef.current = window.setTimeout(() => {
            setSaved(false);
            savedTimerRef.current = null;
        }, 2000);
    };

    const userPlan = getUserPlan(settings);
    const advancedLeaveEnabled = canUseAdvancedLeaveFeatures(userPlan);
    const customLeaveTypes = settings?.customLeaveTypes ?? [];

    const resetLeaveTypeForm = React.useCallback(() => {
        setEditingLeaveTypeId(null);
        setLeaveTypeName("");
        setLeaveTypeAllowance("");
        setLeaveTypePaid(true);
        setLeaveTypeNote("");
    }, []);

    const startEditingLeaveType = React.useCallback((leaveType: CustomLeaveType) => {
        setEditingLeaveTypeId(leaveType.id);
        setLeaveTypeName(leaveType.name);
        setLeaveTypeAllowance(leaveType.annualAllowance === undefined ? "" : String(leaveType.annualAllowance));
        setLeaveTypePaid(leaveType.isPaid);
        setLeaveTypeNote(leaveType.note ?? "");
    }, []);

    const handleSaveLeaveType = React.useCallback(async () => {
        if (!settings || !advancedLeaveEnabled) return;

        const trimmedName = leaveTypeName.trim();
        if (!trimmedName) return;

        const now = new Date().toISOString();
        const annualAllowance = leaveTypeAllowance.trim() === "" ? undefined : Number(leaveTypeAllowance);
        const nextType: CustomLeaveType = {
            id: editingLeaveTypeId ?? crypto.randomUUID(),
            name: trimmedName.slice(0, 40),
            annualAllowance: annualAllowance !== undefined && Number.isFinite(annualAllowance) ? annualAllowance : undefined,
            isPaid: leaveTypePaid,
            note: leaveTypeNote.trim().slice(0, 200),
            createdAt: editingLeaveTypeId
                ? customLeaveTypes.find((type) => type.id === editingLeaveTypeId)?.createdAt ?? now
                : now,
            updatedAt: now,
        };

        const nextCustomLeaveTypes = editingLeaveTypeId
            ? customLeaveTypes.map((type) => (type.id === editingLeaveTypeId ? nextType : type))
            : [...customLeaveTypes, nextType];

        await handleSave({ customLeaveTypes: nextCustomLeaveTypes });
        resetLeaveTypeForm();
    }, [
        advancedLeaveEnabled,
        customLeaveTypes,
        editingLeaveTypeId,
        handleSave,
        leaveTypeAllowance,
        leaveTypeName,
        leaveTypeNote,
        leaveTypePaid,
        resetLeaveTypeForm,
        settings,
    ]);

    const handleDeleteLeaveType = React.useCallback(async (leaveTypeId: string) => {
        if (!settings || !advancedLeaveEnabled) return;
        await handleSave({ customLeaveTypes: customLeaveTypes.filter((type) => type.id !== leaveTypeId) });
        if (editingLeaveTypeId === leaveTypeId) {
            resetLeaveTypeForm();
        }
    }, [advancedLeaveEnabled, customLeaveTypes, editingLeaveTypeId, handleSave, resetLeaveTypeForm, settings]);

    if (loading || !settings) {
        return (
            <>
                <PageHeader title="Settings" subtitle="Start with your household details, then open the extra options only if you need them." />
                <CardSkeleton />
                <CardSkeleton />
            </>
        );
    }

    return (
        <div className="mx-auto w-full min-w-0 max-w-4xl pb-20">
            <PageHeader title="Settings" subtitle="Start with your household details, then open the extra options only if you need them." />

            {/* Tab switcher */}
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)]/92 p-2 shadow-[var(--shadow-1)] mb-2">
                <div className="grid grid-cols-2 gap-1 min-[520px]:grid-cols-3 xl:grid-cols-5">
                    <TabButton id="general" icon={Building2} label="Your details" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton id="storage" icon={Database} label="Storage & backup" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton id="plan" icon={ShieldCheck} label="Plan" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton id="exports" icon={Download} label="Downloads" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton id="support" icon={HelpCircle} label="Help" activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === "general" && (
                    <div className="space-y-6">
                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Basic details</h2>
                            <Card className="glass-panel border-none p-6 space-y-6 shadow-sm">
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
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">App experience</h2>
                            <Card className="glass-panel border-none p-1 overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-[var(--border)] space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--focus)]"><Smartphone className="h-4 w-4" /></div>
                                        <div>
                                            <p className="text-sm font-bold">View style</p>
                                            <p className="text-[10px] text-[var(--text-muted)]">Start with the simpler view. Open the detailed view only when you need extra context.</p>
                                        </div>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() => handleSave({ simpleMode: true, advancedMode: false })}
                                            className="rounded-2xl border p-4 text-left transition-colors"
                                            style={{
                                                borderColor: !settings.advancedMode ? "var(--primary)" : "var(--border)",
                                                backgroundColor: !settings.advancedMode ? "rgba(0,122,77,0.06)" : "var(--surface-1)",
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Smartphone className="h-4 w-4 text-[var(--primary)]" />
                                                <p className="text-sm font-bold text-[var(--text)]">Basic view</p>
                                            </div>
                                            <p className="mt-2 text-xs text-[var(--text-muted)]">Cleaner screens with the main tasks first and less extra detail.</p>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSave({ simpleMode: false, advancedMode: true })}
                                            className="rounded-2xl border p-4 text-left transition-colors"
                                            style={{
                                                borderColor: settings.advancedMode ? "var(--primary)" : "var(--border)",
                                                backgroundColor: settings.advancedMode ? "rgba(0,122,77,0.06)" : "var(--surface-1)",
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Zap className="h-4 w-4 text-[var(--primary)]" />
                                                <p className="text-sm font-bold text-[var(--text)]">Detailed view (optional)</p>
                                            </div>
                                            <p className="mt-2 text-xs text-[var(--text-muted)]">Show fuller checks, help notes, and more of the record detail when you need it.</p>
                                        </button>
                                    </div>
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

                                <div className="border-t border-[var(--border)]">
                                    <button
                                        type="button"
                                        onClick={() => setAppearanceOpen((current) => !current)}
                                        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-[var(--surface-2)]"
                                        aria-expanded={appearanceOpen}
                                    >
                                        <div>
                                            <p className="text-sm font-bold">Appearance (optional)</p>
                                            <p className="text-[10px] text-[var(--text-muted)]">Auto is the default theme.</p>
                                        </div>
                                        <ChevronRight className={`h-4 w-4 text-[var(--text-muted)] transition-transform ${appearanceOpen ? "rotate-90" : ""}`} />
                                    </button>
                                    {appearanceOpen && (
                                        <div className="flex flex-col p-4 pt-0">
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
                                    )}
                                </div>
                            </Card>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">More details</h2>
                            <Card className="glass-panel border-none p-5 space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="eid">Employer ID / Co. Reg</Label>
                                        <Input id="eid" value={settings.employerIdNumber} onChange={(e) => setSettings({ ...settings, employerIdNumber: e.target.value })} placeholder="ID Number" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="uifref">uFiling Reference</Label>
                                        <Input id="uifref" value={settings.uifRefNumber} onChange={(e) => setSettings({ ...settings, uifRefNumber: e.target.value })} placeholder="U123456...-1" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Leave types</h2>
                            {advancedLeaveEnabled ? (
                                <Card className="glass-panel border-none p-5 space-y-5">
                                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                        <p className="text-sm font-bold text-[var(--text)]">Default leave types</p>
                                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                                            {["Annual", "Sick", "Family Responsibility"].map((label) => (
                                                <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3">
                                                    <p className="text-sm font-bold text-[var(--text)]">{label}</p>
                                                    <p className="mt-1 text-xs text-[var(--text-muted)]">Default type</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 space-y-4">
                                        <div>
                                            <p className="text-sm font-bold text-[var(--text)]">{editingLeaveTypeId ? "Edit custom leave type" : "Add leave type"}</p>
                                            <p className="mt-1 text-xs text-[var(--text-muted)]">Use this for arrangements like unpaid leave, study leave, or other categories you want to track.</p>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="leave-type-name">Name</Label>
                                                <Input
                                                    id="leave-type-name"
                                                    value={leaveTypeName}
                                                    maxLength={40}
                                                    onChange={(e) => setLeaveTypeName(e.target.value)}
                                                    placeholder="e.g. Study leave"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="leave-type-allowance">Annual allowance in days (optional)</Label>
                                                <Input
                                                    id="leave-type-allowance"
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    value={leaveTypeAllowance}
                                                    onChange={(e) => setLeaveTypeAllowance(e.target.value)}
                                                    placeholder="Leave blank for unlimited"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
                                            <div>
                                                <p className="text-sm font-bold text-[var(--text)]">Paid leave</p>
                                                <p className="text-xs text-[var(--text-muted)]">This is a label for your records and any later payslip context.</p>
                                            </div>
                                            <Switch checked={leaveTypePaid} onCheckedChange={setLeaveTypePaid} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="leave-type-note">Short note (optional)</Label>
                                            <textarea
                                                id="leave-type-note"
                                                maxLength={200}
                                                value={leaveTypeNote}
                                                onChange={(e) => setLeaveTypeNote(e.target.value)}
                                                className="min-h-[110px] w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--focus)]/20"
                                                placeholder="e.g. Agreed 3 days per year for church conference"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-3 sm:flex-row">
                                            <Button
                                                onClick={() => void handleSaveLeaveType()}
                                                disabled={!leaveTypeName.trim() || saving}
                                                className="flex-1 bg-[var(--primary)] text-white font-bold"
                                            >
                                                {editingLeaveTypeId ? "Save leave type" : "Add leave type"}
                                            </Button>
                                            {editingLeaveTypeId && (
                                                <Button variant="outline" onClick={resetLeaveTypeForm} className="flex-1 font-bold">
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-sm font-bold text-[var(--text)]">Custom leave types</p>
                                        {customLeaveTypes.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)] px-4 py-6 text-sm text-[var(--text-muted)]">
                                                No custom leave types yet.
                                            </div>
                                        ) : (
                                            customLeaveTypes.map((leaveType) => (
                                                <div key={leaveType.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
                                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-bold text-[var(--text)]">{leaveType.name}</p>
                                                            <p className="text-xs text-[var(--text-muted)]">
                                                                {leaveType.annualAllowance === undefined ? "Unlimited / uncapped" : `${leaveType.annualAllowance} days per year`} · {leaveType.isPaid ? "Paid" : "Unpaid"}
                                                            </p>
                                                            {leaveType.note && (
                                                                <p className="text-xs text-[var(--text-muted)]">{leaveType.note}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => startEditingLeaveType(leaveType)} className="font-bold">
                                                                Edit
                                                            </Button>
                                                            <Button variant="outline" size="sm" onClick={() => void handleDeleteLeaveType(leaveType.id)} className="font-bold text-rose-700 border-rose-200 hover:bg-rose-50">
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </Card>
                            ) : (
                                <Card className="glass-panel border-none p-6 space-y-5 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Zap className="h-12 w-12 text-[var(--primary)]" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">Pro Feature</p>
                                        <p className="mt-2 text-xl font-black text-[var(--text)]">Custom leave types</p>
                                        <p className="mt-1 text-sm text-[var(--text-muted)] leading-relaxed">
                                            Add categories like unpaid leave, study leave, or compassionate leave, while keeping the three default types fixed.
                                        </p>
                                    </div>
                                    <Link href="/upgrade?plan=pro&pay=1" className="block relative z-10">
                                        <Button className="w-full bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] font-black h-12 shadow-lg shadow-[var(--primary)]/20 active-scale">
                                            Upgrade to Pro
                                        </Button>
                                    </Link>
                                </Card>
                            )}
                        </section>
                    </div>
                )}

                {activeTab === "storage" && (
                    <div className="space-y-6">
                        <GoogleSync
                            driveSyncAllowed={canUseDriveSync(getUserPlan(settings))}
                            autoBackupAllowed={canUseAutoBackup(getUserPlan(settings))}
                        />

                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Storage Rules</h2>
                            <Card className="glass-panel border-none p-5 space-y-4 text-sm text-[var(--text-muted)] leading-relaxed">
                                <p><strong>1. Local first:</strong> All payroll records stay on this browser or device unless you choose to connect Google.</p>
                                <p><strong>2. Google-connected backup:</strong> If enabled on a paid plan, a backup is stored in the Google Drive app data area in your own Google account so you can restore records on another browser or device.</p>
                                <p><strong>3. What LekkerLedger can access:</strong> We cannot browse your normal Google Drive files, and this backup flow does not create a central company payroll database of employee records.</p>
                                <p><strong>4. PDF generation:</strong> Payslips and contracts do not leave your device unless you explicitly share or export them.</p>
                                <p><strong>5. Do not clear browser storage without a backup:</strong> If you clear browser data or lose this device before exporting or enabling backup, your records on this device cannot be recovered.</p>
                            </Card>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Danger Zone</h2>
                            <Card className="border-rose-200 dark:border-rose-900/30 bg-rose-500/5 p-5 space-y-4">
                                <div className="space-y-2 text-sm leading-relaxed text-[var(--text-muted)]">
                                    <p className="font-bold text-rose-600">Delete records stored in this browser only.</p>
                                    <p>
                                        Export a JSON backup first. This wipe removes employer settings, employees, payslips, and other local records from this device.
                                    </p>
                                    <p>
                                        Current employees on this device: <strong className="text-[var(--text)]">{employees.length}</strong>
                                    </p>
                                </div>

                                {!wipeConfirmOpen ? (
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-between text-rose-600 hover:bg-rose-500/10 h-14 px-4 rounded-xl"
                                        onClick={() => {
                                            setWipeConfirmOpen(true);
                                            setWipeConfirmText("");
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Database className="h-4 w-4" />
                                            <span className="font-bold text-sm">Open delete confirmation</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <div className="space-y-4 rounded-2xl border border-rose-300/60 bg-white/60 p-4 dark:bg-rose-950/10">
                                        <div className="space-y-2 text-xs leading-relaxed text-[var(--text-muted)]">
                                            <p><strong className="text-[var(--text)]">Before you continue:</strong></p>
                                            <p>1. Export a JSON backup if you may need these records again.</p>
                                            <p>2. Make sure you are deleting the correct browser/device.</p>
                                            <p>3. Type <strong className="text-[var(--text)]">DELETE</strong> below to confirm.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="wipe-confirm">Type DELETE to continue</Label>
                                            <Input
                                                id="wipe-confirm"
                                                value={wipeConfirmText}
                                                onChange={(e) => setWipeConfirmText(e.target.value)}
                                                placeholder="DELETE"
                                            />
                                        </div>

                                        <div className="flex gap-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => {
                                                    setWipeConfirmOpen(false);
                                                    setWipeConfirmText("");
                                                }}
                                                disabled={wiping}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="button"
                                                className="flex-1 bg-rose-600 text-white hover:bg-rose-700"
                                                disabled={wiping || wipeConfirmText.trim().toUpperCase() !== "DELETE"}
                                                onClick={async () => {
                                                    setWiping(true);
                                                    await resetAllData();
                                                    window.location.href = "/";
                                                }}
                                            >
                                                {wiping ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete local data"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </section>
                    </div>
                )}

                {activeTab === "plan" && (() => {
                    const currentPlan = getUserPlan(settings);
                    const currentCycle = settings.billingCycle === "monthly" ? "monthly" : "yearly";
                    const displayCycle: BillingCycle = currentPlan.id === "free" ? "monthly" : currentCycle;
                    const comparisonCycle: BillingCycle = currentPlan.id === "free" ? "yearly" : currentCycle;
                    const currentPricePresentation = getPlanPricePresentation(currentPlan, displayCycle);

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
                                                <span className="text-3xl font-semibold type-mono text-[var(--text)]">{currentPricePresentation.primaryPrice}</span>
                                                {currentPricePresentation.periodLabel ? (
                                                    <span className="pb-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{currentPricePresentation.periodLabel}</span>
                                                ) : null}
                                            </div>
                                            <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">{currentPricePresentation.helperText}</p>
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
                                        <div className="space-y-2">
                                            <Link href={`/upgrade?plan=${currentPlan.id === "free" ? "standard" : "pro"}&pay=1`} className="block">
                                                <Button className="w-full bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] font-bold" disabled={currentPlan.id === "pro"}>
                                                    {currentPlan.id === "pro" ? "Highest plan active" : "Review paid options"}
                                                </Button>
                                            </Link>
                                            {currentPlan.id !== "pro" && (
                                                <p className="text-center text-[11px] font-semibold text-[var(--text-muted)]">
                                                    14-day refund. You can stop renewal before the next billing period.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Compare Plans</h2>
                                <div className="grid gap-4 xl:grid-cols-3">
                                    {PLAN_ORDER.map((planId) => {
                                        const plan = PLANS[planId];
                                        const isCurrent = currentPlan.id === plan.id;
                                        const cycle: BillingCycle = plan.id === "free" ? "monthly" : comparisonCycle;
                                        const pricePresentation = getPlanPricePresentation(plan, cycle);
                                        return (
                                            <Card key={plan.id} className={`glass-panel border ${plan.id === "standard" ? "border-[var(--primary)]" : "border-[var(--border)]"} p-5`}>
                                                <div className="space-y-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{plan.label}</p>
                                                            <h3 className="text-lg font-black text-[var(--text)] mt-2">{plan.bestFor}</h3>
                                                        </div>
                                                        {plan.badge && (
                                                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${plan.id === "standard" ? "bg-[var(--primary)] text-white" : "bg-[var(--accent-subtle)] text-[var(--primary)]"}`}>
                                                                {plan.badge}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                                        <div className="flex items-end gap-2">
                                                            <span className="text-3xl font-semibold type-mono text-[var(--text)]">{pricePresentation.primaryPrice}</span>
                                                            {pricePresentation.periodLabel ? (
                                                                <span className="pb-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{pricePresentation.periodLabel}</span>
                                                            ) : null}
                                                        </div>
                                                        <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">{pricePresentation.helperText}</p>
                                                    </div>

                                                    <ul className="space-y-2.5">
                                                        {plan.marketingBullets.map((bullet) => (
                                                            <li key={bullet} className="flex items-start gap-2.5 text-sm text-[var(--text-muted)]">
                                                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                                                                <span>{bullet}</span>
                                                            </li>
                                                        ))}
                                                    </ul>

                                                    <div className="space-y-2">
                                                        <Link href={`/upgrade?plan=${plan.id}&billing=${comparisonCycle}&pay=1`} className="block">
                                                            <Button variant={isCurrent ? "outline" : "default"} className={`w-full font-bold ${isCurrent ? "" : "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"}`} disabled={isCurrent}>
                                                                {isCurrent ? "Current plan" : `Choose ${plan.label}`}
                                                            </Button>
                                                        </Link>
                                                        {!isCurrent && plan.id !== "free" && (
                                                            <p className="text-center text-[11px] font-semibold text-[var(--text-muted)]">
                                                                14-day refund. You can stop renewal before the next billing period.
                                                            </p>
                                                        )}
                                                    </div>
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
                        {(() => {
                            const plan = getUserPlan(settings);
                            const fullHistoryExport = canUseFullHistoryExport(plan);
                            return (
                                <section className="space-y-4">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">History Export</h2>
                                    <Card className="glass-panel border-none p-5 space-y-4">
                                        <div>
                                            <p className="text-sm font-bold text-[var(--text)]">
                                                {fullHistoryExport ? "This export includes your full generated history." : `This export includes the latest ${plan.archiveMonths} months of generated records.`}
                                            </p>
                                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                Uploaded files are kept visible in the app on all plans. Pro unlocks the full generated history in one export.
                                            </p>
                                        </div>
                                        {!fullHistoryExport && (
                                            <Link href={getArchiveUpgradeHref(plan.id)} className="block">
                                                <Button variant="outline" className="w-full font-bold">
                                                    Upgrade to Pro for full-history export
                                                </Button>
                                            </Link>
                                        )}
                                    </Card>
                                </section>
                            );
                        })()}

                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Raw Data Backup & Restore</h2>
                            <Card className="glass-panel border-none p-5 space-y-4">
                                {!settings.googleSyncEnabled && (
                                    <div
                                        className="rounded-2xl border px-4 py-3 text-xs leading-relaxed"
                                        style={{
                                            borderColor: "rgba(196,122,28,0.25)",
                                            backgroundColor: "rgba(196,122,28,0.08)",
                                            color: "var(--text)",
                                        }}
                                    >
                                        Tip: Your records are stored in this browser right now. Download a JSON export regularly, or turn on backup on a paid plan before clearing browser data or changing devices.
                                    </div>
                                )}
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 text-xs leading-relaxed text-[var(--text-muted)]">
                                    <p className="font-bold text-[var(--text)]">Before you change devices</p>
                                    <ol className="mt-2 list-decimal space-y-1.5 pl-4">
                                        <li>Turn on Google backup on a paid plan, or download a JSON export first.</li>
                                        <li>On the new device, reconnect the same Google account to restore your backup.</li>
                                        <li>Do not clear browser data on this device until you have confirmed the restore worked.</li>
                                    </ol>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button variant="outline" className="flex-1 gap-2 text-xs h-12 font-black rounded-xl border-[var(--border)]"
                                        onClick={async () => {
                                            try {
                                                const plan = getUserPlan(settings);
                                                const json = await exportData({
                                                    generatedRecordsSince: canUseFullHistoryExport(plan) ? null : getArchiveCutoffDate(plan),
                                                });
                                                const blob = new Blob([json], { type: "application/json" });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement("a"); a.href = url;
                                                a.download = `lekkerledger-backup-${new Date().toISOString().split('T')[0]}.json`;
                                                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                                                URL.revokeObjectURL(url);
                                            } catch { alert("Export failed."); }
                                        }}>
                                        <Download className="h-4 w-4 text-[var(--primary)]" /> {canUseFullHistoryExport(getUserPlan(settings)) ? "Export all records" : "Download JSON export"}
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
                                            <p className="text-sm font-bold">Household checklist</p>
                                            <p className="text-[10px] text-[var(--text-muted)]">Monthly and annual tasks, with plain-language checks</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                                </Link>
                                <a href="mailto:support@lekkerledger.co.za" className="flex items-center justify-between p-4 hover:bg-[var(--surface-2)] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <HelpCircle className="h-5 w-5 text-[var(--primary)]" />
                                        <div>
                                            <p className="text-sm font-bold">Contact Support</p>
                                            <p className="text-[10px] text-[var(--text-muted)]">Email the LekkerLedger team. Reply within 1-4 business days.</p>
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
                <PageHeader title="Settings" subtitle="Start with your household details, then open the extra options only if you need them." />
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
            data-testid={`settings-tab-${id}`}
            className="flex min-h-[76px] w-full flex-col items-center justify-center gap-2 rounded-[1.5rem] px-3 py-3 text-[11px] font-black uppercase tracking-[0.12em] transition-all duration-200"
            style={{
                backgroundColor: active ? "var(--primary)" : "transparent",
                color: active ? "#ffffff" : "var(--text-muted)",
                boxShadow: active ? "var(--shadow-1)" : "none",
            }}>
            <Icon className="h-4 w-4" />{label}
        </button>
    );
}









