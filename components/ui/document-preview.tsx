"use client";

import * as React from "react";
import { X, Download, Maximize2, Minimize2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ═══════════════════════════════════════════════════════════════════════════
   DocumentPreview — right panel on desktop (40%) / full-screen sheet on mobile
   ═══════════════════════════════════════════════════════════════════════════ */

interface DocumentPreviewProps {
    /** URL of the document to preview (e.g. blob URL or PDF) */
    url: string | null;
    fileName?: string;
    onClose: () => void;
    onDownload?: () => void;
}

export function DocumentPreview({ url, fileName, onClose, onDownload }: DocumentPreviewProps) {
    const [expanded, setExpanded] = React.useState(false);

    // Close on Escape
    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    if (!url) return null;

    return (
        <>
            {/* Backdrop (mobile) */}
            <div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={[
                    "fixed z-50 glass-panel shadow-[var(--shadow-xl)] flex flex-col",
                    // Mobile: full screen from bottom
                    "inset-0 lg:inset-auto",
                    // Desktop: right panel
                    expanded
                        ? "lg:top-0 lg:right-0 lg:bottom-0 lg:left-1/4"
                        : "lg:top-0 lg:right-0 lg:bottom-0 lg:w-[40%] lg:min-w-[420px]",
                    "lg:border-l lg:border-[var(--border)]",
                    "animate-slide-up lg:animate-none",
                ].join(" ")}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
                    <div className="min-w-0 flex-1">
                        <p className="type-body-bold text-[var(--text)] truncate">
                            {fileName ?? "Document Preview"}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        {onDownload && (
                            <Button variant="ghost" size="sm" onClick={onDownload} className="h-8 w-8 p-0">
                                <Download className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            variant="ghost" size="sm"
                            onClick={() => setExpanded(!expanded)}
                            className="h-8 w-8 p-0 hidden lg:flex"
                        >
                            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Preview content */}
                <div className="flex-1 overflow-hidden relative">
                    <iframe
                        src={url}
                        title={fileName ?? "Document preview"}
                        className="w-full h-full border-0 bg-white"
                        sandbox="allow-same-origin allow-scripts"
                    />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border)] shrink-0">
                    <Button variant="ghost" size="sm" onClick={onClose} className="text-xs font-bold gap-1">
                        Close
                    </Button>
                    <a href={url} target="_blank" rel="noopener noreferrer" title="Open document in new tab">
                        <Button variant="ghost" size="sm" className="text-xs font-bold gap-1 text-[var(--primary)]">
                            <ExternalLink className="h-3 w-3" /> Open in new tab
                        </Button>
                    </a>
                </div>
            </div>
        </>
    );
}
