import * as React from "react";
import Link from "next/link";
import { ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ContractRow } from "@/components/documents/ContractRow";
import type { Contract, Employee, DocumentMeta } from "@/lib/schema";

interface ContractsTabProps {
    contracts: Contract[];
    employees: Employee[];
    documents: DocumentMeta[];
    hiddenCount: number;
    archiveUpgradeHref: string;
    archiveUpgradeLabel: string;
    contractStateFilter: string;
    setContractStateFilter: (filter: any) => void;
    openContractPreview: (contract: Contract) => void;
    downloadContract: (contract: Contract) => void;
    handleContractUploadClick: (contract: Contract) => void;
    handlePreview: (doc: DocumentMeta) => void;
    handleMarkFinal: (contract: Contract) => void;
    toast: (msg: string, type: "error" | "success") => void;
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

export function ContractsTab({
    contracts,
    employees,
    documents,
    hiddenCount,
    archiveUpgradeHref,
    archiveUpgradeLabel,
    contractStateFilter,
    setContractStateFilter,
    openContractPreview,
    downloadContract,
    handleContractUploadClick,
    handlePreview,
    handleMarkFinal,
    toast,
}: ContractsTabProps) {
    if (contracts.length === 0) {
        return (
            <>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <a href="/guide-contracts" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[var(--primary)] hover:underline flex items-center gap-1">
                            View contract guide
                        </a>
                    </div>
                    <Link href="/contracts/new">
                        <Button className="gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] font-bold">
                            <ScrollText className="h-4 w-4" /> New Contract
                        </Button>
                    </Link>
                </div>
                <EmptyState
                    title="No contracts yet"
                    description="Contracts now live here with the rest of your employee documents."
                    icon={ScrollText}
                    actionLabel="Create contract"
                    actionHref="/contracts/new"
                />
                <ArchiveBanner hiddenCount={hiddenCount} href={archiveUpgradeHref} label={archiveUpgradeLabel} />
            </>
        );
    }

    return (
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
                    <a href="/guide-contracts" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[var(--primary)] hover:underline">
                        View contract guide
                    </a>
                    <Link href="/contracts/new">
                        <Button className="gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] font-bold">
                            <ScrollText className="h-4 w-4" /> New Contract
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="space-y-4">
                {contracts.map((contract) => (
                    <ContractRow
                        key={contract.id}
                        contract={contract}
                        employee={employees.find((e) => e.id === contract.employeeId)}
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
            <ArchiveBanner hiddenCount={hiddenCount} href={archiveUpgradeHref} label={archiveUpgradeLabel} />
        </div>
    );
}
