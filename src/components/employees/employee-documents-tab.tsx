"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Cloud, Eye, FileText, FolderOpen, HardDrive, Lock, ScrollText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FeatureGateCard } from "@/components/ui/feature-gate-card";
import { DocumentPreview } from "@/components/ui/document-preview";
import { ContractRow } from "@/components/documents/ContractRow";
import { useToast } from "@/components/ui/toast";
import { canUseContractSignedCopyUpload, canUseVaultUploads } from "@/lib/entitlements";
import { getStoredGoogleAccessToken } from "@/lib/google-session";
import { deleteDriveFile, uploadVaultFileToDrive } from "@/lib/google-drive";
import { deleteDocumentMeta, getDocumentFile, saveDocumentFile, saveDocumentMeta, updateContractStatus } from "@/lib/storage";
import { buildContractFileName, generateEmploymentContract } from "@/lib/contracts/pdfGenerator";
import type { Contract, DocumentMeta, Employee, EmployerSettings } from "@/lib/schema";
import type { PlanConfig } from "@/config/plans";
import { useRouter } from "next/navigation";

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

function isPreviewableMimeType(mimeType: string | undefined): boolean {
    if (!mimeType) return false;
    return mimeType === "application/pdf" || mimeType.startsWith("image/");
}

const VAULT_MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_UPLOAD_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".docx"];

function matchesAllowedUpload(file: File): boolean {
    const lowerName = file.name.toLowerCase();
    return ACCEPTED_UPLOAD_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

type Tab = "Contracts" | "Vault";
type VaultCategory = "contracts" | "employee-docs" | "compliance" | "other";

const VAULT_CATEGORIES: Array<{ value: VaultCategory; label: string }> = [
    { value: "contracts", label: "Contracts" },
    { value: "employee-docs", label: "Employee docs" },
    { value: "compliance", label: "Compliance" },
    { value: "other", label: "Other" },
];

export function EmployeeDocumentsTab({
    employee,
    contracts,
    documents,
    settings,
    currentPlan,
    onDocumentsChange,
}: {
    employee: Employee;
    contracts: Contract[];
    documents: DocumentMeta[];
    settings: EmployerSettings;
    currentPlan: PlanConfig;
    onDocumentsChange?: () => void;
}) {
    const { toast } = useToast();
    const router = useRouter();
    const [activeTab, setActiveTab] = React.useState<Tab>("Contracts");
    const [contractStateFilter, setContractStateFilter] = React.useState<Contract["status"] | "needs_action" | "All">("All");
    const [vaultCategoryFilter, setVaultCategoryFilter] = React.useState<string>("");
    const [nextVaultCategory, setNextVaultCategory] = React.useState<VaultCategory>("employee-docs");
    
    const [previewDoc, setPreviewDoc] = React.useState<DocumentMeta | null>(null);
    const [previewFileName, setPreviewFileName] = React.useState<string | undefined>(undefined);
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = React.useState(false);
    const [deletingDocumentId, setDeletingDocumentId] = React.useState<string | null>(null);
    
    const uploadInputRef = React.useRef<HTMLInputElement | null>(null);
    const pdfCache = React.useRef<Record<string, string>>({});
    const [uploadTargetContract, setUploadTargetContract] = React.useState<Contract | null>(null);

    const vaultUploadsAllowed = canUseVaultUploads(currentPlan);
    const contractSignedCopyUploadAllowed = canUseContractSignedCopyUpload(currentPlan);
    const vaultUpgradeHref = "/upgrade?plan=pro";

    const employeeVaultDocuments = React.useMemo(() => {
        return documents.filter(
            (doc) => doc.type === "archive" && doc.source === "uploaded" && doc.employeeId === employee.id
        );
    }, [documents, employee.id]);

    const filteredContracts = React.useMemo(() => {
        return contracts.filter((contract) => {
            if (contractStateFilter !== "All") {
                if (contractStateFilter === "needs_action") {
                    if (contract.status !== "draft" && contract.status !== "awaiting_signed_copy") return false;
                } else if (contract.status !== contractStateFilter) {
                    return false;
                }
            }
            return true;
        });
    }, [contracts, contractStateFilter]);

    const filteredVaultDocuments = React.useMemo(() => {
        let filtered = employeeVaultDocuments;
        if (vaultCategoryFilter !== "") {
            filtered = filtered.filter((doc) => doc.vaultCategory === vaultCategoryFilter);
        }
        return filtered;
    }, [employeeVaultDocuments, vaultCategoryFilter]);

    const handlePreview = async (doc: DocumentMeta) => {
        setPreviewDoc(doc);
        setPreviewFileName(doc.fileName);

        if (pdfCache.current[doc.id]) {
            setPreviewUrl(pdfCache.current[doc.id]);
            return;
        }

        setIsGeneratingPreview(true);

        try {
            const accessToken = getStoredGoogleAccessToken();
            const blob = await getDocumentFile(doc.id, { accessToken });
            if (!blob) {
                throw new Error("That file is not available yet.");
            }

            const mimeType = blob.type || doc.mimeType || "application/octet-stream";
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

    const closePreview = React.useCallback(() => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewDoc(null);
        setPreviewFileName(undefined);
        setPreviewUrl(null);
    }, [previewUrl]);

    const openContractPreview = (contract: Contract) => {
        router.push(`/contracts/${contract.id}/preview`);
    };

    const downloadContract = async (contract: Contract) => {
        if (!settings) return;
        const pdfBytes = await generateEmploymentContract(contract, employee, settings);
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
        downloadBlob(blob, buildContractFileName(contract, employee));

        if (contract.status === "draft") {
            await updateContractStatus(contract.id, "awaiting_signed_copy");
            if (onDocumentsChange) onDocumentsChange();
        }
    };

    const handleMarkFinal = async (contract: Contract) => {
        try {
            await updateContractStatus(contract.id, "final", { finalizedAt: new Date().toISOString() });
            toast("Contract marked as final.", "success");
            if (onDocumentsChange) onDocumentsChange();
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

                const nextDocument: DocumentMeta = {
                    id,
                    householdId: employee.householdId ?? settings?.activeHouseholdId ?? "default",
                    type: "archive",
                    employeeId: employee.id,
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
                toast("Signed copy saved to Documents.", "success");
                if (onDocumentsChange) onDocumentsChange();
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
                employeeId: employee.id,
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
            toast("Document uploaded to Vault.", "success");
            if (onDocumentsChange) onDocumentsChange();
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
            if (previewDoc?.id === document.id) {
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewDoc(null);
                setPreviewFileName(undefined);
                setPreviewUrl(null);
            }
            toast("Document removed from Vault.", "success");
            if (onDocumentsChange) onDocumentsChange();
        } catch (error) {
            toast(error instanceof Error ? error.message : "Could not delete that file.", "error");
        } finally {
            setDeletingDocumentId(null);
        }
    };

    return (
        <div className="space-y-6">
            <input
                ref={uploadInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                className="hidden"
                onChange={handleSignedDocumentSelected}
            />
            
            <div className="flex items-center gap-1 border-b border-[var(--border)] -mx-4 overflow-x-auto px-4 no-scrollbar lg:mx-0 lg:px-0">
                {(["Contracts", "Vault"] as const).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition-colors ${activeTab === tab ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === "Contracts" && filteredContracts.length > 0 && (
                <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs text-orange-800">
                    <strong>Review before signing:</strong>&nbsp;Templates are starting points. Verify with a labour lawyer if unsure.
                </div>
            )}

            {activeTab === "Vault" && (
                <Card className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-1)] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                    <CardContent className="space-y-4 p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Vault categories</p>
                                <p className="mt-1 text-sm text-[var(--text-muted)]">Store ID copies and supporting records.</p>
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
                                        <p className="text-sm text-[var(--text-muted)]">Pro unlocks general document uploads in this vault section.</p>
                                    </div>
                                    <Link href={vaultUpgradeHref}>
                                        <Button className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">Upgrade to Pro</Button>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {(vaultUploadsAllowed || employeeVaultDocuments.some((document) => document.driveFileId)) && (
                            <p className="text-xs text-[var(--text-muted)]">Files are securely stored in your linked Google account.</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {activeTab === "Contracts" ? (
                contracts.length > 0 ? (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap gap-2">
                                {(["All", "needs_action", "draft", "awaiting_signed_copy", "final"] as const).map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => setContractStateFilter(status)}
                                        className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ${contractStateFilter === status ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]/50"}`}
                                    >
                                        {status === "All" ? "All" : status === "needs_action" ? "Needs action" : status === "awaiting_signed_copy" ? "Waiting for upload" : status}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-4">
                                <Link href={`/contracts/new?employeeId=${employee.id}`}>
                                    <Button className="gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] font-bold">
                                        <ScrollText className="h-4 w-4" /> New Contract
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {filteredContracts.map((contract) => (
                                <ContractRow
                                    key={contract.id}
                                    contract={contract}
                                    employee={employee}
                                    onViewPreview={() => openContractPreview(contract)}
                                    onDownloadPdf={() => downloadContract(contract)}
                                    onUploadSigned={() => handleContractUploadClick(contract)}
                                    onViewSigned={() => {
                                        if (contract.signedDocumentId) {
                                            const doc = documents.find((d) => d.id === contract.signedDocumentId);
                                            if (doc) handlePreview(doc);
                                            else toast("Signed document could not be found.", "error");
                                        }
                                    }}
                                    onMarkFinal={() => handleMarkFinal(contract)}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end mb-6">
                            <Link href={`/contracts/new?employeeId=${employee.id}`}>
                                <Button className="gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] font-bold">
                                    <ScrollText className="h-4 w-4" /> New Contract
                                </Button>
                            </Link>
                        </div>
                        <EmptyState
                            title="No contracts yet"
                            description={`Create an employment contract for ${employee.name}.`}
                            icon={ScrollText}
                            actionLabel="Create contract"
                            actionHref={`/contracts/new?employeeId=${employee.id}`}
                        />
                    </>
                )
            ) : employeeVaultDocuments.length === 0 ? (
                vaultUploadsAllowed ? (
                    <div className="rounded-[22px] border border-dashed border-[var(--border)] bg-[var(--surface-1)] p-10 text-center shadow-sm">
                        <FolderOpen className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" strokeWidth={1.5} />
                        <p className="text-sm font-bold text-[var(--text)]">No Vault files for {employee.name}</p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">Upload ID copies, compliance paperwork or certifications.</p>
                        <Button className="mt-4 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]" onClick={handleVaultUploadClick}>
                            Upload document
                        </Button>
                    </div>
                ) : (
                    <FeatureGateCard
                        title="Store ID copies & supporting documents"
                        description="Vault uploads are available on Pro."
                        ctaLabel="Upgrade to Pro"
                        href={vaultUpgradeHref}
                        eyebrow="Pro"
                        benefits={[
                            "Private document vault in your Google account",
                            "All uploaded files stay organised by employee",
                            "Upload compliance/supporting records",
                        ]}
                    />
                )
            ) : (
                <div className="space-y-4">
                    {vaultUploadsAllowed && (
                        <div className="flex justify-end mb-2">
                            <Button className="gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] font-bold" onClick={handleVaultUploadClick}>
                                <Upload className="h-4 w-4" /> Upload Document
                            </Button>
                        </div>
                    )}
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
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => void handlePreview(doc)}>
                                            <Eye className="h-4 w-4 text-[var(--primary)]" />
                                        </Button>
                                        {vaultUploadsAllowed ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 w-9 p-0"
                                                disabled={deletingDocumentId === doc.id}
                                                onClick={() => void handleDeleteVaultDocument(doc)}
                                            >
                                                <Trash2 className="h-4 w-4 text-[var(--text-muted)]" />
                                            </Button>
                                        ) : null}
                                    </div>
                                ),
                            },
                        ]}
                    />
                </div>
            )}

            {isGeneratingPreview && (
                <div className="fixed bottom-6 right-6 z-[60] flex items-center justify-center rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-2xl animate-pulse">
                    Opening file...
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
        </div>
    );
}
