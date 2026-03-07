"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Cloud, Download, Eye, FileSpreadsheet, FileText, FolderOpen, HardDrive, History, Lock, ScrollText, Upload } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { FeatureGateCard } from "@/components/ui/feature-gate-card";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { FiltersBar, type FilterChip } from "@/components/ui/filters-bar";
import { DocumentPreview } from "@/components/ui/document-preview";
import { useToast } from "@/components/ui/toast";
import { getContracts, getDocumentFile, getDocuments, getEmployees, getPayslipsForEmployee, getSettings, saveDocumentFile, saveDocumentMeta } from "@/lib/storage";
import { Contract, DocumentMeta, Employee } from "@/lib/schema";
import { generatePayslipPdfBytes } from "@/lib/pdf";
import { generateEmploymentContract } from "@/lib/contract-pdf";
import { canUseDocumentsHub, getUserPlan, isRecordWithinArchive } from "@/lib/entitlements";
import { PLANS, PlanConfig } from "../../../config/plans";

const TABS = ["Payslips", "Contracts", "Exports", "Vault"] as const;
type Tab = typeof TABS[number];

const TAB_TYPE_MAP: Record<Exclude<Tab, "Contracts">, DocumentMeta["type"]> = {
    Payslips: "payslip",
    Exports: "export",
    Vault: "archive",
};

export default function DocumentsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = (searchParams.get("tab") || "").toLowerCase();
    const defaultTab = initialTab === "contracts" ? "Contracts" : initialTab === "vault" ? "Vault" : initialTab === "exports" ? "Exports" : "Payslips";

    const [activeTab, setActiveTab] = React.useState<Tab>(defaultTab as Tab);
    const [loading, setLoading] = React.useState(true);
    const [documents, setDocuments] = React.useState<DocumentMeta[]>([]);
    const [contracts, setContracts] = React.useState<Contract[]>([]);
    const [employees, setEmployees] = React.useState<Employee[]>([]);
    const [plan, setPlan] = React.useState<PlanConfig>(PLANS.free);
    const [settings, setSettings] = React.useState<Awaited<ReturnType<typeof getSettings>> | null>(null);
    const [search, setSearch] = React.useState("");
    const [empFilter, setEmpFilter] = React.useState<string>("");
    const [previewDoc, setPreviewDoc] = React.useState<DocumentMeta | null>(null);
    const [previewFileName, setPreviewFileName] = React.useState<string | undefined>(undefined);
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const uploadInputRef = React.useRef<HTMLInputElement | null>(null);
    const [uploadTargetContract, setUploadTargetContract] = React.useState<Contract | null>(null);

    React.useEffect(() => {
        async function load() {
            setLoading(true);
            const [docs, contractRows, employeeRows, userSettings] = await Promise.all([
                getDocuments(),
                getContracts(),
                getEmployees(),
                getSettings(),
            ]);
            setDocuments(docs);
            setContracts(contractRows);
            setEmployees(employeeRows);
            setPlan(getUserPlan(userSettings));
            setSettings(userSettings);
            setLoading(false);
        }
        load();
    }, []);

    const employeeFilters: FilterChip[] = employees.map((employee) => ({
        key: employee.id,
        label: employee.name,
        active: empFilter === employee.id,
    }));

    const filteredDocuments = React.useMemo(() => {
        if (activeTab === "Contracts") return [];
        return documents.filter((document) => {
            if (document.type !== TAB_TYPE_MAP[activeTab]) return false;
            if (empFilter && document.employeeId !== empFilter) return false;
            if (!search) return true;
            const employeeName = employees.find((employee) => employee.id === document.employeeId)?.name.toLowerCase() ?? "";
            return document.fileName.toLowerCase().includes(search.toLowerCase()) || employeeName.includes(search.toLowerCase());
        });
    }, [activeTab, documents, empFilter, employees, search]);

    const filteredContracts = React.useMemo(() => {
        if (activeTab !== "Contracts") return [];
        return contracts.filter((contract) => {
            if (empFilter && contract.employeeId !== empFilter) return false;
            if (!search) return true;
            const employeeName = employees.find((employee) => employee.id === contract.employeeId)?.name.toLowerCase() ?? "";
            return contract.jobTitle.toLowerCase().includes(search.toLowerCase()) || employeeName.includes(search.toLowerCase());
        });
    }, [activeTab, contracts, empFilter, employees, search]);

    const handlePreview = async (doc: DocumentMeta) => {
        setPreviewDoc(doc);
        setPreviewFileName(doc.fileName);
        if (doc.source === "uploaded") {
            setIsGenerating(true);
            try {
                const blob = await getDocumentFile(doc.id);
                if (!blob) throw new Error("Uploaded file not found.");
                setPreviewUrl(URL.createObjectURL(blob));
            } catch (error) {
                toast(error instanceof Error ? error.message : "Could not open the uploaded file", "error");
                setPreviewDoc(null);
                setPreviewFileName(undefined);
            } finally {
                setIsGenerating(false);
            }
            return;
        }

        if (doc.type === "payslip" && doc.employeeId) {
            setIsGenerating(true);
            try {
                const [payslips, settings] = await Promise.all([getPayslipsForEmployee(doc.employeeId), getSettings()]);
                const employee = employees.find((entry) => entry.id === doc.employeeId);
                const payslip = payslips.find((entry) => entry.id === doc.id);
                if (payslip && employee && settings) {
                    const pdfBytes = await generatePayslipPdfBytes(employee, payslip, settings);
                    const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
                    setPreviewUrl(URL.createObjectURL(blob));
                }
            } finally {
                setIsGenerating(false);
            }
        }
    };

    const handleContractUploadClick = (contract: Contract) => {
        setUploadTargetContract(contract);
        uploadInputRef.current?.click();
    };

    const handleSignedDocumentSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        const targetContract = uploadTargetContract;
        event.target.value = "";
        if (!file) return;
        const employee = targetContract
            ? employees.find((entry) => entry.id === targetContract.employeeId)
            : employees.find((entry) => entry.id === empFilter);

        try {
            const id = crypto.randomUUID();
            const createdAt = new Date().toISOString();
            const nextDocument: DocumentMeta = {
                id,
                householdId: employee?.householdId ?? settings?.activeHouseholdId ?? "default",
                type: "archive",
                employeeId: employee?.id,
                periodId: targetContract?.id,
                fileName: file.name,
                mimeType: file.type || "application/octet-stream",
                source: "uploaded",
                sizeBytes: file.size,
                createdAt,
            };
            await saveDocumentFile(id, file);
            await saveDocumentMeta(nextDocument);
            setDocuments((current) => [nextDocument, ...current]);
            toast(targetContract ? "Signed copy saved to Documents." : "Document uploaded to Vault.", "success");
        } catch (error) {
            toast(error instanceof Error ? error.message : "Could not save the signed copy.", "error");
        } finally {
            setUploadTargetContract(null);
        }
    };

    const buildContractFileName = (contract: Contract, employee: Employee | undefined) => {
        const safeName = (employee?.name || "employee").replace(/\s+/g, "_");
        return `Contract_${safeName}_v${contract.version}.pdf`;
    };

    const openContractPreview = async (contract: Contract) => {
        if (!settings) return;
        const employee = employees.find((entry) => entry.id === contract.employeeId);
        if (!employee) return;
        setPreviewDoc(null);
        setPreviewFileName(buildContractFileName(contract, employee));
        setIsGenerating(true);
        try {
            const pdfBytes = await generateEmploymentContract(contract, employee, settings);
            const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
            setPreviewUrl(URL.createObjectURL(blob));
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadContract = async (contract: Contract) => {
        if (!settings) return;
        const employee = employees.find((entry) => entry.id === contract.employeeId);
        if (!employee) return;
        const pdfBytes = await generateEmploymentContract(contract, employee, settings);
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = buildContractFileName(contract, employee);
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const closePreview = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewDoc(null);
        setPreviewFileName(undefined);
        setPreviewUrl(null);
    };

    const noContent = documents.length === 0 && contracts.length === 0;

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
                actions={activeTab === "Contracts" ? (
                    <div className="flex items-center gap-2">
                        <Link href="/contracts/new">
                            <Button className="gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] font-bold">
                                <ScrollText className="h-4 w-4" /> New Contract
                            </Button>
                        </Link>
                    </div>
                ) : activeTab === "Vault" ? (
                    <Button
                        type="button"
                        className="gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] font-bold"
                        onClick={() => {
                            setUploadTargetContract(null);
                            uploadInputRef.current?.click();
                        }}
                    >
                        <Upload className="h-4 w-4" /> Upload Document
                    </Button>
                ) : undefined}
            />
            <input
                ref={uploadInputRef}
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={handleSignedDocumentSelected}
            />

            {activeTab === "Contracts" && (
                <Alert variant="warning">
                    <AlertTitle>Review before signing</AlertTitle>
                    <AlertDescription>
                        Contract templates are a starting point only, not legal advice. Check the wording against the real arrangement, verify against official guidance, and keep the signed final version in Documents.
                    </AlertDescription>
                </Alert>
            )}

            <div className="ultrawide-grid">
                <div className="ultrawide-main space-y-6">
                    <div className="flex items-center gap-1 border-b border-[var(--border)] -mx-4 px-4 overflow-x-auto no-scrollbar lg:mx-0 lg:px-0">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-3 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === tab ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {!noContent && (
                        <FiltersBar
                            searchPlaceholder={`Search ${activeTab.toLowerCase()}...`}
                            searchValue={search}
                            onSearchChange={setSearch}
                            filters={employeeFilters}
                            onFilterToggle={(key) => setEmpFilter((current) => current === key ? "" : key)}
                        />
                    )}

                    {noContent ? (
                        <EmptyState
                            title="No documents yet"
                            description="Your payslips, contracts, exports, and archived records will appear here once you start using the app."
                            icon={FolderOpen}
                            highlights={[
                                "Payslip PDFs after you run a pay period.",
                                "Contract drafts and uploaded signed copies.",
                                "Exports such as UIF and annual filing downloads.",
                                "Older records and supporting documents kept in one place.",
                            ]}
                            actionLabel="Add your first employee"
                            actionHref="/employees/new"
                            secondaryActionLabel="See example documents"
                            secondaryActionHref="/examples"
                        />
                    ) : activeTab === "Contracts" ? (
                        filteredContracts.length === 0 ? (
                            <EmptyState
                                title="No contracts yet"
                                description="Contracts now live here with the rest of your employee documents."
                                icon={ScrollText}
                                actionLabel="Create contract"
                                actionHref="/contracts/new"
                            />
                        ) : (
                            <DataTable<Contract>
                                data={filteredContracts}
                                keyField={(contract) => contract.id}
                                onRowClick={openContractPreview}
                                columns={[
                                    {
                                        key: "employee",
                                        label: "Employee",
                                        render: (contract) => <span className="type-body-bold text-[var(--text)]">{employees.find((employee) => employee.id === contract.employeeId)?.name ?? "Unknown"}</span>,
                                    },
                                    {
                                        key: "jobTitle",
                                        label: "Job title",
                                        render: (contract) => <span className="type-body text-[var(--text-muted)]">{contract.jobTitle}</span>,
                                    },
                                    {
                                        key: "status",
                                        label: "Status",
                                        render: (contract) => <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-bold text-[var(--text-muted)]">{contract.status === "draft" ? "Draft" : contract.status}</span>,
                                    },
                                    {
                                        key: "updatedAt",
                                        label: "Updated",
                                        render: (contract) => <span className="type-body text-[var(--text-muted)]">{format(new Date(contract.updatedAt), "d MMM yyyy")}</span>,
                                    },
                                    {
                                        key: "actions",
                                        label: "",
                                        align: "right",
                                        render: (contract) => (
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 w-9 p-0"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        void openContractPreview(contract);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4 text-[var(--primary)]" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 w-9 p-0"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        void downloadContract(contract);
                                                    }}
                                                >
                                                    <Download className="h-4 w-4 text-[var(--text-muted)]" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 w-9 p-0"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleContractUploadClick(contract);
                                                    }}
                                                >
                                                    <Upload className="h-4 w-4 text-[var(--text-muted)]" />
                                                </Button>
                                            </div>
                                        ),
                                    },
                                ]}
                                renderCard={(contract) => {
                                    const employee = employees.find((entry) => entry.id === contract.employeeId);
                                    return (
                                        <button
                                            type="button"
                                            onClick={() => void openContractPreview(contract)}
                                            className="glass-panel rounded-xl p-4 space-y-3 text-left w-full"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-bold text-[var(--text)]">{employee?.name ?? "Unknown"}</p>
                                                    <p className="text-xs text-[var(--text-muted)]">{contract.jobTitle}</p>
                                                </div>
                                                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--text-muted)]">
                                                    {contract.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                                                <span>Updated {format(new Date(contract.updatedAt), "d MMM yyyy")}</span>
                                                <span>Open draft</span>
                                            </div>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 px-3"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        void downloadContract(contract);
                                                    }}
                                                >
                                                    <Download className="mr-2 h-4 w-4" /> Download
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 px-3"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleContractUploadClick(contract);
                                                    }}
                                                >
                                                    <Upload className="mr-2 h-4 w-4" /> Upload signed copy
                                                </Button>
                                            </div>
                                        </button>
                                    );
                                }}
                            />
                        )
                    ) : (
                        <DataTable<DocumentMeta>
                            data={filteredDocuments}
                            keyField={(doc) => doc.id}
                            emptyMessage={`No ${activeTab.toLowerCase()} match your filters.`}
                            columns={[
                                {
                                    key: "fileName",
                                    label: "File",
                                    render: (doc) => (
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                                {doc.type === "export" ? <FileSpreadsheet className="h-4 w-4 text-[var(--primary)]" /> : <FileText className="h-4 w-4 text-[var(--primary)]" />}
                                            </div>
                                            <div>
                                                <span className="type-body-bold text-[var(--text)]">{doc.fileName}</span>
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    key: "employee",
                                    label: "Employee",
                                    render: (doc) => <span className="type-body text-[var(--text-muted)]">{doc.employeeId ? employees.find((employee) => employee.id === doc.employeeId)?.name ?? "Unknown" : "-"}</span>,
                                },
                                {
                                    key: "storage",
                                    label: "Storage",
                                    render: (doc) => (
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] w-fit">
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
                                    render: (doc) => {
                                        const isLocked = !isRecordWithinArchive(plan, doc.createdAt);
                                        if (isLocked) {
                                            return (
                                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => router.push("/upgrade")}>
                                                    <Lock className="h-4 w-4 text-[var(--text-muted)]" />
                                                </Button>
                                            );
                                        }
                                        return (
                                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => handlePreview(doc)}>
                                                <Eye className="h-4 w-4 text-[var(--primary)]" />
                                            </Button>
                                        );
                                    },
                                },
                            ]}
                        />
                    )}
                </div>

                {!noContent && (
                    <aside className="ultrawide-panel hidden 2xl:block">
                        <Card className="glass-panel border-none p-5 sticky top-0">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                                    <History className="h-4 w-4 text-[var(--primary)]" />
                                    One documentation hub
                                </div>
                                <p className="text-sm text-[var(--text-muted)]">
                                    This screen keeps payslips, contracts, exports, and uploaded signed records together so nothing feels split across the app.
                                </p>
                                {activeTab === "Contracts" && (
                                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4 space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                                            <Upload className="h-4 w-4 text-[var(--primary)]" />
                                            Signed copy workflow
                                        </div>
                                        <p className="text-sm text-[var(--text-muted)]">
                                            Use the contract draft first. After you print and sign the final version, upload the signed copy here so it stays with the rest of the employee record.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </aside>
                )}
            </div>

            {isGenerating && (
                <div className="fixed flex items-center justify-center p-4 bg-[var(--primary)] text-white rounded-full bottom-6 right-6 shadow-2xl z-50 animate-pulse">
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

