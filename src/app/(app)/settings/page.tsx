"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    FileText, BookOpen, ArrowRight, Upload,
    ChevronRight, Building2, Save, Database, Loader2, Zap,
    AlignVerticalJustifyCenter, Moon, Sun, Monitor,
    ShieldCheck, Download, HelpCircle, Copy, Gift, Clock3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { PlanFeatureList } from "@/components/marketing/pricing";
import { getSettings, saveSettings, resetAllData, exportData, importData, getEmployees } from "@/lib/storage";
import { CustomLeaveType, EmployerSettings, Employee } from "@/lib/schema";
import { cancelSubscriptionRenewal, fetchBillingAccount, type BillingAccountPayload } from "@/lib/billing-client";
import { useUI } from "@/components/theme-provider";
import { InlinePlanCheckoutButton } from "@/components/billing/inline-paid-plan-checkout";
import { REFUND_WINDOW_DAYS, type BillingCycle, PLAN_ORDER, PLANS } from "@/src/config/plans";
import { getMarketingPlanDisplay, getMarketingPriceDisplay } from "@/src/config/pricing-display";
import { getArchiveCutoffDate, getArchiveUpgradeHref } from "@/lib/archive";
import { applyVerifiedEntitlementsToSettings, canUseAdvancedLeaveFeatures, canUseFullHistoryExport, getUserPlan } from "@/lib/entitlements";
import { useAppMode } from "@/lib/app-mode";
import { useAppConnectivity } from "@/app/hooks/use-app-connectivity";
import { createClient } from "@/lib/supabase/client";
import { buildRecoverableSetupArtifacts, sendRecoverableSetupRequest } from "@/lib/recoverable-account";
import { generateAccountMasterKey } from "@/lib/crypto";
import { saveLocalRecoveryProfile } from "@/lib/recovery-profile-store";
import { syncEngine } from "@/lib/sync-engine";
import { syncService } from "@/lib/sync-service";
import { getActiveSyncSummary, getEncryptionModeLabel, getLockedDeviceSummary, getSettingsSummary } from "@/lib/encryption-mode";
import { storeRecoveryNotice } from "@/lib/recovery-notice";

type SettingsTab = "general" | "storage" | "plan" | "exports" | "support";

function SettingsContent() {
    const searchParams = useSearchParams();
    const { mode, encryptionMode, setEncryptionMode } = useAppMode();
    const { network, sync, syncErrorMessage } = useAppConnectivity();
    const [activeTab, setActiveTab] = React.useState<SettingsTab>("general");
    const [appearanceOpen, setAppearanceOpen] = React.useState(false);
    const [settings, setSettings] = React.useState<EmployerSettings | null>(null);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [saved, setSaved] = React.useState(false);
    const [billingAccount, setBillingAccount] = React.useState<BillingAccountPayload | null>(null);
    const [billingLoading, setBillingLoading] = React.useState(true);
    const [cancelingRenewal, setCancelingRenewal] = React.useState(false);
    const [downgradingTo, setDowngradingTo] = React.useState<string | null>(null);
    const [wipeConfirmOpen, setWipeConfirmOpen] = React.useState(false);
    const [wipeConfirmText, setWipeConfirmText] = React.useState("");
    const [wiping, setWiping] = React.useState(false);
    const [editingLeaveTypeId, setEditingLeaveTypeId] = React.useState<string | null>(null);
    const [leaveTypeName, setLeaveTypeName] = React.useState("");
    const [leaveTypeAllowance, setLeaveTypeAllowance] = React.useState("");
    const [leaveTypePaid, setLeaveTypePaid] = React.useState(true);
    const [leaveTypeNote, setLeaveTypeNote] = React.useState("");
    const [leaveTypeError, setLeaveTypeError] = React.useState("");
    const [migrationPassword, setMigrationPassword] = React.useState("");
    const [migrationError, setMigrationError] = React.useState<string | null>(null);
    const [isMigratingEncryption, setIsMigratingEncryption] = React.useState(false);
    const savedTimerRef = React.useRef<number | null>(null);
    const { toast } = useToast();
    const { theme, setTheme, setDensity } = useUI();
    const supabase = React.useMemo(() => createClient(), []);

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

            try {
                const account = await fetchBillingAccount();
                if (!active) return;
                setBillingAccount(account);
            } catch (error) {
                console.warn("Could not load billing account", error);
            } finally {
                if (active) {
                    setBillingLoading(false);
                }
            }
        }
        load();
        return () => {
            active = false;
            if (savedTimerRef.current) {
                globalThis.clearTimeout(savedTimerRef.current);
            }
        };
    }, [searchParams]);

    const handleSave = React.useCallback(async (updated: Partial<EmployerSettings>) => {
        if (!settings || saving) return;
        setSaving(true);
        try {
            const newSettings = {
                ...settings,
                ...updated,
                employerName: (updated.employerName ?? settings.employerName ?? "").trim(),
                employerAddress: (updated.employerAddress ?? settings.employerAddress ?? "").trim(),
                phone: (updated.phone ?? settings.phone ?? "").trim(),
                employerEmail: (updated.employerEmail ?? settings.employerEmail ?? "").trim(),
            };
            if (updated.density) setDensity(updated.density);
            globalThis.dispatchEvent(new Event("storage"));
            globalThis.dispatchEvent(new Event("local-storage-sync"));
            setSettings(newSettings);
            await saveSettings(newSettings);
            setSaved(true);
            if (savedTimerRef.current) {
                globalThis.clearTimeout(savedTimerRef.current);
            }
            savedTimerRef.current = globalThis.setTimeout(() => {
                setSaved(false);
                savedTimerRef.current = null;
            }, 2000) as unknown as number;
            toast("Settings saved successfully!", "success");
        } catch (error) {
            console.error("Failed to save settings", error);
            toast(error instanceof Error ? error.message : "Could not save settings just now.", "error");
        } finally {
            setSaving(false);
        }
    }, [saving, setDensity, settings, toast]);

    const effectiveSettings = React.useMemo(
        () => applyVerifiedEntitlementsToSettings(settings, billingAccount?.entitlements) ?? settings,
        [billingAccount?.entitlements, settings],
    );
    const userPlan = getUserPlan(effectiveSettings);
    const advancedLeaveEnabled = canUseAdvancedLeaveFeatures(userPlan);
    const customLeaveTypes = React.useMemo(() => settings?.customLeaveTypes ?? [], [settings?.customLeaveTypes]);
    const nextChargeLabel = billingAccount?.account.nextChargeAt ? new Date(billingAccount.account.nextChargeAt).toLocaleDateString("en-ZA") : null;
    const billingStatus = billingAccount?.entitlements.status;
    const referralCode = billingAccount?.account.referralCode || "";

    const resetLeaveTypeForm = React.useCallback(() => {
        setEditingLeaveTypeId(null);
        setLeaveTypeName("");
        setLeaveTypeAllowance("");
        setLeaveTypePaid(true);
        setLeaveTypeNote("");
        setLeaveTypeError("");
    }, []);

    const handleCopyReferralCode = React.useCallback(async () => {
        if (!referralCode) return;
        try {
            await navigator.clipboard.writeText(referralCode);
            toast("Referral code copied.", "success");
        } catch {
            toast("Could not copy the referral code just now.", "error");
        }
    }, [referralCode, toast]);

    const handleCancelRenewal = React.useCallback(async () => {
        if (cancelingRenewal) return;
        setCancelingRenewal(true);
        try {
            const updated = await cancelSubscriptionRenewal();
            setBillingAccount(updated);
            toast("Renewal canceled. Access stays on until your current end date.", "success");
        } catch (error) {
            toast(error instanceof Error ? error.message : "Renewal could not be canceled.", "error");
        } finally {
            setCancelingRenewal(false);
        }
    }, [cancelingRenewal, toast]);

    const handleMigrateToRecoverable = React.useCallback(async () => {
        if (isMigratingEncryption) return;

        const password = migrationPassword.trim();
        if (!password) {
            setMigrationError("Enter your current password before switching this account.");
            return;
        }

        setMigrationError(null);
        setIsMigratingEncryption(true);

        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) {
                throw new Error("Please sign in again before changing the encryption mode.");
            }

            const masterKey = await generateAccountMasterKey();
            const artifacts = await buildRecoverableSetupArtifacts(masterKey, password);

            syncEngine.setCryptoKey(masterKey);
            syncService.init(user.id, masterKey);
            await syncEngine.runMigration();

            await sendRecoverableSetupRequest({
                rawMasterKey: artifacts.rawMasterKey,
                validationPayload: artifacts.validationPayload,
                wrappedMasterKeyUser: artifacts.wrappedMasterKeyUser,
                source: "migration",
            });

            await saveLocalRecoveryProfile(user.id, {
                encryptionMode: "recoverable",
                keySetupComplete: true,
                validationPayload: artifacts.validationPayload,
                cachedMasterKey: artifacts.cachedMasterKey,
                updatedAt: new Date().toISOString(),
            });

            setEncryptionMode("recoverable");
            setMigrationPassword("");
            storeRecoveryNotice("recoverable");
            toast("This account now uses Recoverable Encryption.", "success");
        } catch (migrationError) {
            console.error("Migration to Recoverable Encryption failed.", migrationError);
            setMigrationError(migrationError instanceof Error ? migrationError.message : "The encryption mode could not be changed just now.");
            toast("The encryption mode could not be changed just now.", "error");
        } finally {
            setIsMigratingEncryption(false);
        }
    }, [isMigratingEncryption, migrationPassword, setEncryptionMode, supabase, toast]);

    const startEditingLeaveType = React.useCallback((leaveType: CustomLeaveType) => {
        setEditingLeaveTypeId(leaveType.id);
        setLeaveTypeName(leaveType.name);
        setLeaveTypeAllowance(leaveType.annualAllowance === undefined ? "" : String(leaveType.annualAllowance));
        setLeaveTypePaid(leaveType.isPaid);
        setLeaveTypeNote(leaveType.note ?? "");
        setLeaveTypeError("");
    }, []);

    const handleSaveLeaveType = React.useCallback(async () => {
        if (!settings || !advancedLeaveEnabled) return;

        const trimmedName = leaveTypeName.trim();
        if (trimmedName.length < 2) {
            setLeaveTypeError("Use at least 2 characters so the leave type is clear in payroll.");
            return;
        }
        setLeaveTypeError("");

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
            <div className="mb-2 rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)]/92 p-2 shadow-[var(--shadow-sm)]">
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
                                <div className="space-y-2">
                                    <Label htmlFor="eemail">Employer Email</Label>
                                    <Input id="eemail" type="email" value={settings.employerEmail} onChange={(e) => setSettings({ ...settings, employerEmail: e.target.value })} placeholder="e.g. sarah@example.com" />
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
                                <div className="flex items-center justify-between p-4 hover:bg-[var(--surface-2)] transition-colors border-b border-[var(--border)]">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--info-soft)] text-[var(--info)]"><AlignVerticalJustifyCenter className="h-4 w-4" /></div>
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
                                                    onChange={(e) => {
                                                        setLeaveTypeName(e.target.value);
                                                        if (leaveTypeError) {
                                                            setLeaveTypeError("");
                                                        }
                                                    }}
                                                    placeholder="e.g. Study leave"
                                                />
                                                {leaveTypeError ? (
                                                    <p className="text-xs font-medium text-[var(--danger)]">{leaveTypeError}</p>
                                                ) : (
                                                    <p className="text-xs text-[var(--text-muted)]">Use a short clear label like Study leave or Unpaid leave.</p>
                                                )}
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
                                                onClick={() => { handleSaveLeaveType().catch(console.error); }}
                                                disabled={leaveTypeName.trim().length < 2 || saving}
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
                                                                {(() => {
                                                                    const allowance = leaveType.annualAllowance === undefined ? "Unlimited / uncapped" : `${leaveType.annualAllowance} days per year`;
                                                                    const payment = leaveType.isPaid ? "Paid" : "Unpaid";
                                                                    return `${allowance} · ${payment}`;
                                                                })()}
                                                            </p>
                                                            {leaveType.note && (
                                                                <p className="text-xs text-[var(--text-muted)]">{leaveType.note}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => startEditingLeaveType(leaveType)} className="font-bold">
                                                                Edit
                                                            </Button>
                                                            <Button variant="outline" size="sm" onClick={() => { handleDeleteLeaveType(leaveType.id); }} className="font-bold text-[var(--danger)]" style={{ borderColor: "var(--danger-border)", backgroundColor: "transparent" }}>
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
                                    <InlinePlanCheckoutButton
                                        planId="pro"
                                        billingCycle={settings.billingCycle === "monthly" ? "monthly" : "yearly"}
                                        className="w-full bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] font-black h-12 shadow-lg shadow-[var(--primary)]/20 active-scale relative z-10"
                                    >
                                        Upgrade to Pro
                                    </InlinePlanCheckoutButton>
                                </Card>
                            )}
                        </section>
                    </div>
                )}

                {activeTab === "storage" && (
                    <div className="space-y-6">
                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Encrypted Sync</h2>
                            <Card className="glass-panel border-none p-5 space-y-3 text-sm text-[var(--text-muted)] leading-relaxed">
                                {(() => {
                                    if (mode === "account_unlocked") {
                                        if (sync === "error") {
                                            return (
                                                <>
                                                    <div className="flex items-center gap-2 text-[var(--danger)]">
                                                        <ShieldCheck className="h-4 w-4" />
                                                        <p className="font-bold text-[var(--text)]">Sync Needs Attention</p>
                                                    </div>
                                                    <p>The account is connected, but the latest encrypted backup ran into a problem.</p>
                                                    {syncErrorMessage ? (
                                                        <div
                                                            className="rounded-2xl border px-4 py-3 text-xs leading-relaxed"
                                                            style={{
                                                                borderColor: "rgba(180,35,24,0.22)",
                                                                backgroundColor: "rgba(180,35,24,0.08)",
                                                                color: "var(--text)",
                                                            }}
                                                        >
                                                            <p className="font-bold text-[var(--danger)]">Latest sync issue</p>
                                                            <p className="mt-1">{syncErrorMessage}</p>
                                                        </div>
                                                    ) : null}
                                                </>
                                            );
                                        }

                                        if (sync === "reconnecting") {
                                            const reconnectingMessage = network === "online"
                                                ? "Cloud backup is reconnecting now. This usually clears on its own."
                                                : "This device is offline right now. Cloud backup will continue when the connection returns.";

                                            return (
                                                <>
                                                    <div className="flex items-center gap-2 text-[var(--warning)]">
                                                        <div className="h-2 w-2 rounded-full bg-[var(--warning)] animate-pulse" />
                                                        <p className="font-bold text-[var(--text)]">Sync Reconnecting</p>
                                                    </div>
                                                    <p>{reconnectingMessage}</p>
                                                </>
                                            );
                                        }

                                        return (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-[var(--primary)] animate-pulse" />
                                                    <p className="font-bold text-[var(--text)]">{encryptionMode ? getEncryptionModeLabel(encryptionMode) : "Cloud Sync Active"}</p>
                                                </div>
                                                <p>
                                                    {getActiveSyncSummary(encryptionMode)}
                                                </p>
                                            </>
                                        );
                                    }

                                    if (mode === "account_locked") {
                                        return (
                                            <>
                                                    <div className="flex items-center gap-2 text-[var(--warning)]">
                                                        <ShieldCheck className="h-4 w-4" />
                                                        <p className="font-bold text-[var(--text)]">Sync Paused</p>
                                                    </div>
                                                <p>
                                                    {getLockedDeviceSummary(encryptionMode)}
                                                </p>
                                            </>
                                        );
                                    }

                                    return (
                                        <>
                                            <p className="font-bold text-[var(--text)]">Secure Cloud Sync</p>
                                            <p>Paid plans unlock encrypted cloud backup and restore. New accounts can choose Recoverable Encryption or Maximum Privacy during secure setup.</p>
                                            {userPlan.id === "free" && (
                                                <Link href="/pricing" className="inline-flex items-center font-bold text-[var(--primary)] hover:underline">
                                                    Upgrade to enable sync <ArrowRight className="ml-1 h-3 w-3" />
                                                </Link>
                                            )}
                                        </>
                                    );
                                })()}
                            </Card>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Storage Rules</h2>
                            <Card className="glass-panel border-none p-5 space-y-4 text-sm text-[var(--text-muted)] leading-relaxed">
                                <p><strong>1. Cloud-secured:</strong> All payroll records are stored in end-to-end encrypted cloud storage. Data is encrypted on this device before upload.</p>
                                <p>
                                    <strong>2. Current mode:</strong> {encryptionMode ? `${getEncryptionModeLabel(encryptionMode)} - ${getSettingsSummary(encryptionMode)}.` : "Choose an encryption mode during secure setup."}
                                </p>
                                <p><strong>3. PDF generation:</strong> Payslips and contracts are generated on-device. They are not shared unless you explicitly export or download them.</p>
                                <p><strong>4. Sign-out cleanup:</strong> When you sign out, all data is cleared from this device. Your records remain available in encrypted cloud storage.</p>
                                
                            </Card>
                        </section>

                        {mode === "account_unlocked" && encryptionMode === "maximum_privacy" ? (
                            <section className="space-y-4">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Switch to Recoverable Encryption</h2>
                                <Card className="glass-panel border-none p-5 space-y-4 text-sm leading-relaxed text-[var(--text-muted)]">
                                    <div className="space-y-2">
                                        <p className="font-bold text-[var(--text)]">Change this account to Recoverable Encryption</p>
                                        <p>
                                            This keeps your records encrypted before upload, but changes how recovery works. This step re-encrypts your cloud-stored records using the new recovery mode.
                                        </p>
                                        <p className="text-xs font-semibold text-[var(--text)]">
                                            Keep this tab open until the switch finishes.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="migration-password">Current password</Label>
                                        <Input
                                            id="migration-password"
                                            type="password"
                                            value={migrationPassword}
                                            onChange={(event) => {
                                                setMigrationPassword(event.target.value);
                                                if (migrationError) {
                                                    setMigrationError(null);
                                                }
                                            }}
                                            placeholder="Enter your password"
                                        />
                                        {migrationError ? (
                                            <p className="text-xs font-medium text-[var(--danger)]">{migrationError}</p>
                                        ) : (
                                            <p className="text-xs text-[var(--text-muted)]">
                                                Existing Maximum Privacy users stay on their current setup unless they switch here deliberately.
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        onClick={handleMigrateToRecoverable}
                                        disabled={isMigratingEncryption || !migrationPassword.trim()}
                                        className="w-full bg-[var(--primary)] text-white font-bold"
                                    >
                                        {isMigratingEncryption ? "Switching..." : "Switch to Recoverable Encryption"}
                                    </Button>
                                </Card>
                            </section>
                        ) : null}

                        <section className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Danger Zone</h2>
                            <Card className="p-5 space-y-4" style={{ borderColor: "var(--danger-border)", backgroundColor: "var(--danger-soft)" }}>
                                <div className="space-y-2 text-sm leading-relaxed text-[var(--text-muted)]">
                                    <p className="font-bold text-[var(--danger)]">Delete all records from cloud storage.</p>
                                    <p>
                                        Export a JSON backup first. This permanently removes employer settings, employees, payslips, and other records from your account.
                                    </p>
                                    <p>
                                        Current employees: <strong className="text-[var(--text)]">{employees.length}</strong>
                                    </p>
                                </div>

                                {!wipeConfirmOpen ? (
                                    <Button
                                        variant="ghost"
                                        className="h-14 w-full justify-between rounded-xl px-4"
                                        style={{ color: "var(--danger)", backgroundColor: "transparent" }}
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
                                    <div className="space-y-4 rounded-2xl border p-4" style={{ borderColor: "var(--danger-border)", backgroundColor: "var(--surface-1)" }}>
                                        <div className="space-y-2 text-xs leading-relaxed text-[var(--text-muted)]">
                                            <p><strong className="text-[var(--text)]">Before you continue:</strong></p>
                                            <p>1. Export a JSON backup if you may need these records again.</p>
                                            <p>2. This deletes records from cloud storage and this device.</p>
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
                                                className="flex-1 bg-[var(--danger)] text-white hover:brightness-95"
                                                disabled={wiping || wipeConfirmText.trim().toUpperCase() !== "DELETE"}
                                                onClick={async () => {
                                                    setWiping(true);
                                                    await resetAllData();
                                                    globalThis.location.href = "/";
                                                }}
                                            >
                                                {wiping ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete all records"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </section>
                    </div>
                )}

                {activeTab === "plan" && (() => {
                    const currentPlan = getUserPlan(effectiveSettings);
                    const currentCycle = effectiveSettings?.billingCycle === "monthly" ? "monthly" : "yearly";
                    const displayCycle: BillingCycle = currentPlan.id === "free" ? "monthly" : currentCycle;
                    const comparisonCycle: BillingCycle = currentPlan.id === "free" ? "yearly" : currentCycle;
                    const currentPlanDisplay = getMarketingPlanDisplay(currentPlan.id);
                    const currentPricePresentation = getMarketingPriceDisplay(currentPlan.id, displayCycle);
                    const currentPlanStatusLabel = (() => {
                        if (currentPlan.id === "free") return "Free plan active";
                        if (billingAccount?.account.cancelAtPeriodEnd && effectiveSettings?.paidUntil) {
                            return `Renewal canceled. Access ends ${new Date(effectiveSettings.paidUntil).toLocaleDateString("en-ZA")}`;
                        }
                        if (nextChargeLabel) return `Next renewal ${nextChargeLabel}`;
                        if (effectiveSettings?.paidUntil) {
                            return `Access until ${new Date(effectiveSettings.paidUntil).toLocaleDateString("en-ZA")}`;
                        }
                        return "Paid plan active";
                    })();
                    let billingTimingContent: React.ReactNode;
                    if (billingLoading) {
                        billingTimingContent = (
                            <p className="text-sm text-[var(--text-muted)]">Loading billing details...</p>
                        );
                    } else if (billingAccount) {
                        billingTimingContent = (
                            <div className="space-y-3 text-sm text-[var(--text-muted)]">
                                <p>
                                    <strong className="text-[var(--text)]">Status:</strong>{" "}
                                    {(() => {
                                         if (billingAccount.account.cancelAtPeriodEnd) return "Renewal canceled";
                                         if (billingStatus === "active") return "Paid subscription active";
                                         return "Free plan";
                                     })()}
                                </p>
                                {nextChargeLabel && (
                                    <p><strong className="text-[var(--text)]">Next renewal:</strong> {nextChargeLabel}</p>
                                )}
                                {billingAccount.account.lastError && (
                                    <p className="rounded-2xl border px-4 py-3 text-[var(--warning)]" style={{ borderColor: "var(--warning-border)", backgroundColor: "var(--warning-soft)" }}>
                                        {billingAccount.account.lastError}
                                    </p>
                                )}
                                {!billingAccount.account.cancelAtPeriodEnd && billingAccount.entitlements.planId !== "free" && (
                                    <Button
                                        variant="outline"
                                        className="w-full font-bold"
                                        disabled={cancelingRenewal}
                                        onClick={() => { handleCancelRenewal().catch(console.error); }}
                                    >
                                        {cancelingRenewal ? "Canceling renewal..." : "Cancel renewal"}
                                    </Button>
                                )}
                            </div>
                        );
                    } else {
                        billingTimingContent = (
                            <p className="text-sm text-[var(--text-muted)]">
                                Sign in to see your saved payment and renewal details here.
                            </p>
                        );
                    }

                    let referralProgramContent: React.ReactNode;
                    if (billingLoading) {
                        referralProgramContent = (
                            <p className="text-sm text-[var(--text-muted)]">Loading referral details...</p>
                        );
                    } else if (billingAccount) {
                        referralProgramContent = (
                            <div className="space-y-3 text-sm text-[var(--text-muted)]">
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Your code</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-lg font-black tracking-[0.18em] text-[var(--text)]">{referralCode || "Sign in to load code"}</span>
                                        {referralCode && (
                                            <Button variant="outline" className="h-9 px-3 font-bold" onClick={() => { handleCopyReferralCode().catch(console.error); }}>
                                                <Copy className="mr-2 h-4 w-4" /> Copy
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <p><strong className="text-[var(--text)]">Available free months:</strong> {billingAccount.account.availableReferralMonths}</p>
                                <p><strong className="text-[var(--text)]">Pending referral months:</strong> {billingAccount.account.pendingReferralMonths}</p>
                                <p><strong className="text-[var(--text)]">Successful referrals:</strong> {billingAccount.account.successfulReferralCount}</p>
                            </div>
                        );
                    } else {
                        referralProgramContent = (
                            <p className="text-sm text-[var(--text-muted)]">
                                Sign in to get a referral code and track earned free months.
                            </p>
                        );
                    }

                    return (
                        <div className="space-y-6">
                            <section className="space-y-4">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Current Plan</h2>
                                <Card className="border-[var(--primary)] border-2 glass-panel p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-[var(--primary)]/5 blur-2xl pointer-events-none" />

                                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                                        <div className="space-y-2">
                                            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{currentPlan.label}</p>
                                            <h3 className="type-h3 text-[var(--text)]">{currentPlanDisplay.headline}</h3>
                                            <p className="text-sm text-[var(--text-muted)] max-w-2xl">{currentPlanDisplay.subtitle}</p>
                                            <p className="text-xs font-bold text-[var(--primary-hover)] uppercase tracking-wider">
                                                {currentPlanStatusLabel}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 lg:min-w-[220px]">
                                            <div className="flex items-end gap-2">
                                                <span className="text-3xl font-semibold type-mono text-[var(--text)]">{currentPricePresentation.primary}</span>
                                                {currentPricePresentation.periodLabel ? (
                                                    <span className="pb-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{currentPricePresentation.periodLabel}</span>
                                                ) : null}
                                            </div>
                                            <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">{currentPricePresentation.helperText}</p>
                                        </div>
                                    </div>

                                    <PlanFeatureList planId={currentPlan.id} className="mt-6" />

                                    <div className="mt-6">
                                        <div className="space-y-2">
                                            {currentPlan.id === "pro" ? (
                                                <Button className="w-full bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] font-bold" disabled>
                                                    Highest plan active
                                                </Button>
                                            ) : (
                                                <InlinePlanCheckoutButton
                                                    planId={currentPlan.id === "free" ? "standard" : "pro"}
                                                    billingCycle={displayCycle}
                                                    className="w-full bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] font-bold"
                                                >
                                                    {currentPlan.id === "free" ? "Upgrade to Standard" : "Change paid plan"}
                                                </InlinePlanCheckoutButton>
                                            )}
                                            {currentPlan.id !== "pro" && (
                                                <p className="text-center text-[11px] font-semibold text-[var(--text-muted)]">
                                                    Paid plans start immediately and still include a {REFUND_WINDOW_DAYS}-day refund window.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </section>

                            <section className="grid gap-4 lg:grid-cols-2">
                                <Card className="glass-panel border-none p-5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-2xl bg-[var(--primary)]/10 p-3 text-[var(--primary)]">
                                            <Clock3 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Billing timing</p>
                                            <h3 className="text-lg font-black text-[var(--text)]">Know the next charge date</h3>
                                        </div>
                                    </div>
                                    {billingTimingContent}
                                </Card>

                                <Card className="glass-panel border-none p-5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-2xl bg-[var(--primary)]/10 p-3 text-[var(--primary)]">
                                            <Gift className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Referral program</p>
                                            <h3 className="text-lg font-black text-[var(--text)]">Earn 1 free month per successful referral</h3>
                                        </div>
                                    </div>
                                    {referralProgramContent}
                                </Card>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] px-1">Compare Plans</h2>
                                {downgradingTo && (
                                    <div className="space-y-4 rounded-2xl border p-5" style={{ borderColor: "var(--warning-border)", backgroundColor: "var(--warning-soft)" }}>
                                        <div className="space-y-2">
                                            <p className="font-bold text-[var(--text)]">
                                                Downgrade to {PLANS[downgradingTo as keyof typeof PLANS]?.label ?? downgradingTo}?
                                            </p>
                                            <p className="text-sm text-[var(--warning)]">
                                                This cancels your {currentPlan.label} renewal. You keep {currentPlan.label} access until your current billing period ends
                                                {(() => {
                                                    if (nextChargeLabel) return ` (${nextChargeLabel})`;
                                                    if (effectiveSettings?.paidUntil) return ` (${new Date(effectiveSettings.paidUntil).toLocaleDateString("en-ZA")})`;
                                                    return "";
                                                })()}, then move to the Free plan.
                                            </p>
                                            {downgradingTo !== "free" && (
                                                <p className="text-sm text-[var(--warning)]">
                                                    After your {currentPlan.label} access ends you can choose {PLANS[downgradingTo as keyof typeof PLANS]?.label} again from pricing.
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-3">
                                            <Button variant="outline" onClick={() => setDowngradingTo(null)} disabled={cancelingRenewal} className="flex-1">
                                                Keep {currentPlan.label}
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    handleCancelRenewal().then(() => setDowngradingTo(null)).catch(() => undefined);
                                                }}
                                                disabled={cancelingRenewal}
                                                className="flex-1 bg-[var(--warning)] text-white hover:brightness-95 font-bold"
                                            >
                                                {cancelingRenewal ? "Canceling..." : "Confirm downgrade"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                <div className="grid gap-4 xl:grid-cols-3">
                                    {PLAN_ORDER.map((planId) => {
                                        const plan = PLANS[planId];
                                        const planDisplay = getMarketingPlanDisplay(planId);
                                        const isCurrent = currentPlan.id === plan.id;
                                        const planRank = { free: 0, standard: 1, pro: 2 } as Record<string, number>;
                                        const isDowngrade = !isCurrent && planRank[planId] < (planRank[currentPlan.id] ?? 0);
                                        const isUpgrade = !isCurrent && planRank[planId] > (planRank[currentPlan.id] ?? 0);
                                        const cycle: BillingCycle = plan.id === "free" ? "monthly" : comparisonCycle;
                                        const pricePresentation = getMarketingPriceDisplay(planId, cycle);
                                        let planAction: React.ReactNode = (
                                            <Button variant="outline" className="w-full font-bold" disabled>
                                                Current plan
                                            </Button>
                                        );

                                        if (isDowngrade) {
                                            planAction = (
                                                <Button
                                                    variant="outline"
                                                    className="w-full font-bold"
                                                    onClick={() => setDowngradingTo(plan.id)}
                                                >
                                                    Downgrade
                                                </Button>
                                            );
                                        } else if (isUpgrade) {
                                            planAction = (
                                                <InlinePlanCheckoutButton
                                                    planId={plan.id as "standard" | "pro"}
                                                    billingCycle={comparisonCycle}
                                                    className="w-full font-bold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                                                >
                                                    Upgrade
                                                </InlinePlanCheckoutButton>
                                            );
                                        }
                                        return (
                                            <Card key={plan.id} className={`glass-panel border ${plan.id === "standard" ? "border-[var(--primary)]" : "border-[var(--border)]"} p-5`}>
                                                <div className="space-y-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{plan.label}</p>
                                                            <h3 className="text-lg font-black text-[var(--text)] mt-2">{planDisplay.headline}</h3>
                                                        </div>
                                                        {plan.badge && (
                                                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${plan.id === "standard" ? "bg-[var(--primary)] text-white" : "bg-[var(--accent-subtle)] text-[var(--primary)]"}`}>
                                                                {plan.badge}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                                        <div className="flex items-end gap-2">
                                                            <span className="text-3xl font-semibold type-mono text-[var(--text)]">{pricePresentation.primary}</span>
                                                            {pricePresentation.periodLabel ? (
                                                                <span className="pb-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">{pricePresentation.periodLabel}</span>
                                                            ) : null}
                                                        </div>
                                                        <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">{pricePresentation.helperText}</p>
                                                        </div>

                                                    <p className="text-sm leading-6 text-[var(--text-muted)]">{planDisplay.subtitle}</p>

                                                    <PlanFeatureList planId={planId} />

                                                    <div className="space-y-2">
                                                        {planAction}
                                                        {isUpgrade && (
                                                            <p className="text-center text-[11px] font-semibold text-[var(--text-muted)]">
                                                                You can request a refund within {REFUND_WINDOW_DAYS} days if the upgrade is not the right fit.
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
                            const plan = getUserPlan(effectiveSettings);
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
                                {/* Tip for sync status */}
                                {(
                                    <div
                                        className="rounded-2xl border px-4 py-3 text-xs leading-relaxed"
                                        style={{
                                            borderColor: "rgba(196,122,28,0.25)",
                                            backgroundColor: "rgba(196,122,28,0.08)",
                                            color: "var(--text)",
                                        }}
                                    >
                                        Tip: Your records are cloud-secured. Sign in on any device to access them. Sign out clears all data from this device.
                                    </div>
                                )}
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 text-xs leading-relaxed text-[var(--text-muted)]">
                                    <p className="font-bold text-[var(--text)]">Switching devices</p>
                                    <ol className="mt-2 list-decimal space-y-1.5 pl-4">
                                        <li>Your records are stored in encrypted cloud storage.</li>
                                        <li>On the new device, sign in with the same account to access your records.</li>
                                        <li>You can also download a JSON export as an additional backup.</li>
                                    </ol>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button variant="outline" className="flex-1 gap-2 text-xs h-12 font-black rounded-xl border-[var(--border)]"
                                        onClick={async () => {
                                            try {
                                                const plan = getUserPlan(effectiveSettings);
                                                const json = await exportData({
                                                    generatedRecordsSince: canUseFullHistoryExport(plan) ? null : getArchiveCutoffDate(plan),
                                                });
                                                const blob = new Blob([json], { type: "application/json" });
                                                const url = URL.createObjectURL(blob);
                                                const link = globalThis.document.createElement("a");
                                                link.href = url;
                                                link.download = `lekker-ledger-backup-${new Date().toISOString().split("T")[0]}.json`;
                                                globalThis.document.body.appendChild(link);
                                                link.click();
                                                link.remove();
                                                URL.revokeObjectURL(url);
                                            } catch { alert("Export failed."); }
                                        }}>
                                        <Download className="h-4 w-4 text-[var(--primary)]" /> {canUseFullHistoryExport(getUserPlan(effectiveSettings)) ? "Export all records" : "Download JSON export"}
                                    </Button>
                                    <label className="flex-1">
                                        <div className="flex items-center justify-center gap-2 text-xs h-12 font-black border border-[var(--border)] rounded-xl px-4 cursor-pointer hover:bg-[var(--surface-2)] transition-all">
                                            <Upload className="h-4 w-4 text-[var(--info)]" /> Restore JSON Array
                                        </div>
                                        <input type="file" className="sr-only" accept=".json"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                if (!confirm("This will replace ALL your current data. Are you sure?")) return;
                                                try {
                                                    const text = await file.text();
                                                    const res = await importData(text);
                                                    if (res.success) {
                                                        alert("Restored successfully. Reloading...");
                                                        globalThis.location.reload();
                                                    } else {
                                                        alert(res.error || "Restore failed.");
                                                    }
                                                } catch {
                                                    alert("Restore failed — check the file.");
                                                }
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
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--success-soft)] text-[var(--success)]">
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
                                <Link href="/rules" className="flex items-center justify-between p-4 hover:bg-[var(--surface-2)] border-b border-[var(--border)] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="h-5 w-5 text-[var(--info)]" />
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
            className="flex min-h-[48px] sm:min-h-[60px] w-full flex-col items-center justify-center gap-0.5 sm:gap-1 rounded-[1.5rem] px-0.5 py-1.5 text-xs sm:text-xs font-black uppercase tracking-[0.05em] sm:tracking-[0.1em] transition-all duration-200 overflow-hidden"
            style={{
                backgroundColor: active ? "var(--primary)" : "transparent",
                color: active ? "#ffffff" : "var(--text-muted)",
                boxShadow: active ? "var(--shadow-sm)" : "none",
            }}>
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate w-full text-center leading-tight">{label}</span>
        </button>
    );
}





