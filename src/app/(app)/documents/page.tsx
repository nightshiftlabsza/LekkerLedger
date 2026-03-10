"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Cloud,
    Download,
    Eye,
    FileSpreadsheet,
    FileText,
    FolderOpen,
    HardDrive,
    History,
    Lock,
    ScrollText,
    Trash2,
    Upload,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { FeatureGateCard } from "@/components/ui/feature-gate-card";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { FiltersBar, type FilterChip } from "@/components/ui/filters-bar";
import { DocumentPreview } from "@/components/ui/document-preview";
import { ContractRow } from "@/components/documents/ContractRow";
import { ContractsTab } from "@/components/documents/ContractsTab";
import { useToast } from "@/components/ui/toast";
import { PLANS, type PlanConfig } from "@/config/plans";
import {
    filterRecordsForArchiveWindow,
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
import { deleteDriveFile, uploadVaultFileToDrive } from "@/lib/google-drive";
import { getStoredGoogleAccessToken } from "@/lib/google-session";
import { generateEmploymentContract, buildContractFileName } from "@/lib/contracts/pdfGenerator";
import { generatePayslipPdfBytes } from "@/lib/pdf";
import {
    deleteDocumentMeta,
    getAllLeaveRecords,
    getAllPayslips,
    getContracts,
    getDocumentFile,
    getDocuments,
    getEmployees,
    getPayPeriods,
    getPayslipsForEmployee,
    getSettings,
    saveDocumentFile,
    saveDocumentMeta,
    subscribeToDataChanges,
    updateContractStatus,
} from "@/lib/storage";
import { generateYearEndSummaryPdf, getYearEndSummaryStatus } from "@/lib/year-end-summary";
import type { Contract, DocumentMeta, Employee, LeaveRecord, PayPeriod, PayslipInput } from "@/lib/schema";

const TABS = ["Payslips", "Contracts", "Exports", "Vault"] as const;
type Tab = typeof TABS[number];
type VaultCategory = "contracts" | "employee-docs" | "compliance" | "other";

const TAB_TYPE_MAP: Record<Exclude<Tab, "Contracts">, DocumentMeta["type"]> = {
    Payslips: "payslip",
    Exports: "export",
    Vault: "archive",
};

const VAULT_CATEGORIES: Array<{ value: VaultCategory; label: string }> = [
    { value: "contracts", label: "Contracts" },
    { value: "employee-docs", label: "Employee docs" },
    { value: "compliance", label: "Legal" },
    { value: "other", label: "Other" },
];

const VAULT_MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_UPLOAD_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".docx"];

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
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}


function buildYearEndSummaryFileName(year: number, householdName?: string) {
    const safeName = (householdName?.trim() || "Employment_Summary").replace(/\s+/g, "_");
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

export default function DocumentsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = (searchParams.get("tab") || "").toLowerCase();
    const defaultTab = initialTab === "contracts"
        ? "Contracts"
        : initialTab === "vault"
            ? "Vault"
            : initialTab === "exports"
                ? "Exports"
                : "Payslips";

    const [activeTab, setActiveTab] = React.useState<Tab>(defaultTab as Tab);
    const [loading, setLoading] = React.useState(true);
    const [documents, setDocuments] = React.useState<DocumentMeta[]>([]);
    const [contracts, setContracts] = React.useState<Contract[]>([]);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [allPayslips, setAllPayslips] = React.useState<PayslipInput[]>([]);
    const [allLeaveRecords, setAllLeaveRecordsState] = React.useState<LeaveRecord[]>([]);
    const [payPeriods, setPayPeriods] = React.useState<PayPeriod[]>([]);
    const [plan, setPlan] = React.useState<PlanConfig>(PLANS.free);
    const [settings, setSettings] = React.useState<Awaited<ReturnType<typeof getSettings>> | null>(null);
    const [search, setSearch] = React.useState("");
    const [empFilter, setEmpFilter] = React.useState<string>("");
    const [vaultCategoryFilter, setVaultCategoryFilter] = React.useState<string>("");
    const [nextVaultCategory, setNextVaultCategory] = React.useState<VaultCategory>("other");
    const [summaryYear, setSummaryYear] = React.useState<number | "">("");
    const [previewDoc, setPreviewDoc] = React.useState<DocumentMeta | null>(null);
    const [previewFileName, setPreviewFileName] = React.useState<string | undefined>(undefined);
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = React.useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = React.useState(false);
    const [deletingDocumentId, setDeletingDocumentId] = React.useState<string | null>(null);
    const uploadInputRef = React.useRef<HTMLInputElement | null>(null);
    const pdfCache = React.useRef<Record<string, string>>({});
    const [uploadTargetContract, setUploadTargetContract] = React.useState<Contract | null>(null);

    React.useEffect(() => {
        setActiveTab(defaultTab as Tab);
    }, [defaultTab]);

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
                setDocuments(docs);
                setContracts(contractRows);
                setEmployees(employeeRows);
                setSettings(userSettings);
                setPlan(getUserPlan(userSettings));
                setAllPayslips(payslipRows);
                setAllLeaveRecordsState(leaveRows);
                setPayPeriods(payPeriodRows);
            } catch (error) {
                console.error("Failed to load documents hub", error);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void load();
        const unsubscribe = subscribeToDataChanges(load);
        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    const employeeNameById = React.useMemo(
        () => Object.fromEntries(employees.map((employee) => [employee.id, employee.name])),
        [employees],
    );

    const employeeFilters: FilterChip[] = employees.map((employee) => ({
        key: employee.id,
        label: employee.name,
        active: empFilter === employee.id,
    }));

    const archiveUpgradePlanId = getUpgradePlanForArchive(plan.id);
    const archiveUpgradeHref = getArchiveUpgradeHref(plan.id);
    const archiveUpgradeLabel = archiveUpgradePlanId ? `Upgrade to ${PLANS[archiveUpgradePlanId].label}` : "Upgrade";
    const vaultUpgradeHref = "/upgrade?plan=pro";
    const vaultUploadsAllowed = canUseVaultUploads(plan);
    const contractSignedCopyUploadAllowed = canUseContractSignedCopyUpload(plan);
    const yearEndSummaryAllowed = canUseYearEndSummary(plan);

    const payslipDocuments = React.useMemo(
        () => documents.filter((document) => document.type === TAB_TYPE_MAP.Payslips),
        [documents],
    );
    const exportDocuments = React.useMemo(
        () => documents.filter((document) => document.type === TAB_TYPE_MAP.Exports),
        [documents],
    );
    const vaultDocuments = React.useMemo(
        () => documents.filter((document) => document.type === TAB_TYPE_MAP.Vault && document.source === "uploaded"),
        [documents],
    );

    const payslipArchiveResult = React.useMemo(
        () => filterRecordsForArchiveWindow(
            payslipDocuments.filter((document) => !empFilter || document.employeeId === empFilter),
            plan,
            (document) => document.createdAt,
            { alwaysVisible: isUploadedDocument },
        ),
        [empFilter, payslipDocuments, plan],
    );

    const exportArchiveResult = React.useMemo(
        () => filterRecordsForArchiveWindow(
            exportDocuments.filter((document) => !empFilter || document.employeeId === empFilter),
            plan,
            (document) => document.createdAt,
            { alwaysVisible: isUploadedDocument },
        ),
        [empFilter, exportDocuments, plan],
    );

    const contractsArchiveResult = React.useMemo(
        () => filterRecordsForArchiveWindow(
            contracts.filter((contract) => !empFilter || contract.employeeId === empFilter),
            plan,
            (contract) => contract.updatedAt || contract.createdAt,
        ),
        [contracts, empFilter, plan],
    );

    const filteredPayslipDocuments = React.useMemo(() => {
        const query = search.trim().toLowerCase();
        return payslipArchiveResult.visible.filter((document) => {
            if (!query) return true;
            const employeeName = (document.employeeId ? employeeNameById[document.employeeId] : "")?.toLowerCase() ?? "";
            return document.fileName.toLowerCase().includes(query) || employeeName.includes(query);
        });
    }, [employeeNameById, payslipArchiveResult.visible, search]);

    const filteredExportDocuments = React.useMemo(() => {
        const query = search.trim().toLowerCase();
        return exportArchiveResult.visible.filter((document) => {
            if (!query) return true;
            const employeeName = (document.employeeId ? employeeNameById[document.employeeId] : "")?.toLowerCase() ?? "";
            return document.fileName.toLowerCase().includes(query) || employeeName.includes(query);
        });
    }, [employeeNameById, exportArchiveResult.visible, search]);

    const filteredContracts = React.useMemo(() => {
        const query = search.trim().toLowerCase();
        return contractsArchiveResult.visible.filter((contract) => {
            if (!query) return true;
            const employeeName = employeeNameById[contract.employeeId]?.toLowerCase() ?? "";
            return contract.jobTitle.toLowerCase().includes(query) || employeeName.includes(query);
        });
    }, [contractsArchiveResult.visible, employeeNameById, search]);

    const filteredVaultDocuments = React.useMemo(() => {
        const query = search.trim().toLowerCase();
        return vaultDocuments.filter((document) => {
            if (empFilter && document.employeeId !== empFilter) return false;
            if (vaultCategoryFilter && document.vaultCategory !== vaultCategoryFilter) return false;
            if (!query) return true;
            const employeeName = (document.employeeId ? employeeNameById[document.employeeId] : "")?.toLowerCase() ?? "";
            return document.fileName.toLowerCase().includes(query) || employeeName.includes(query);
        });
    }, [empFilter, employeeNameById, search, vaultCategoryFilter, vaultDocuments]);

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
        () => summaryYear ? getYearEndSummaryStatus(payPeriods, Number(summaryYear)) : null,
        [payPeriods, summaryYear],
    );

    const handlePreview = async (doc: DocumentMeta) => {
        setPreviewDoc(doc);
        setPreviewFileName(doc.fileName);

        if (pdfCache.current[doc.id]) {
            const cachedUrl = pdfCache.current[doc.id];

            // For PDFs, open directly in a new tab instead of the side-panel viewer
            if ((doc.mimeType || "").startsWith("application/pdf")) {
                if (typeof window !== "undefined") {
                    window.open(cachedUrl, "_blank", "noopener,noreferrer");
                }
                return;
            }

            setPreviewUrl(cachedUrl);
            return;
        }

        setIsGeneratingPreview(true);

        try {
            if (doc.type === "payslip" && doc.employeeId) {
                router.push(`/preview?payslipId=${doc.id}&empId=${doc.employeeId}`);
                return;
            }

            const accessToken = getStoredGoogleAccessToken();
            const blob = await getDocumentFile(doc.id, { accessToken });
            if (!blob) {
                throw new Error("That file is not available yet.");
            }

            const mimeType = blob.type || doc.mimeType || "application/octet-stream";

            // PDFs: open in a proper browser tab instead of the cramped side panel
            if (mimeType === "application/pdf") {
                const url = URL.createObjectURL(blob);
                pdfCache.current[doc.id] = url;
                if (typeof window !== "undefined") {
                    window.open(url, "_blank", "noopener,noreferrer");
                }
                return;
            }

            // Images and other inline-previewable types keep using the in-app preview panel
            if (isPreviewableMimeType(mimeType)) {
                const url = URL.createObjectURL(blob);
                pdfCache.current[doc.id] = url;
                setPreviewUrl(url);
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
        } catch (error) {
            toast("Could not update contract status.", "error");
        }
    };

    const handleContractUploadClick = (contract: Contract) => {
        if (!contractSignedCopyUploadAllowed) return;
        setUploadTargetContract(contract);
        uploadInputRef.current?.click();
    };

    const handleVaultUploadClick = () => {
        if (!vaultUploadsAllowed) {
            router.push(vaultUpgradeHref);
            return;
        }
        setUploadTargetContract(null);
        uploadInputRef.current?.click();
    };

    const handleSignedDocumentSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        const targetContract = uploadTargetContract;
        event.target.value = "";

        if (!file) return;

        if (targetContract && file.type !== "application/pdf") {
            toast("Signed contracts must be uploaded as PDF files.", "error");
            return;
        } else if (!targetContract && !matchesAllowedUpload(file)) {
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
                    router.push("/upgrade?plan=standard");
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

                await saveDocumentFile(id, file);
                await saveDocumentMeta(nextDocument);
                await updateContractStatus(targetContract.id, "signed_copy_stored", { signedDocumentId: id });
                setDocuments((current) => [nextDocument, ...current]);

                // Also back up to Google Drive if connected
                const accessToken = getStoredGoogleAccessToken();
                if (accessToken) {
                    try {
                        const driveFileId = await uploadVaultFileToDrive(accessToken, file, {
                            documentId: id,
                            fileName: file.name,
                            mimeType: file.type || "application/pdf",
                        });
                        await saveDocumentMeta({ ...nextDocument, driveFileId });
                        toast("Signed copy saved and backed up to Google Drive.", "success");
                    } catch {
                        toast("Signed copy saved locally. Google Drive backup failed — retry in Settings.", "error");
                    }
                } else {
                    toast("Signed copy saved. Connect Google Drive in Settings for secure cloud backup.", "info");
                }
                return;
            }

            if (!vaultUploadsAllowed) {
                router.push(vaultUpgradeHref);
                return;
            }

            const accessToken = getStoredGoogleAccessToken();
            if (!accessToken) {
                toast("Reconnect Google in Settings before uploading to the Vault.", "error");
                return;
            }

            const driveFileId = await uploadVaultFileToDrive(accessToken, file, {
                documentId: id,
                fileName: file.name,
                mimeType: file.type || "application/octet-stream",
            });

            const nextDocument: DocumentMeta = {
                id,
                householdId: settings?.activeHouseholdId ?? "default",
                type: "archive",
                fileName: file.name,
                mimeType: file.type || "application/octet-stream",
                source: "uploaded",
                vaultCategory: nextVaultCategory,
                sizeBytes: file.size,
                createdAt,
                driveFileId,
            };

            await saveDocumentFile(id, file);
            await saveDocumentMeta(nextDocument);
            setDocuments((current) => [nextDocument, ...current]);
            toast("Document uploaded to Vault.", "success");
        } catch (error) {
            toast(error instanceof Error ? error.message : "Could not save that file.", "error");
        } finally {
            setUploadTargetContract(null);
        }
    };

    const handleDeleteVaultDocument = async (document: DocumentMeta) => {
        if (!vaultUploadsAllowed) return;
        if (typeof window !== "undefined" && !window.confirm(`Delete ${document.fileName}?`)) {
            return;
        }

        try {
            setDeletingDocumentId(document.id);
            if (document.driveFileId) {
                const accessToken = getStoredGoogleAccessToken();
                if (!accessToken) {
                    throw new Error("Reconnect Google before deleting Vault files.");
                }
                await deleteDriveFile(accessToken, document.driveFileId);
            }
            await deleteDocumentMeta(document.id);
            setDocuments((current) => current.filter((entry) => entry.id !== document.id));
            if (previewDoc?.id === document.id) {
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewDoc(null);
                setPreviewFileName(undefined);
                setPreviewUrl(null);
            }
            toast("Document removed from Vault.", "success");
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

    const hasAnyContent = documents.length > 0 || contracts.length > 0;

    if (loading) {
        return (
            <>
                <PageHeader title="Documents" subtitle="Payslips, contracts, exports, and vault history" />
                <EmptyState
                    title="Loading documents"
                    description="Pulling together your payslips, contracts, exports, and stored records."
                    icon={FolderOpen}
                />
            </>
        );
    }

    if (!canUseDocumentsHub(plan)) {
        return (
            <>
                <PageHeader title="Documents" subtitle="Payslips, contracts, exports, and vault history" />
                <FeatureGateCard
                    title="Documents hub is available on Standard and Pro"
                    description="Free keeps payroll and payslips simple for one worker. Upgrade for contracts, document uploads, exports, and longer record access."
                />
            </>
        );
    }

    return (
        <>
            <PageHeader
                title="Documents"
                subtitle="Payslips, contracts, exports, and vault history in one place"
                actions={activeTab === "Vault" ? (
                    vaultUploadsAllowed ? (
                        <Button
                            type="button"
                            className="gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] font-bold h-10 px-4 text-sm"
                            onClick={handleVaultUploadClick}
                        >
                            <Upload className="h-4 w-4 shrink-0" />
                            <span className="hidden sm:inline">Upload Document</span>
                            <span className="sm:hidden">Upload</span>
                        </Button>
                    ) : (
                        <Link href={vaultUpgradeHref}>
                            <Button variant="outline" className="gap-2 font-bold">
                                <Lock className="h-4 w-4" /> Upgrade to Pro
                            </Button>
                        </Link>
                    )
                ) : undefined}
            />

            <input
                ref={uploadInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                className="hidden"
                onChange={handleSignedDocumentSelected}
            />

            <div className="ultrawide-grid">
                <div className="ultrawide-main space-y-6">
                    <div className="flex items-center border-b border-[var(--border)] -mx-4 overflow-x-auto px-4 no-scrollbar lg:mx-0 lg:px-0">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`whitespace-nowrap border-b-2 px-3 sm:px-4 py-3 text-sm font-bold transition-colors min-h-[44px] ${activeTab === tab ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {hasAnyContent && activeTab !== "Contracts" && (
                        <FiltersBar
                            searchPlaceholder={`Search ${activeTab.toLowerCase()}...`}
                            searchValue={search}
                            onSearchChange={setSearch}
                            filters={employeeFilters}
                            onFilterToggle={(key) => setEmpFilter((current) => current === key ? "" : key)}
                        />
                    )}

                    {activeTab === "Contracts" && filteredContracts.length > 0 && (
                        <div className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs text-orange-800">
                            <strong>Review before signing:</strong>&nbsp;Templates are starting points. Verify with a labour lawyer if unsure.
                        </div>
                    )}

                    {activeTab === "Vault" && (
                        <Card className="glass-panel border-none">
                            <CardContent className="space-y-4 p-5">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Vault categories</p>
                                        <p className="mt-1 text-sm text-[var(--text-muted)]">Store signed contracts, ID copies, and other supporting records in one place.</p>
                                    </div>
                                    {vaultUploadsAllowed && (
                                        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                                            New uploads:
                                            <select
                                                value={nextVaultCategory}
                                                onChange={(event) => setNextVaultCategory(event.target.value as VaultCategory)}
                                                className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text)]"
                                            >
                                                {VAULT_CATEGORIES.map((category) => (
                                                    <option key={category.value} value={category.value}>
                                                        {category.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setVaultCategoryFilter("")}
                                        className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ${vaultCategoryFilter === "" ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] text-[var(--text-muted)]"}`}
                                    >
                                        All files
                                    </button>
                                    {VAULT_CATEGORIES.map((category) => (
                                        <button
                                            key={category.value}
                                            type="button"
                                            onClick={() => setVaultCategoryFilter((current) => current === category.value ? "" : category.value)}
                                            className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ${vaultCategoryFilter === category.value ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] text-[var(--text-muted)]"}`}
                                        >
                                            {category.label}
                                        </button>
                                    ))}
                                </div>

                                {!vaultUploadsAllowed && (
                                    <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/8 px-4 py-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-[var(--text)]">Upload anything to the Vault on Pro</p>
                                                <p className="text-sm text-[var(--text-muted)]">Standard keeps signed contract copies active on contract pages. Pro unlocks general document uploads here.</p>
                                            </div>
                                            <Link href={vaultUpgradeHref}>
                                                <Button className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">Upgrade to Pro</Button>
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {(vaultUploadsAllowed || vaultDocuments.some((document) => document.driveFileId)) && (
                                    <p className="text-xs text-[var(--text-muted)]">Your files are stored in your Google account.</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === "Exports" && plan.id !== "free" && (
                        <Card className="glass-panel border-none">
                            <CardContent className="space-y-4 p-5">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Year-end summary</p>
                                    <h2 className="mt-1 text-lg font-black text-[var(--text)]">One PDF for the full year</h2>
                                    <p className="mt-1 text-sm text-[var(--text-muted)]">Summarise finalised payroll totals and leave taken for each worker over one calendar year.</p>
                                </div>

                                {yearEndSummaryAllowed ? (
                                    <>
                                        {availableSummaryYears.length === 0 ? (
                                            <p className="text-sm text-[var(--text-muted)]">Finalise a payroll month first, then you can generate a year-end summary here.</p>
                                        ) : (
                                            <>
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                                    <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                                                        Year
                                                        <select
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
                                                    </label>
                                                    <Button
                                                        type="button"
                                                        onClick={handleGenerateYearEndSummary}
                                                        disabled={isGeneratingSummary || !summaryYear}
                                                        className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                                                    >
                                                        {isGeneratingSummary ? "Generating..." : "Generate PDF"}
                                                    </Button>
                                                </div>
                                                {selectedYearStatus && selectedYearStatus.unlockedMonthCount > 0 && (
                                                    <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/8 px-4 py-3 text-sm text-[var(--text)]">
                                                        {selectedYearStatus.unlockedMonthCount} month{selectedYearStatus.unlockedMonthCount === 1 ? "" : "s"} in {summaryYear} have not been finalised yet. The summary will only include finalised months.
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/8 px-4 py-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-[var(--text)]">Year-end summaries are available on Pro</p>
                                                <p className="text-sm text-[var(--text-muted)]">Keep one ready-to-share PDF for your records or your tax practitioner.</p>
                                            </div>
                                            <Link href={vaultUpgradeHref}>
                                                <Button className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">Upgrade to Pro</Button>
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === "Contracts" ? (
                        <ContractsTab
                            contracts={filteredContracts}
                            employees={employees}
                            documents={documents}
                            hiddenCount={contractsArchiveResult.hiddenCount}
                            archiveUpgradeHref={archiveUpgradeHref}
                            archiveUpgradeLabel={archiveUpgradeLabel}
                            openContractPreview={openContractPreview}
                            downloadContract={downloadContract}
                            handleContractUploadClick={handleContractUploadClick}
                            handlePreview={handlePreview}
                            handleMarkFinal={handleMarkFinal}
                            toast={toast}
                        />
                    ) : activeTab === "Payslips" ? (
                        filteredPayslipDocuments.length === 0 ? (
                            <EmptyState
                                title="No payslips yet"
                                description="Payslip PDFs will appear here automatically after you finalise your first pay period."
                                icon={FileText}
                                actionLabel={employees.length === 0 ? "Add your first employee" : "Run payroll"}
                                actionHref={employees.length === 0 ? "/employees/new" : "/payroll"}
                            />
                        ) : (
                            <>
                                <DataTable<DocumentMeta>
                                    data={filteredPayslipDocuments}
                                    keyField={(doc) => doc.id}
                                    emptyMessage="No payslips match your filters."
                                    columns={[
                                        {
                                            key: "fileName",
                                            label: "File",
                                            render: (doc) => (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)]">
                                                        <FileText className="h-4 w-4 text-[var(--primary)]" />
                                                    </div>
                                                    <span className="type-body-bold text-[var(--text)]">{doc.fileName}</span>
                                                </div>
                                            ),
                                        },
                                        {
                                            key: "employee",
                                            label: "Employee",
                                            render: (doc) => <span className="type-body text-[var(--text-muted)]">{doc.employeeId ? employeeNameById[doc.employeeId] ?? "Unknown" : "-"}</span>,
                                        },
                                        {
                                            key: "storage",
                                            label: "Storage",
                                            render: (doc) => (
                                                <div className="flex w-fit items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1">
                                                    {doc.driveFileId ? <Cloud className="h-3 w-3 text-[var(--primary)]" /> : <HardDrive className="h-3 w-3 text-[var(--text-muted)]" />}
                                                    <span className="text-[10px] font-black uppercase text-[var(--text-muted)]">{doc.driveFileId ? "Drive backup" : "This device"}</span>
                                                </div>
                                            ),
                                        },
                                        {
                                            key: "date",
                                            label: "Added",
                                            render: (doc) => <span className="type-body text-[var(--text-muted)]">{format(new Date(doc.createdAt), "d MMM yyyy")}</span>,
                                        },
                                        {
                                            key: "actions",
                                            label: "",
                                            align: "right",
                                            render: (doc) => (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 px-3 gap-2 rounded-full border border-[var(--border)] hover:bg-[var(--surface-2)]"
                                                    onClick={() => void handlePreview(doc)}
                                                >
                                                    <Eye className="h-4 w-4 text-[var(--primary)]" />
                                                    <span className="text-xs font-bold">Preview</span>
                                                </Button>
                                            ),
                                        },
                                    ]}
                                    renderCard={(doc) => (
                                        <Card className="glass-panel border-none">
                                            <CardContent className="p-3 space-y-2">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)]">
                                                        <FileText className="h-4 w-4 text-[var(--primary)]" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-bold text-[var(--text)] truncate">{doc.fileName}</p>
                                                        <p className="text-xs text-[var(--text-muted)]">{doc.employeeId ? employeeNameById[doc.employeeId] ?? "Unknown" : "-"} · {format(new Date(doc.createdAt), "d MMM yyyy")}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full h-9 gap-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)]"
                                                    onClick={() => void handlePreview(doc)}
                                                >
                                                    <Eye className="h-4 w-4 text-[var(--primary)]" />
                                                    <span className="text-xs font-bold">Preview</span>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    )}
                                />
                                <ArchiveBanner hiddenCount={payslipArchiveResult.hiddenCount} href={archiveUpgradeHref} label={archiveUpgradeLabel} />
                            </>
                        )
                    ) : activeTab === "Exports" ? (
                        filteredExportDocuments.length === 0 ? (
                            <EmptyState
                                title="No exports available"
                                description="Official documents like Year-End Summaries and UIF declarations will be generated here. Finalise a payroll month to unlock your first export."
                                icon={FileSpreadsheet}
                            />
                        ) : (
                            <>
                                <DataTable<DocumentMeta>
                                    data={filteredExportDocuments}
                                    keyField={(doc) => doc.id}
                                    emptyMessage="No exports match your filters."
                                    columns={[
                                        {
                                            key: "fileName",
                                            label: "File",
                                            render: (doc) => (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)]">
                                                        <FileSpreadsheet className="h-4 w-4 text-[var(--primary)]" />
                                                    </div>
                                                    <span className="type-body-bold text-[var(--text)]">{doc.fileName}</span>
                                                </div>
                                            ),
                                        },
                                        {
                                            key: "storage",
                                            label: "Storage",
                                            render: (doc) => (
                                                <div className="flex w-fit items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1">
                                                    {doc.driveFileId ? <Cloud className="h-3 w-3 text-[var(--primary)]" /> : <HardDrive className="h-3 w-3 text-[var(--text-muted)]" />}
                                                    <span className="text-[10px] font-black uppercase text-[var(--text-muted)]">{doc.driveFileId ? "Drive backup" : "This device"}</span>
                                                </div>
                                            ),
                                        },
                                        {
                                            key: "date",
                                            label: "Added",
                                            render: (doc) => <span className="type-body text-[var(--text-muted)]">{format(new Date(doc.createdAt), "d MMM yyyy")}</span>,
                                        },
                                        {
                                            key: "actions",
                                            label: "",
                                            align: "right",
                                            render: (doc) => (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 px-3 gap-2 rounded-full border border-[var(--border)] hover:bg-[var(--surface-2)]"
                                                    onClick={() => void handlePreview(doc)}
                                                >
                                                    <Eye className="h-4 w-4 text-[var(--primary)]" />
                                                    <span className="text-xs font-bold">Preview</span>
                                                </Button>
                                            ),
                                        },
                                    ]}
                                    renderCard={(doc) => (
                                        <Card className="glass-panel border-none">
                                            <CardContent className="p-3 space-y-2">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)]">
                                                        <FileSpreadsheet className="h-4 w-4 text-[var(--primary)]" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-bold text-[var(--text)] truncate">{doc.fileName}</p>
                                                        <p className="text-xs text-[var(--text-muted)]">{format(new Date(doc.createdAt), "d MMM yyyy")}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full h-9 gap-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)]"
                                                    onClick={() => void handlePreview(doc)}
                                                >
                                                    <Eye className="h-4 w-4 text-[var(--primary)]" />
                                                    <span className="text-xs font-bold">Preview</span>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    )}
                                />
                                <ArchiveBanner hiddenCount={exportArchiveResult.hiddenCount} href={archiveUpgradeHref} label={archiveUpgradeLabel} />
                            </>
                        )
                    ) : filteredVaultDocuments.length === 0 ? (
                        vaultUploadsAllowed ? (
                            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)] p-10 text-center">
                                <FolderOpen className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" strokeWidth={1.5} />
                                <p className="text-sm font-bold text-[var(--text)]">Secure Document Vault</p>
                                <p className="mt-1 text-sm text-[var(--text-muted)]">A safe place to upload and store external employee records. Keep ID copies, sick notes, and compliance forms organised here.</p>
                                <Button className="mt-4 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]" onClick={handleVaultUploadClick}>
                                    Upload document
                                </Button>
                            </div>
                        ) : (
                            <FeatureGateCard
                                title="Secure Document Vault"
                                description="Vault uploads are available on Pro. A safe place to upload and store external employee records. Keep ID copies, sick notes, and compliance forms organised here."
                                ctaLabel="Upgrade to Pro"
                                href={vaultUpgradeHref}
                                eyebrow="Pro"
                                benefits={[
                                    "Private document vault in your Google account",
                                    "All uploaded files stay in one place",
                                    "Upload general household employment paperwork",
                                ]}
                            />
                        )
                    ) : (
                        <DataTable<DocumentMeta>
                            data={filteredVaultDocuments}
                            keyField={(doc) => doc.id}
                            emptyMessage="No Vault files match your filters."
                            columns={[
                                {
                                    key: "fileName",
                                    label: "File",
                                    render: (doc) => (
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)]">
                                                <FileText className="h-4 w-4 text-[var(--primary)]" />
                                            </div>
                                            <div>
                                                <p className="type-body-bold text-[var(--text)]">{doc.fileName}</p>
                                                <p className="text-xs text-[var(--text-muted)]">{VAULT_CATEGORIES.find((category) => category.value === doc.vaultCategory)?.label ?? "Other"}</p>
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    key: "employee",
                                    label: "Employee",
                                    render: (doc) => <span className="type-body text-[var(--text-muted)]">{doc.employeeId ? employeeNameById[doc.employeeId] ?? "Unknown" : "-"}</span>,
                                },
                                {
                                    key: "storage",
                                    label: "Storage",
                                    render: (doc) => (
                                        <div className="flex w-fit items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1">
                                            {doc.driveFileId ? <Cloud className="h-3 w-3 text-[var(--primary)]" /> : <HardDrive className="h-3 w-3 text-[var(--text-muted)]" />}
                                            <span className="text-[10px] font-black uppercase text-[var(--text-muted)]">{doc.driveFileId ? "Google account" : "This device"}</span>
                                        </div>
                                    ),
                                },
                                {
                                    key: "date",
                                    label: "Added",
                                    render: (doc) => <span className="type-body text-[var(--text-muted)]">{format(new Date(doc.createdAt), "d MMM yyyy")}</span>,
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
                                                className="h-9 px-3 gap-2 rounded-full border border-[var(--border)] hover:bg-[var(--surface-2)]"
                                                onClick={() => void handlePreview(doc)}
                                            >
                                                <Eye className="h-4 w-4 text-[var(--primary)]" />
                                                <span className="text-xs font-bold">Preview</span>
                                            </Button>
                                            {vaultUploadsAllowed ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 px-3 gap-2 rounded-full border border-red-200 text-red-700 hover:text-red-800 hover:bg-red-50"
                                                    disabled={deletingDocumentId === doc.id}
                                                    onClick={() => void handleDeleteVaultDocument(doc)}
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
                                            <CardContent className="p-3 space-y-2">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)]">
                                                        <FileText className="h-4 w-4 text-[var(--primary)]" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-bold text-[var(--text)] truncate">{doc.fileName}</p>
                                                        <p className="text-xs text-[var(--text-muted)]">{VAULT_CATEGORIES.find((c) => c.value === doc.vaultCategory)?.label ?? "Other"} · {format(new Date(doc.createdAt), "d MMM yyyy")}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="flex-1 h-9 gap-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)]"
                                                        onClick={() => void handlePreview(doc)}
                                                    >
                                                        <Eye className="h-4 w-4 text-[var(--primary)]" />
                                                        <span className="text-xs font-bold">Preview</span>
                                                    </Button>
                                                    {vaultUploadsAllowed ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="flex-1 h-9 gap-2 rounded-xl border border-red-200 text-red-700 hover:text-red-800 hover:bg-red-50"
                                                            disabled={deletingDocumentId === doc.id}
                                                            onClick={() => void handleDeleteVaultDocument(doc)}
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
                    )}
                </div>
                {hasAnyContent && (
                    <aside className="ultrawide-panel hidden 2xl:block">
                        <Card className="glass-panel sticky top-0 border-none p-5">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                                    <History className="h-4 w-4 text-[var(--primary)]" />
                                    One documentation hub
                                </div>
                                <p className="text-sm text-[var(--text-muted)]">
                                    This screen keeps payslips, contracts, exports, and uploaded records together so nothing feels split across the app.
                                </p>
                                {activeTab === "Contracts" && (
                                    <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                                            <Upload className="h-4 w-4 text-[var(--primary)]" />
                                            Signed copy workflow
                                        </div>
                                        <p className="text-sm text-[var(--text-muted)]">
                                            Use the contract draft first. After you print and sign the final version, upload the signed copy here so it stays with the rest of the employee record.
                                        </p>
                                    </div>
                                )}
                                {activeTab === "Vault" && (
                                    <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                                            <Cloud className="h-4 w-4 text-[var(--primary)]" />
                                            Vault storage
                                        </div>
                                        <p className="text-sm text-[var(--text-muted)]">
                                            Existing uploaded files always stay visible here. Pro unlocks new uploads for contracts, employee paperwork, and legal records.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </aside>
                )}
            </div>

            {isGeneratingPreview && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full bg-[var(--primary)] p-4 text-white shadow-2xl animate-pulse">
                    Generating preview...
                </div>
            )}

            {previewUrl && (
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
                        document.body.removeChild(anchor);
                    }}
                />
            )}
        </>
    );
}
