"use client";

import * as React from "react";
import { format } from "date-fns";
import {
    FileText, Users, Lock, Settings, Cloud, ClipboardList,
    type LucideIcon,
} from "lucide-react";

export interface TimelineEvent {
    id: string;
    timestamp: Date | string;
    action: string;
    details: string;
    icon?: LucideIcon;
}

const ACTION_ICONS: Record<string, LucideIcon> = {
    CREATE_PAYSLIP: FileText,
    DELETE_PAYSLIP: FileText,
    CREATE_EMPLOYEE: Users,
    DELETE_EMPLOYEE: Users,
    LOCK_PAY_PERIOD: Lock,
    CREATE_PAY_PERIOD: ClipboardList,
    UPDATE_SETTINGS: Settings,
    SYNC_DRIVE: Cloud,
};

interface HistoryTimelineProps {
    events: TimelineEvent[];
    maxItems?: number;
    className?: string;
}

export function HistoryTimeline({ events, maxItems = 10, className = "" }: HistoryTimelineProps) {
    const shown = events.slice(0, maxItems);

    if (shown.length === 0) {
        return (
            <p className="type-body text-[var(--text-muted)] text-center py-8">
                No activity yet.
            </p>
        );
    }

    return (
        <div className={`space-y-0 ${className}`}>
            {shown.map((event, i) => {
                const Icon = event.icon ?? ACTION_ICONS[event.action] ?? ClipboardList;
                const ts = typeof event.timestamp === "string" ? new Date(event.timestamp) : event.timestamp;

                return (
                    <div key={event.id} className="flex gap-3 relative">
                        {/* Vertical line */}
                        {i < shown.length - 1 && (
                            <div
                                className="absolute left-[13px] top-8 bottom-0 w-px"
                                style={{ backgroundColor: "var(--border)" }}
                            />
                        )}
                        {/* Icon */}
                        <div className="h-7 w-7 rounded-full bg-[var(--surface-2)] flex items-center justify-center shrink-0 z-10">
                            <Icon className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        </div>
                        {/* Content */}
                        <div className="flex-1 pb-4 min-w-0">
                            <p className="type-body-bold text-[var(--text)] truncate">{event.details}</p>
                            <p className="type-overline text-[var(--text-muted)] mt-0.5">
                                {format(ts, "d MMM yyyy, HH:mm")}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
