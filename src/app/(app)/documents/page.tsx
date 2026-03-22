"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    Eye,
    FileSpreadsheet,
    FileText,
    FolderOpen,
    HardDrive,
    Lock,
    ScrollText,
    Trash2,
    Upload,
    X,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { FeatureGateCard } from "@/components/ui/feature-gate-card";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { DocumentPreview } from "@/components/ui/document-preview";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { ContractsTab } from "@/components/documents/ContractsTab";
import { DocumentTabStrip, type DocumentTabStripItem } from "@/components/documents/document-tab-strip";
import { useToast } from "@/components/ui/toast";
import { PLANS, type PlanConfig } from "@/config/plans";
import {
    filterRecordsForArchiveWindow,
    getStandardRetentionStatus,
    getArchiveUpgradeHref,
    getUpgradePlanForArchive,
    isUploadedDocument,
} from "@/lib/archive";
import {
    canUseContractSignedCopyUpload,
    canUseDocumentsHub,
    canUseVaultUploads,
    canUseYearEndSummary,
    getUserPlan,
} from "@/lib/entitlements";
import { buildContractFileName, generateEmploymentContract } from "@/lib/contracts/pdfGenerator";
import {
    deleteDocumentMeta,
    getAllLeaveRecords,
    getAllPayslips,
    getContracts,
    getDocumentFile,
    getDocuments,
    getEmployees,
    getPayPeriods,
    getSettings,
    purgeDocumentMetas,
    saveDocumentFile,
    saveDocumentMeta,
    saveSettings,
    subscribeToDataChanges,
    updateContractStatus,
} from "@/lib/storage";
import { generateYearEndSummaryPdf, getYearEndSummaryStatus } from "@/lib/year-end-summary";
import type { Contract, DocumentMeta, Employee, LeaveRecord, PayPeriod, PayslipInput } from "@/lib/schema";

type DocumentsTabId = "payslips" | "contracts" | "exports" | "records";
type VaultCategory = NonNullable<DocumentMeta["vaultCategory"]>;

const VAULT_MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_UPLOAD_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".docx"];

const VAULT_UPLOAD_OPTIONS: Array<{
    value: VaultCategory;
    label: string;
    description: string;
}> = [
    {
        value: "employee-docs",
        label: "Employee document",
        description: "Store ID copies, sick notes, warnings, or other worker-specific records.",
    },
    {
        value: "contracts",
        label: "Contract record",
        description: "Store signed contracts or supporting contract paperwork in the records section.",
    },
    {
        value: "admin",
        label: "Admin record",
        description: "Store internal household admin items that belong with your employment records.",
    },
    {
        value: "compliance",
        label: "Legal or compliance",
        description: "Store UIF, COIDA, and other compliance paperwork in one place.",
    },
    {
        value: "other",
        label: "Other record",
        description: "Use this when the document does not fit one of the main record groups.",
    },
];

const VAULT_CATEGORY_LABELS: Record<VaultCategory, string> = {
    contracts: "Contract record",
    "employee-docs": "Employee document",
    admin: "Admin record",
    compliance: "Legal or compliance",
    other: "Other record",
};

function normaliseDocumentsTab(value: string | null): DocumentsTabId {
    switch (value) {
        case "contracts":
            return "contracts";
        case "exports":
            return "exports";
        case "records":
        case "supporting":
        case "uploads":
            return "records";
        default:
            return "payslips";
    }
}

function matchesAllowedUpload(file: File): boolean {
    const lowerName = file.name.toLowerCase();
    return ACCEPTED_UPLOAD_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

function isPreviewableMimeType(mimeType: string | undefined): boolean {
    if (!mimeType) return false;
    return mimeType === "application/pdf" || mimeType.startsWith("image/");
}

function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    globalThis.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildYearEndSummaryFileName(year: number, householdName?: string) {
    const safeName = (householdName?.trim() || "Employment_Summary").replaceAll(/\s+/g, "_");
    return `${safeName}_${year}.pdf`;
}

function ArchiveBanner({ hiddenCount, href, label }: { hiddenCount: number; href: string; label: string }) {
    if (hiddenCount <= 0) return null;
    return (
        <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/8 px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-bold text-[var(--text)]">
                        You have {hiddenCount} older record{hiddenCount === 1 ? "" : "s"}.
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">Upgrade to browse your full history in the app.</p>
                </div>
                <Link href={href}>
                    <Button className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">{label}</Button>
                </Link>
            </div>
        </div>
    );
}

function DeviceStorageBadge() {
    return (
        <div className="flex w-fit items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1">
            <HardDrive className="h-3 w-3 text-[var(--text-muted)]" />
            <span className="text-[10px] font-black uppercase text-[var(--text-muted)]">This device</span>
        </div>
    );
}

function DocumentTable({
    data,
    icon: Icon,
    emptyMessage,
    previewLabel = "Preview",
    employeeNameById,
    showEmployee = false,
    showCategory = false,
    allowDelete = false,
    deletingDocumentId = null,
    onPreview,
    onDelete,
}: {
    data: DocumentMeta[];
    icon: React.ElementType;
    emptyMessage: string;
    previewLabel?: string;
    employeeNameById: Record<string, string>;
    showEmployee?: boolean;
    showCategory?: boolean;
    allowDelete?: boolean;
    deletingDocumentId?: string | null;
    onPreview: (doc: DocumentMeta) => void;
    onDelete?: (doc: DocumentMeta) => void;
}) {
    return (
        <DataTable<DocumentMeta>
            data={data}
            keyField={(doc) => doc.id}
            emptyMessage={emptyMessage}
            columns={[
                {
                    key: "fileName",
                    label: "File",
                    render: (doc) => (
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)]">
                                <Icon className="h-4 w-4 text-[var(--primary)]" />
                            </div>
                            <div className="min-w-0">
                                <p className="type-body-bold truncate text-[var(--text)]">{doc.fileName}</p>
                                {showCategory ? (
                                    <p className="text-xs text-[var(--text-muted)]">
                                        {VAULT_CATEGORY_LABELS[doc.vaultCategory ?? "other"]}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    ),
                },
                ...(showEmployee
                    ? [
                        {
                            key: "employee",
                            label: "Employee",
                            render: (doc: DocumentMeta) => (
                                <span className="type-body text-[var(--text-muted)]">
                                    {doc.employeeId ? employeeNameById[doc.employeeId] ?? "Unknown" : "-"}
                                </span>
                            ),
                        },
                    ]
                    : []),
                ...(showCategory
                    ? [
                        {
                            key: "category",
                            label: "Type",
                            render: (doc: DocumentMeta) => (
                                <span className="type-body text-[var(--text-muted)]">
                                    {VAULT_CATEGORY_LABELS[doc.vaultCategory ?? "other"]}
                                </span>
                            ),
                        },
                    ]
                    : []),
                {
                    key: "storage",
                    label: "Storage",
                    render: () => <DeviceStorageBadge />,
                },
                {
                    key: "date",
                    label: "Added",
                    render: (doc) => (
                        <span className="type-body text-[var(--text-muted)]">
                            {format(new Date(doc.createdAt), "d MMM yyyy")}
                        </span>
                    ),
                },
                {
                    key: "actions",
                    label: "",
                    align: "right",
                    render: (doc) => (
                        <div className="flex items-center justify-end gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 gap-2 rounded-full border border-[var(--border)] px-3 hover:bg-[var(--surface-2)]"
                                onClick={() => onPreview(doc)}
                            >
                                <Eye className="h-4 w-4 text-[var(--primary)]" />
                                <span className="text-xs font-bold">{previewLabel}</span>
                            </Button>
                            {allowDelete && onDelete ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 gap-2 rounded-full border px-3 text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                                    style={{ borderColor: "var(--danger-border)" }}
                                    disabled={deletingDocumentId === doc.id}
                                    onClick={() => onDelete(doc)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="text-xs font-bold">Delete</span>
                                </Button>
                            ) : null}
                        </div>
                    ),
                },
            ]}
            renderCard={(doc) => (
                <Card className="glass-panel border-none">
                    <CardContent className="space-y-3 p-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)]">
                                <Icon className="h-4 w-4 text-[var(--primary)]" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-[var(--text)]">{doc.fileName}</p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    {[
                                        showEmployee && doc.employeeId ? employeeNameById[doc.employeeId] ?? "Unknown" : null,
                                        showCategory ? VAULT_CATEGORY_LABELS[doc.vaultCategory ?? "other"] : null,
                                        format(new Date(doc.createdAt), "d MMM yyyy"),
                                    ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 flex-1 gap-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)]"
                                onClick={() => onPreview(doc)}
                            >
                                <Eye className="h-4 w-4 text-[var(--primary)]" />
                                <span className="text-xs font-bold">{previewLabel}</span>
                            </Button>
                            {allowDelete && onDelete ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 flex-1 gap-2 rounded-xl border px-3 text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                                    style={{ borderColor: "var(--danger-border)" }}
                                    disabled={deletingDocumentId === doc.id}
                                    onClick={() => onDelete(doc)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="text-xs font-bold">Delete</span>
                                </Button>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>
            )}
        />
    );
}

export default function DocumentsPage() {
    const { toast } = useToast();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState<DocumentsTabId>(() => normaliseDocumentsTab(searchParams?.get("tab") ?? null));
    const [documents, setDocuments] = React.useState<DocumentMeta[]>([]);
    const [contracts, setContracts] = React.useState<Contract[]>([]);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [allPayslips, setAllPayslips] = React.useState<PayslipInput[]>([]);
    const [allLeaveRecords, setAllLeaveRecordsState] = React.useState<LeaveRecord[]>([]);
    const [payPeriods, setPayPeriods] = React.useState<PayPeriod[]>([]);
    const [plan, setPlan] = React.useState<PlanConfig>(PLANS.free);
    const [settings, setSettings] = React.useState<Awaited<ReturnType<typeof getSettings>> | null>(null);
    const [nextUploadCategory, setNextUploadCategory] = React.useState<VaultCategory>("other");
    const [summaryYear, setSummaryYear] = React.useState<number | "">("");
    const summaryYearSelectId = React.useId();
    const [previewDoc, setPreviewDoc] = React.useState<DocumentMeta | null>(null);
    const [previewFileName, setPreviewFileName] = React.useState<string | undefined>(undefined);
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = React.useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = React.useState(false);
    const [deletingDocumentId, setDeletingDocumentId] = React.useState<string | null>(null);
    const [uploadMenuOpen, setUploadMenuOpen] = React.useState(false);
    const [useDesktopUploadMenu, setUseDesktopUploadMenu] = React.useState(false);
    const uploadMenuRef = React.useRef<HTMLDivElement | null>(null);
    const uploadButtonRef = React.useRef<HTMLButtonElement | null>(null);
    const uploadSheetCloseButtonRef = React.useRef<HTMLButtonElement | null>(null);
    const uploadInputRef = React.useRef<HTMLInputElement | null>(null);
    const pdfCache = React.useRef<Record<string, string>>({});
    const [uploadTargetContract, setUploadTargetContract] = React.useState<Contract | null>(null);

    React.useEffect(() => {
        let active = true;

        async function load() {
            if (!active) return;
            setLoading(true);
            try {
                const [
                    docs,
                    contractRows,
                    employeeRows,
                    userSettings,
                    payslipRows,
                    leaveRows,
                    payPeriodRows,
                ] = await Promise.all([
                    getDocuments(),
                    getContracts(),
                    getEmployees(),
                    getSettings(),
                    getAllPayslips(),
                    getAllLeaveRecords(),
                    getPayPeriods(),
                ]);

                if (!active) return;
                const nextPlan = getUserPlan(userSettings);
                let nextDocuments = docs;
                const nextRetentionStatus = getStandardRetentionStatus({
                    plan: nextPlan,
                    documents: nextDocuments,
                    dismissedAt: userSettings?.standardRetentionNoticeDismissedAt,
                    planDowngradedAt: userSettings?.planDowngradedAt,
                });

                if (nextRetentionStatus.purgeCount > 0) {
                    await purgeDocumentMetas(nextRetentionStatus.purgeCandidates.map((document) => document.id));
                    nextDocuments = await getDocuments();
                }

                if (!active) return;
                setDocuments(nextDocuments);
                setContracts(contractRows);
                setEmployees(employeeRows);
                setSettings(userSettings);
                setPlan(nextPlan);
                setAllPayslips(payslipRows);
                setAllLeaveRecordsState(leaveRows);
                setPayPeriods(payPeriodRows);
            } catch (error) {
                console.error("Failed to load documents hub", error);
            } finally {
                if (active) setLoading(false);
            }
        }

        load();
        const unsubscribe = subscribeToDataChanges(load);
        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    React.useEffect(() => {
        const nextTab = normaliseDocumentsTab(searchParams?.get("tab") ?? null);
        setActiveTab((current) => (current === nextTab ? current : nextTab));
    }, [searchParams]);

    React.useEffect(() => {
        if (activeTab !== "records") {
            setUploadMenuOpen(false);
        }
    }, [activeTab]);

    React.useEffect(() => {
        if (typeof window === "undefined") return;

        const mediaQuery = window.matchMedia("(min-width: 768px)");
        const syncDesktopUploadMenu = () => setUseDesktopUploadMenu(mediaQuery.matches);
        syncDesktopUploadMenu();

        mediaQuery.addEventListener("change", syncDesktopUploadMenu);
        return () => mediaQuery.removeEventListener("change", syncDesktopUploadMenu);
    }, []);

    React.useEffect(() => {
        if (!useDesktopUploadMenu || !uploadMenuOpen) return;

        function handlePointerDown(event: MouseEvent) {
            if (uploadMenuRef.current && !uploadMenuRef.current.contains(event.target as Node)) {
                setUploadMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [uploadMenuOpen, useDesktopUploadMenu]);

    const employeeNameById = React.useMemo(
        () => Object.fromEntries(employees.map((employee) => [employee.id, employee.name])),
        [employees],
    );

    const archiveUpgradePlanId = getUpgradePlanForArchive(plan.id);
    const archiveUpgradeHref = getArchiveUpgradeHref(plan.id);
    const archiveUpgradeLabel = archiveUpgradePlanId ? `Upgrade to ${PLANS[archiveUpgradePlanId].label}` : "Upgrade";
    const vaultUpgradeHref = "/upgrade?plan=pro&source=documents.uploads";
    const vaultUploadsAllowed = canUseVaultUploads(plan);
    const contractSignedCopyUploadAllowed = canUseContractSignedCopyUpload(plan);
    const yearEndSummaryAllowed = canUseYearEndSummary(plan);

    const payslipDocuments = React.useMemo(
        () => documents.filter((document) => document.type === "payslip"),
        [documents],
    );
    const exportDocuments = React.useMemo(
        () => documents.filter((document) => document.type === "export"),
        [documents],
    );
    const supportingDocuments = React.useMemo(
        () => documents.filter((document) => document.type === "archive" && document.source === "uploaded"),
        [documents],
    );
    let supportingDocumentsContent: React.ReactNode;
    if (supportingDocuments.length === 0) {
        supportingDocumentsContent = vaultUploadsAllowed ? (
            <EmptyState
                title="No supporting records yet"
                description="Use the upload button in this tab to add employee documents, contract records, compliance files, or other supporting paperwork."
                icon={FolderOpen}
            />
        ) : (
            <FeatureGateCard
                title="Supporting record uploads"
                description="Upgrade to Pro to add general supporting documents here. Signed contract copies still stay attached to their contract workflow."
                ctaLabel="Upgrade to Pro"
                href={vaultUpgradeHref}
                eyebrow="Pro"
                benefits={[
                    "Upload employee, admin, legal, and contract support records",
                    "Keep paperwork alongside the rest of your documents",
                    "Use one records tab instead of a long stacked page",
                ]}
            />
        );
    } else {
        supportingDocumentsContent = (
            <DocumentTable
                data={supportingDocuments}
                icon={FileText}
                emptyMessage="No supporting records available."
                employeeNameById={employeeNameById}
                showEmployee
                showCategory
                allowDelete={vaultUploadsAllowed}
                deletingDocumentId={deletingDocumentId}
                onPreview={(doc) => {
                    handlePreview(doc).catch(console.error);
                }}
                onDelete={(doc) => {
                    handleDeleteSupportingDocument(doc).catch(console.error);
                }}
            />
        );
    }

    const payslipArchiveResult = React.useMemo(
        () => filterRecordsForArchiveWindow(payslipDocuments, plan, (document) => document.createdAt, {
            alwaysVisible: isUploadedDocument,
        }),
        [payslipDocuments, plan],
    );

    const exportArchiveResult = React.useMemo(
        () => filterRecordsForArchiveWindow(exportDocuments, plan, (document) => document.createdAt, {
            alwaysVisible: isUploadedDocument,
        }),
        [exportDocuments, plan],
    );

    const contractsArchiveResult = React.useMemo(
        () => filterRecordsForArchiveWindow(contracts, plan, (contract) => contract.updatedAt || contract.createdAt),
        [contracts, plan],
    );

    const availableSummaryYears = React.useMemo(
        () => getYearEndSummaryStatus(payPeriods, new Date().getFullYear()).availableYears,
        [payPeriods],
    );

    React.useEffect(() => {
        if (!summaryYear && availableSummaryYears.length > 0) {
            setSummaryYear(availableSummaryYears[0]);
        }
    }, [availableSummaryYears, summaryYear]);

    const selectedYearStatus = React.useMemo(
        () => (summaryYear ? getYearEndSummaryStatus(payPeriods, Number(summaryYear)) : null),
        [payPeriods, summaryYear],
    );

    const retentionStatus = React.useMemo(
        () => getStandardRetentionStatus({
            plan,
            documents,
            dismissedAt: settings?.standardRetentionNoticeDismissedAt,
        }),
        [documents, plan, settings?.standardRetentionNoticeDismissedAt],
    );

    const visiblePayslipDocuments = payslipArchiveResult.visible;
    const visibleContracts = plan.id === "standard" ? contracts : contractsArchiveResult.visible;
    const contractHiddenCount = plan.id === "standard" ? 0 : contractsArchiveResult.hiddenCount;
    const visibleExportDocuments = exportArchiveResult.visible;
    const documentTabs: ReadonlyArray<DocumentTabStripItem<DocumentsTabId>> = [
        {
            id: "payslips" as const,
            label: "Payslips",
            count: visiblePayslipDocuments.length,
        },
        {
            id: "contracts" as const,
            label: "Contracts",
            count: visibleContracts.length,
        },
        {
            id: "exports" as const,
            label: "Exports",
            count: visibleExportDocuments.length,
        },
        {
            id: "records" as const,
            label: "Records",
            count: supportingDocuments.length,
        },
    ];

    const displayDocumentUrl = (url: string, mimeType?: string) => {
        if ((mimeType || "").startsWith("application/pdf")) {
            if (typeof globalThis.window !== "undefined") {
                globalThis.open(url, "_blank", "noopener,noreferrer");
            }
            return;
        }

        setPreviewUrl(url);
    };

    const handlePreview = async (doc: DocumentMeta) => {
        setPreviewDoc(doc);
        setPreviewFileName(doc.fileName);

        const cachedUrl = pdfCache.current[doc.id];
        if (cachedUrl) {
            displayDocumentUrl(cachedUrl, doc.mimeType);
            return;
        }

        setIsGeneratingPreview(true);

        try {
            if (doc.type === "payslip" && doc.employeeId) {
                router.push(`/preview?payslipId=${doc.id}&empId=${doc.employeeId}`);
                return;
            }

            const blob = await getDocumentFile(doc.id);
            if (!blob) throw new Error("That file is not available yet.");

            const mimeType = blob.type || doc.mimeType || "application/octet-stream";
            if (mimeType === "application/pdf" || isPreviewableMimeType(mimeType)) {
                const url = URL.createObjectURL(blob);
                pdfCache.current[doc.id] = url;
                displayDocumentUrl(url, mimeType);
                return;
            }

            setPreviewDoc(null);
            setPreviewFileName(undefined);
            downloadBlob(blob, doc.fileName);
        } catch (error) {
            toast(error instanceof Error ? error.message : "Could not open that document.", "error");
            setPreviewDoc(null);
            setPreviewFileName(undefined);
        } finally {
            setIsGeneratingPreview(false);
        }
    };

    const openContractPreview = (contract: Contract) => {
        router.push(`/contracts/${contract.id}/preview`);
    };

    const downloadContract = async (contract: Contract) => {
        if (!settings) return;
        const employee = employees.find((entry) => entry.id === contract.employeeId);
        if (!employee) return;
        const pdfBytes = await generateEmploymentContract(contract, employee, settings);
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
        downloadBlob(blob, buildContractFileName(contract, employee));

        if (contract.status === "draft") {
            await updateContractStatus(contract.id, "awaiting_signed_copy");
        }
    };

    const handleMarkFinal = async (contract: Contract) => {
        try {
            await updateContractStatus(contract.id, "final", { finalizedAt: new Date().toISOString() });
            toast("Contract marked as final.", "success");
        } catch {
            toast("Could not update contract status.", "error");
        }
    };

    const handleContractUploadClick = (contract: Contract) => {
        if (!contractSignedCopyUploadAllowed) return;
        setUploadTargetContract(contract);
        setUploadMenuOpen(false);
        uploadInputRef.current?.click();
    };

    const startSupportingDocumentUpload = (category: VaultCategory) => {
        if (!vaultUploadsAllowed) {
            router.push(vaultUpgradeHref);
            return;
        }

        setNextUploadCategory(category);
        setUploadTargetContract(null);
        setUploadMenuOpen(false);
        uploadInputRef.current?.click();
    };

    const handleTabChange = (tab: DocumentsTabId) => {
        setActiveTab(tab);
        setUploadMenuOpen(false);

        const nextParams = new URLSearchParams(searchParams?.toString() ?? "");
        if (tab === "payslips") {
            nextParams.delete("tab");
        } else {
            nextParams.set("tab", tab);
        }

        const nextQuery = nextParams.toString();
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    };

    const handleRecordsUploadClick = () => {
        if (!vaultUploadsAllowed) {
            router.push(vaultUpgradeHref);
            return;
        }

        setUploadMenuOpen((current) => !current);
    };

    const handleSignedDocumentSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        const targetContract = uploadTargetContract;
        event.target.value = "";

        if (!file) return;

        if (targetContract && file.type !== "application/pdf") {
            toast("Signed contracts must be uploaded as PDF files.", "error");
            return;
        }

        if (!targetContract && !matchesAllowedUpload(file)) {
            toast("Upload a PDF, JPG, PNG, or DOCX file.", "error");
            return;
        }

        if (file.size > VAULT_MAX_FILE_BYTES) {
            toast("Files must be 10 MB or smaller.", "error");
            return;
        }

        try {
            const id = crypto.randomUUID();
            const createdAt = new Date().toISOString();

            if (targetContract) {
                if (!contractSignedCopyUploadAllowed) {
                    router.push("/upgrade?plan=standard&source=contracts.signedUploads");
                    return;
                }

                const employee = employees.find((entry) => entry.id === targetContract.employeeId);
                const nextDocument: DocumentMeta = {
                    id,
                    householdId: employee?.householdId ?? settings?.activeHouseholdId ?? "default",
                    type: "archive",
                    employeeId: employee?.id,
                    periodId: targetContract.id,
                    fileName: file.name,
                    mimeType: file.type || "application/octet-stream",
                    source: "uploaded",
                    vaultCategory: "contracts",
                    sizeBytes: file.size,
                    createdAt,
                };

                await saveDocumentFile(id, file, "contracts");
                await saveDocumentMeta(nextDocument);
                await updateContractStatus(targetContract.id, "signed_copy_stored", { signedDocumentId: id });
                setDocuments((current) => [nextDocument, ...current]);
                toast("Signed copy saved.", "success");
                return;
            }

            const nextDocument: DocumentMeta = {
                id,
                householdId: settings?.activeHouseholdId ?? "default",
                type: "archive",
                fileName: file.name,
                mimeType: file.type || "application/octet-stream",
                source: "uploaded",
                vaultCategory: nextUploadCategory,
                sizeBytes: file.size,
                createdAt,
            };

            await saveDocumentFile(id, file, "vault");
            await saveDocumentMeta(nextDocument);
            setDocuments((current) => [nextDocument, ...current]);
            toast("Document uploaded.", "success");
        } catch (error) {
            toast(error instanceof Error ? error.message : "Could not save that file.", "error");
        } finally {
            setUploadTargetContract(null);
        }
    };

    const handleDeleteSupportingDocument = async (document: DocumentMeta) => {
        if (!vaultUploadsAllowed) return;
        if (typeof globalThis.window !== "undefined" && !globalThis.confirm(`Delete ${document.fileName}?`)) {
            return;
        }

        try {
            setDeletingDocumentId(document.id);
            await deleteDocumentMeta(document.id);
            setDocuments((current) => current.filter((entry) => entry.id !== document.id));
            if (previewDoc?.id === document.id) {
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewDoc(null);
                setPreviewFileName(undefined);
                setPreviewUrl(null);
            }
            toast("Document removed.", "success");
        } catch (error) {
            toast(error instanceof Error ? error.message : "Could not delete that file.", "error");
        } finally {
            setDeletingDocumentId(null);
        }
    };

    const handleGenerateYearEndSummary = async () => {
        if (!summaryYear || !yearEndSummaryAllowed || !settings) return;

        try {
            setIsGeneratingSummary(true);
            const pdfBytes = await generateYearEndSummaryPdf({
                year: Number(summaryYear),
                householdName: settings.employerName || "Employment Summary",
                employees,
                payslips: allPayslips,
                leaveRecords: allLeaveRecords,
                payPeriods,
            });

            const id = crypto.randomUUID();
            const createdAt = new Date().toISOString();
            const fileName = buildYearEndSummaryFileName(Number(summaryYear), settings.employerName || "Employment Summary");
            const blob = new Blob([new Uint8Array(pdfBytes).buffer], { type: "application/pdf" });
            const nextDocument: DocumentMeta = {
                id,
                householdId: settings.activeHouseholdId ?? "default",
                type: "export",
                fileName,
                mimeType: "application/pdf",
                source: "generated",
                createdAt,
                sizeBytes: blob.size,
            };

            await saveDocumentFile(id, blob);
            await saveDocumentMeta(nextDocument);
            setDocuments((current) => [nextDocument, ...current]);
            toast("Year-end summary saved to Exports.", "success");
        } catch (error) {
            toast(error instanceof Error ? error.message : "Could not generate the year-end summary.", "error");
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const closePreview = React.useCallback(() => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewDoc(null);
        setPreviewFileName(undefined);
        setPreviewUrl(null);
    }, [previewUrl]);

    const handleDismissRetentionReminder = async () => {
        if (!settings || plan.id !== "standard") return;
        const dismissedAt = new Date().toISOString();

        try {
            await saveSettings({
                ...settings,
                standardRetentionNoticeDismissedAt: dismissedAt,
            });
            setSettings((current) => current ? {
                ...current,
                standardRetentionNoticeDismissedAt: dismissedAt,
            } : current);
        } catch (error) {
            console.error("Failed to save retention reminder dismissal", error);
            toast("Could not hide that reminder right now.", "error");
        }
    };

    if (loading) {
        return (
            <div className="workspace-shell workspace-shell--wide w-full pb-12">
                <PageHeader title="Documents" subtitle="One place for payslips, contracts, exports, and supporting records." />
                <EmptyState
                    title="Loading documents"
                    description="Pulling together your payslips, contracts, exports, and stored records."
                    icon={FolderOpen}
                />
            </div>
        );
    }

    if (!canUseDocumentsHub(plan)) {
        return (
            <div className="workspace-shell workspace-shell--wide w-full pb-12">
                <PageHeader title="Documents" subtitle="Switch between payslips, contracts, exports, and supporting records from one familiar tabbed view." />
                <FeatureGateCard
                    title="Documents hub is available on Standard and Pro"
                    description="Free keeps payroll and payslips simple for one worker. Upgrade for contracts, document uploads, exports, and longer record access."
                />
            </div>
        );
    }

    return (
        <>
            <div className="workspace-shell workspace-shell--wide w-full pb-12">
                <PageHeader
                    title="Documents"
                    subtitle="Switch between payslips, contracts, exports, and supporting records with the same tabbed flow used on each employee record."
                />

                <input
                    ref={uploadInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.docx"
                    className="hidden"
                    onChange={handleSignedDocumentSelected}
                />

                <section className="overflow-hidden rounded-[30px] border border-[var(--border-strong)] bg-[var(--surface-1)] shadow-[0_20px_50px_rgba(16,24,40,0.10)]">
                    <div
                        className="border-b border-[var(--border)] px-5 py-4 sm:px-6"
                        style={{ background: "linear-gradient(135deg, rgba(0, 122, 77, 0.06) 0%, rgba(0, 122, 77, 0.02) 100%)" }}
                    >
                        <div className="flex flex-col gap-4">
                            <div className="max-w-[68ch]">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                                    Household Records
                                </p>
                                <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
                                    Documents
                                </h2>
                                <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                                    Keep each document type in its own tab so it stays fast to scan, easy to switch, and consistent with the employee-specific documents view.
                                </p>
                            </div>

                            <DocumentTabStrip
                                ariaLabel="Document types"
                                activeTab={activeTab}
                                tabs={documentTabs}
                                onChange={handleTabChange}
                                showSummaryCounts={true}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 p-4 sm:p-5 lg:p-6">

                    {retentionStatus.showElevenMonthWarning ? (
                        <div className="rounded-2xl border border-[var(--warning-border)] bg-[var(--warning-soft)] px-4 py-4 sm:px-5">
                            <div className="max-w-[75ch]">
                                <p className="text-sm font-bold text-[var(--text)]">Some payroll documents are nearing the 12-month limit</p>
                                <p className="mt-1 text-sm leading-7 text-[var(--text-muted)]">
                                    One or more generated payslips or exports are now 11 months old. Save offline or printed copies now. On Standard, generated payroll documents are permanently deleted once they pass 12 months.
                                </p>
                            </div>
                        </div>
                    ) : null}

                    {retentionStatus.showReminder ? (
                        <div className="rounded-2xl border border-[var(--focus)]/25 bg-[var(--focus)]/10 px-4 py-4 sm:px-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="max-w-[75ch]">
                                    <p className="text-sm font-bold text-[var(--text)]">Standard keeps 12 months of generated payroll documents</p>
                                    <p className="mt-1 text-sm leading-7 text-[var(--text-muted)]">
                                        LekkerLedger Standard keeps generated payslips and exports in-app for 12 months. Please save your own copies as you go. Depending on the record type, South African rules may require employment records to be kept for 3 to 5 years. Upgrade to Pro for longer in-app storage.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="font-bold"
                                    onClick={() => {
                                        handleDismissRetentionReminder().catch(console.error);
                                    }}
                                >
                                    Hide for 30 days
                                </Button>
                            </div>
                        </div>
                    ) : null}

                    {activeTab === "payslips" ? (
                        <section className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div className="max-w-[62ch]">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Payroll records</p>
                                    <h3 className="mt-2 font-serif text-2xl font-bold text-[var(--text)]">Payslips</h3>
                                    <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                                        Finalised payslip PDFs land here automatically, with employees shown in the list so you can jump straight to the right record.
                                    </p>
                                </div>
                                <Link href={employees.length === 0 ? "/employees/new" : "/payroll"}>
                                    <Button variant="outline" className="font-bold">
                                        {employees.length === 0 ? "Add employee" : "Run payroll"}
                                    </Button>
                                </Link>
                            </div>

                            {visiblePayslipDocuments.length === 0 ? (
                                <EmptyState
                                    title="No payslips yet"
                                    description="Payslip PDFs will appear here automatically after you finalise your first pay period."
                                    icon={FileText}
                                    actionLabel={employees.length === 0 ? "Add your first employee" : "Run payroll"}
                                    actionHref={employees.length === 0 ? "/employees/new" : "/payroll"}
                                />
                            ) : (
                                <DocumentTable
                                    data={visiblePayslipDocuments}
                                    icon={FileText}
                                    emptyMessage="No payslips available."
                                    employeeNameById={employeeNameById}
                                    showEmployee
                                    onPreview={(doc) => {
                                        handlePreview(doc).catch(console.error);
                                    }}
                                />
                            )}

                            <ArchiveBanner
                                hiddenCount={payslipArchiveResult.hiddenCount}
                                href={archiveUpgradeHref}
                                label={archiveUpgradeLabel}
                            />
                        </section>
                    ) : null}

                    {activeTab === "contracts" ? (
                        <section className="space-y-4">
                            <div className="max-w-[62ch]">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Employment agreements</p>
                                <h3 className="mt-2 font-serif text-2xl font-bold text-[var(--text)]">Contracts</h3>
                                <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                                    Keep the contract workflow in one place: review the draft, download it, upload the signed copy, and finalise it when it is ready.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-[var(--focus)]/25 bg-[var(--focus)]/10 px-4 py-3 text-sm text-[var(--text)]">
                                <strong>Review before signing:</strong> Contract templates are starting points. Verify edge cases with a labour lawyer if you are unsure.
                            </div>

                            <ContractsTab
                                contracts={visibleContracts}
                                employees={employees}
                                documents={documents}
                                hiddenCount={contractHiddenCount}
                                archiveUpgradeHref={archiveUpgradeHref}
                                archiveUpgradeLabel={archiveUpgradeLabel}
                                openContractPreview={openContractPreview}
                                downloadContract={downloadContract}
                                handleContractUploadClick={handleContractUploadClick}
                                handlePreview={handlePreview}
                                handleMarkFinal={handleMarkFinal}
                                toast={toast}
                            />
                        </section>
                    ) : null}

                    {activeTab === "exports" ? (
                        <section className="space-y-4">
                            <div className="max-w-[62ch]">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Exports</p>
                                <h3 className="mt-2 font-serif text-2xl font-bold text-[var(--text)]">Year-end and supporting PDFs</h3>
                                <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                                    Generate the year-end summary here and keep the finished export files together in a clean, scroll-light list.
                                </p>
                            </div>

                            <Card className="glass-panel border-none">
                                <CardContent className="space-y-4 p-5">
                                    <div className="max-w-[62ch]">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Year-end summary</p>
                                        <h4 className="mt-2 font-serif text-xl font-bold text-[var(--text)]">One PDF for the full year</h4>
                                        <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                                            Summarise finalised payroll totals and leave taken for each worker over one calendar year.
                                        </p>
                                    </div>

                                    {yearEndSummaryAllowed ? (
                                        <>
                                            {availableSummaryYears.length === 0 ? (
                                                <p className="text-sm text-[var(--text-muted)]">
                                                    Finalise a payroll month first, then you can generate a year-end summary here.
                                                </p>
                                            ) : (
                                                <>
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                                                            <label htmlFor={summaryYearSelectId}>Year</label>
                                                            <select
                                                                id={summaryYearSelectId}
                                                                value={summaryYear}
                                                                onChange={(event) => setSummaryYear(Number(event.target.value))}
                                                                className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text)]"
                                                            >
                                                                {availableSummaryYears.map((year) => (
                                                                    <option key={year} value={year}>
                                                                        {year}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            onClick={handleGenerateYearEndSummary}
                                                            disabled={isGeneratingSummary || !summaryYear}
                                                            className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                                                        >
                                                            {isGeneratingSummary ? "Generating..." : "Generate PDF"}
                                                        </Button>
                                                    </div>
                                                    {selectedYearStatus && selectedYearStatus.unlockedMonthCount > 0 ? (
                                                        <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/8 px-4 py-3 text-sm text-[var(--text)]">
                                                            {selectedYearStatus.unlockedMonthCount} month
                                                            {selectedYearStatus.unlockedMonthCount === 1 ? "" : "s"} in {summaryYear} have not been finalised yet. The summary will only include finalised months.
                                                        </div>
                                                    ) : null}
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/8 px-4 py-4">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-[var(--text)]">Year-end summaries are available on Pro</p>
                                                    <p className="text-sm text-[var(--text-muted)]">
                                                        Keep one ready-to-share PDF for your records or your tax practitioner.
                                                    </p>
                                                </div>
                                                <Link href={vaultUpgradeHref}>
                                                    <Button className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">Upgrade to Pro</Button>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {visibleExportDocuments.length === 0 ? (
                                <EmptyState
                                    title="No exports available"
                                    description="Official documents like year-end summaries and UIF declarations will appear here when you generate them."
                                    icon={FileSpreadsheet}
                                />
                            ) : (
                                <DocumentTable
                                    data={visibleExportDocuments}
                                    icon={FileSpreadsheet}
                                    emptyMessage="No exports available."
                                    employeeNameById={employeeNameById}
                                    onPreview={(doc) => {
                                        handlePreview(doc).catch(console.error);
                                    }}
                                />
                            )}

                            <ArchiveBanner
                                hiddenCount={exportArchiveResult.hiddenCount}
                                href={archiveUpgradeHref}
                                label={archiveUpgradeLabel}
                            />
                        </section>
                    ) : null}

                    {activeTab === "records" ? (
                        <section className="space-y-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div className="max-w-[62ch]">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Supporting records</p>
                                    <h3 className="mt-2 font-serif text-2xl font-bold text-[var(--text)]">Uploaded documents</h3>
                                    <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                                        Keep supporting paperwork here without mixing it into the contracts or exports tabs. Signed contract PDFs still stay linked from each contract row.
                                    </p>
                                </div>

                                <div className="relative shrink-0" ref={uploadMenuRef}>
                                    <Button
                                        ref={uploadButtonRef}
                                        type="button"
                                        className="h-10 gap-2 bg-[var(--primary)] px-4 text-sm font-bold text-white hover:bg-[var(--primary-hover)]"
                                        aria-haspopup={useDesktopUploadMenu ? "menu" : "dialog"}
                                        aria-expanded={uploadMenuOpen}
                                        onClick={handleRecordsUploadClick}
                                    >
                                        {vaultUploadsAllowed ? <Upload className="h-4 w-4 shrink-0" /> : <Lock className="h-4 w-4 shrink-0" />}
                                        <span>Upload document</span>
                                    </Button>

                                    {uploadMenuOpen && useDesktopUploadMenu ? (
                                        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-40 w-[min(24rem,calc(100vw-1.5rem))] rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-raised)] p-3 shadow-[0_20px_48px_rgba(16,24,40,0.14)]">
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Choose upload type</p>
                                            <div className="mt-3 space-y-2">
                                                {VAULT_UPLOAD_OPTIONS.map((option) => (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => startSupportingDocumentUpload(option.value)}
                                                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-left transition-colors hover:bg-[var(--surface-2)]"
                                                    >
                                                        <p className="text-sm font-semibold text-[var(--text)]">{option.label}</p>
                                                        <p className="mt-1 text-xs leading-6 text-[var(--text-muted)]">{option.description}</p>
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="mt-3 text-xs leading-6 text-[var(--text-muted)]">
                                                Signed contract PDFs still upload from the matching contract row so the file stays linked to that contract.
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            {plan.id === "standard" ? (
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 px-4 py-3 text-sm text-[var(--text-muted)]">
                                    Contracts and signed contract copies are not auto-deleted by the 12-month payroll rule.
                                </div>
                            ) : null}

                            {!vaultUploadsAllowed ? (
                                <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/8 px-4 py-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="max-w-[60ch]">
                                            <p className="text-sm font-bold text-[var(--text)]">General uploads are available on Pro</p>
                                            <p className="text-sm text-[var(--text-muted)]">
                                                Standard keeps payslips, contract drafts, and signed contract copies here. Pro unlocks broader uploads for employee records, compliance paperwork, and longer storage.
                                            </p>
                                        </div>
                                        <Link href={vaultUpgradeHref}>
                                            <Button className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">Upgrade to Pro</Button>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 px-4 py-3 text-sm text-[var(--text-muted)]">
                                    New uploads are stored on this device and grouped by the type you choose here.
                                </div>
                            )}

                            {supportingDocumentsContent}
                        </section>
                    ) : null}
                    </div>
                </section>
            </div>

            {isGeneratingPreview ? (
                <div className="animate-pulse fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full bg-[var(--primary)] p-4 text-white shadow-2xl">
                    Generating preview...
                </div>
            ) : null}

            {previewUrl ? (
                <DocumentPreview
                    url={previewUrl}
                    fileName={previewFileName ?? previewDoc?.fileName}
                    onClose={closePreview}
                    onDownload={() => {
                        const anchor = document.createElement("a");
                        anchor.href = previewUrl;
                        anchor.download = previewFileName ?? previewDoc?.fileName ?? "document.pdf";
                        document.body.appendChild(anchor);
                        anchor.click();
                        anchor.remove();
                    }}
                />
            ) : null}

            <MobileSheet
                open={uploadMenuOpen && !useDesktopUploadMenu}
                onOpenChange={setUploadMenuOpen}
                ariaLabel="Upload document"
                position="bottom"
                initialFocusRef={uploadSheetCloseButtonRef}
                returnFocusRef={uploadButtonRef}
                testId="records-upload-sheet"
            >
                <div className="flex min-h-0 w-full flex-col bg-[var(--surface-raised)]">
                    <div className="flex items-center justify-between border-b border-[var(--border)] px-5 pb-4 pt-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Choose upload type</p>
                            <h3 className="mt-2 text-lg font-bold text-[var(--text)]">Upload document</h3>
                        </div>
                        <button
                            ref={uploadSheetCloseButtonRef}
                            type="button"
                            onClick={() => setUploadMenuOpen(false)}
                            aria-label="Close upload options"
                            className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)]"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 safe-area-pb">
                        <div className="space-y-2">
                            {VAULT_UPLOAD_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => startSupportingDocumentUpload(option.value)}
                                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-4 text-left transition-colors hover:bg-[var(--surface-2)]"
                                >
                                    <p className="text-sm font-semibold text-[var(--text)]">{option.label}</p>
                                    <p className="mt-1 text-xs leading-6 text-[var(--text-muted)]">{option.description}</p>
                                </button>
                            ))}
                        </div>

                        <p className="mt-4 text-xs leading-6 text-[var(--text-muted)]">
                            Signed contract PDFs still upload from the matching contract row so the file stays linked to that contract.
                        </p>
                    </div>
                </div>
            </MobileSheet>
        </>
    );
}
