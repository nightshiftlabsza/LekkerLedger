"use client";

import * as React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { Contract, Employee } from "@/lib/schema";

export interface ContractRowProps {
    contract: Contract;
    employee?: Employee;
    onViewPreview: (contract: Contract) => void;
    onDownloadPdf: (contract: Contract) => void;
    onUploadSigned: (contract: Contract) => void;
    onViewSigned: (contract: Contract) => void;
    onMarkFinal: (contract: Contract) => void;
    onDelete?: (contract: Contract) => void;
}

const STAGES = ["Draft", "Downloaded", "Signed file", "Finalised"];

export function ContractRow({
    contract,
    employee,
    onViewPreview,
    onDownloadPdf,
    onUploadSigned,
    onViewSigned,
    onMarkFinal,
    onDelete,
}: ContractRowProps) {
    const updatedLabel = contract.updatedAt
        ? formatDistanceToNow(new Date(contract.updatedAt), { addSuffix: true })
        : "just now";

    let statusLabel = "";
    let helperText = "";
    let stage = 1;
    let primaryAction: { label: string; onClick: () => void } = { label: "", onClick: () => { } };
    let secondaryAction: { label: string; onClick: () => void } | null = null;
    const canEditDraft = contract.status === "draft" || contract.status === "awaiting_signed_copy";

    switch (contract.status) {
        case "draft":
            statusLabel = "Draft ready";
            helperText = "Review the draft, download it, and go through it with your worker before signing.";
            stage = 1;
            primaryAction = { label: "Review draft", onClick: () => onViewPreview(contract) };
            secondaryAction = { label: "Download PDF", onClick: () => onDownloadPdf(contract) };
            break;
        case "awaiting_signed_copy":
            statusLabel = "Waiting for signed copy";
            helperText = "You've downloaded the draft. Upload the signed version when both parties have signed.";
            stage = 2;
            primaryAction = { label: "Upload signed PDF", onClick: () => onUploadSigned(contract) };
            secondaryAction = { label: "View draft", onClick: () => onViewPreview(contract) };
            break;
        case "signed_copy_stored":
            statusLabel = "Signed copy stored";
            helperText = "Signed PDF is stored here. Check it, then mark this contract as final.";
            stage = 3;
            primaryAction = { label: "Mark as final", onClick: () => onMarkFinal(contract) };
            secondaryAction = { label: "Open signed PDF", onClick: () => onViewSigned(contract) };
            break;
        case "final":
            statusLabel = "Final";
            helperText = "Final signed contract stored in Documents.";
            stage = 4;
            primaryAction = { label: "View final", onClick: () => onViewSigned(contract) };
            secondaryAction = { label: "Download final", onClick: () => onDownloadPdf(contract) };
            break;
    }

    return (
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-7 space-y-6 shadow-sm transition-all hover:shadow-md">
            {/* Header row */}
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-2xl font-semibold text-[var(--text)]">
                            {employee?.name ?? "Unknown worker"}
                        </h3>
                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-0.5 text-xs font-medium text-[var(--text-muted)]">
                            {contract.jobTitle}
                        </span>
                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-0.5 text-xs font-medium text-[var(--text)]">
                            {statusLabel}
                        </span>
                    </div>
                    <p className="text-base text-[var(--text-muted)] leading-relaxed">
                        {helperText}
                    </p>
                </div>
                <p className="text-sm text-[var(--text-muted)] shrink-0 pt-0.5">
                    Updated {updatedLabel}
                </p>
            </div>

            {/* Progress bar */}
            <div className="grid grid-cols-4 gap-3 max-w-xl">
                {STAGES.map((stageLabel, index) => {
                    const filled = index < stage;
                    const current = index === stage - 1;
                    return (
                        <div key={stageLabel} className="space-y-2">
                            <div
                                className={`h-2 rounded-full transition-colors ${filled ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`}
                            />
                            <p
                                className={`text-xs font-medium ${current ? "text-[var(--text)]" : "text-[var(--text-muted)]"}`}
                            >
                                {stageLabel}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                    onClick={primaryAction.onClick}
                    className="rounded-2xl bg-[var(--primary)] text-white px-6 py-3 text-base font-semibold whitespace-nowrap hover:bg-[var(--primary-hover)] transition-colors"
                >
                    {primaryAction.label}
                </button>
                {secondaryAction && (
                    <button
                        onClick={secondaryAction.onClick}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-6 py-3 text-base font-medium whitespace-nowrap text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                    >
                        {secondaryAction.label}
                    </button>
                )}
                {canEditDraft && (
                    <Link
                        href={`/contracts/${contract.id}/edit`}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-6 py-3 text-base font-medium whitespace-nowrap text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors inline-block"
                    >
                        Edit draft
                    </Link>
                )}
                {onDelete && (
                    <button
                        onClick={() => onDelete(contract)}
                        className="rounded-2xl border border-red-200 bg-[var(--surface-1)] px-6 py-3 text-base font-medium whitespace-nowrap text-red-700 hover:bg-red-50 hover:text-red-800 transition-colors"
                    >
                        Delete
                    </button>
                )}
            </div>
        </article>
    );
}
