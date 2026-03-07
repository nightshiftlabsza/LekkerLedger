import * as React from "react";
import { format } from "date-fns";
import { FileText, Download, Eye, ExternalLink, Cloud, HardDrive } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type StorageLocation = 'local' | 'drive';

export interface DocumentItem {
    id: string;
    title: string;
    type: string;
    employeeName?: string;
    period?: string; // e.g., "Oct 2026"
    dateCreated: Date;
    sizeBytes?: number;
    storage: StorageLocation[];
}

export interface DocumentListProps {
    documents: DocumentItem[];
    onView?: (id: string) => void;
    onDownload?: (id: string) => void;
    onShare?: (id: string) => void;
    emptyState?: React.ReactNode;
}

export function DocumentList({
    documents,
    onView,
    onDownload,
    onShare,
    emptyState
}: DocumentListProps) {
    if (documents.length === 0 && emptyState) {
        return <>{emptyState}</>;
    }

    const formatBytes = (bytes?: number) => {
        if (!bytes) return "Unknown size";
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    return (
        <div className="space-y-3">
            {documents.map((doc) => (
                <Card
                    key={doc.id}
                    data-testid={`document-card-${doc.id}`}
                    className="glass-panel group overflow-hidden border border-[var(--border)] hover:border-[var(--primary)]/50 transition-colors"
                >
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex flex-row items-start sm:items-center gap-4">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0 border border-[var(--focus)]/20 text-[var(--focus)]">
                                <FileText className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
                            </div>

                            <div className="flex flex-col gap-1">
                                <h4 className="font-bold text-sm sm:text-base leading-tight group-hover:text-[var(--focus)] transition-colors" style={{ color: "var(--text)" }}>
                                    {doc.title}
                                </h4>

                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                                    {doc.employeeName && (
                                        <span className="font-medium px-2 py-0.5 rounded-sm bg-[var(--surface-2)]">
                                            {doc.employeeName}
                                        </span>
                                    )}
                                    {doc.period && (
                                        <span className="flex items-center gap-1 font-medium">
                                            {doc.period}
                                        </span>
                                    )}
                                    <span className="hidden sm:inline opacity-30">•</span>
                                    <span>{format(doc.dateCreated, "dd MMM yyyy")}</span>
                                    <span className="opacity-30">•</span>
                                    <span>{formatBytes(doc.sizeBytes)}</span>
                                </div>

                                {/* Storage Badges */}
                                <div className="flex gap-1.5 mt-1 sm:mt-0 sm:absolute sm:top-5 sm:left-[55%] lg:static lg:mt-1">
                                    {doc.storage.includes('local') && (
                                        <Badge variant="outline" className="text-[9px] px-1.5 h-4 flex items-center gap-1 border-[var(--border)] text-[var(--text-muted)]">
                                            <HardDrive className="h-2.5 w-2.5" /> Local
                                        </Badge>
                                    )}
                                    {doc.storage.includes('drive') && (
                                        <Badge variant="outline" className="text-[9px] px-1.5 h-4 flex items-center gap-1 border-blue-500/30 text-blue-600 bg-blue-500/5">
                                            <Cloud className="h-2.5 w-2.5" /> Drive
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto mt-2 sm:mt-0 border-[var(--border)]">
                            {onView && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onView(doc.id)}
                                    className="h-8 flex-1 sm:flex-none"
                                    data-testid={`document-view-${doc.id}`}
                                >
                                    <Eye className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">View</span>
                                </Button>
                            )}
                            {onDownload && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onDownload(doc.id)}
                                    className="h-8 flex-1 sm:flex-none border-[var(--border)]"
                                    data-testid={`document-download-${doc.id}`}
                                >
                                    <Download className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Download</span>
                                </Button>
                            )}
                            {onShare && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onShare(doc.id)}
                                    className="h-8 flex-1 sm:flex-none border-[var(--border)] bg-[var(--surface-2)]"
                                    data-testid={`document-share-${doc.id}`}
                                >
                                    <ExternalLink className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Share</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
