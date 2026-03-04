import * as React from "react";
import { format } from "date-fns";
import { Clock, FileText, CheckCircle2, User, Download, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type AuditEventType = 'created' | 'modified' | 'sent' | 'viewed' | 'signed' | 'downloaded';

export interface AuditEvent {
    id: string;
    timestamp: Date;
    type: AuditEventType;
    description: string;
    user?: string;
    metadata?: Record<string, string>;
}

export interface AuditTrailTimelineProps {
    events: AuditEvent[];
    documentName?: string;
    showDownload?: boolean;
    onDownloadLog?: () => void;
}

export function AuditTrailTimeline({
    events,
    documentName,
    showDownload = false,
    onDownloadLog
}: AuditTrailTimelineProps) {
    const sortedEvents = [...events].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const getEventIcon = (type: AuditEventType) => {
        switch (type) {
            case 'created': return <FileText className="h-4 w-4" />;
            case 'modified': return <Clock className="h-4 w-4" />;
            case 'sent': return <ExternalLink className="h-4 w-4" />;
            case 'viewed': return <User className="h-4 w-4" />;
            case 'signed': return <CheckCircle2 className="h-4 w-4" />;
            case 'downloaded': return <Download className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const getEventColor = (type: AuditEventType) => {
        switch (type) {
            case 'created': return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
            case 'signed': return "text-blue-600 bg-blue-500/10 border-blue-500/20";
            case 'sent': return "text-amber-600 bg-amber-500/10 border-amber-500/20";
            default: return "text-[var(--text-secondary)] bg-[var(--bg-subtle)] border-[var(--border-subtle)]";
        }
    };

    if (events.length === 0) {
        return (
            <Card className="border-dashed glass-panel">
                <CardContent className="p-8 text-center">
                    <Clock className="h-8 w-8 mx-auto mb-3 text-[var(--text-muted)]" />
                    <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                        No audit history available.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-panel overflow-hidden border-[var(--border-subtle)]">
            <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/50">
                <div>
                    <h3 className="font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                        Audit Trail
                    </h3>
                    {documentName && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                            History for: <span className="font-semibold">{documentName}</span>
                        </p>
                    )}
                </div>
                {showDownload && onDownloadLog && (
                    <button
                        onClick={onDownloadLog}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] transition-colors"
                        style={{ color: "var(--text-primary)" }}
                    >
                        <Download className="h-3 w-3" />
                        Export Log
                    </button>
                )}
            </div>

            <CardContent className="p-0">
                <div className="relative px-6 py-8">
                    {/* Vertical Line */}
                    <div
                        className="absolute top-8 bottom-8 left-9 w-px"
                        style={{ backgroundColor: "var(--border-subtle)" }}
                    />

                    <div className="space-y-8 relative">
                        {sortedEvents.map((event, index) => (
                            <div key={event.id} className="flex gap-4 group">
                                <div
                                    className={`relative z-10 w-6 h-6 rounded-full border flex items-center justify-center shrink-0 shadow-sm ${getEventColor(event.type)}`}
                                >
                                    <div className="scale-75">
                                        {getEventIcon(event.type)}
                                    </div>
                                </div>
                                <div className="pt-0.5 pb-2">
                                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-1">
                                        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                                            {event.description}
                                        </p>
                                        <span className="text-[11px] font-medium uppercase tracking-wider tabular-nums" style={{ color: "var(--text-muted)" }}>
                                            {format(event.timestamp, "dd MMM yyyy, HH:mm")}
                                        </span>
                                    </div>

                                    {event.user && (
                                        <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                                            <User className="h-3 w-3" />
                                            {event.user}
                                        </p>
                                    )}

                                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {Object.entries(event.metadata).map(([key, value]) => (
                                                <Badge
                                                    key={key}
                                                    variant="secondary"
                                                    className="text-[10px] bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-none px-2 py-0.5"
                                                >
                                                    <span className="opacity-70 mr-1">{key}:</span> {value}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
