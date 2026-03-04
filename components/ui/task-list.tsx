"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusChip, type ChipVariant } from "@/components/ui/status-chip";

export interface TaskItem {
    id: string;
    label: string;
    status: ChipVariant;
    href?: string;
    timeEstimate?: string;           // e.g. "2 min"
    onClick?: () => void;
}

interface TaskListProps {
    title?: string;
    items: TaskItem[];
    className?: string;
}

export function TaskList({ title, items, className = "" }: TaskListProps) {
    if (items.length === 0) return null;

    return (
        <div className={`space-y-2 ${className}`}>
            {title && (
                <h3 className="type-overline text-[var(--text-muted)] px-1">{title}</h3>
            )}
            <div className="glass-panel rounded-2xl divide-y divide-[var(--border)] overflow-hidden">
                {items.map((item) => {
                    const content = (
                        <div className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-2)] group">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <StatusChip variant={item.status} />
                                <span className="type-body-bold text-[var(--text)] truncate">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {item.timeEstimate && (
                                    <span className="type-overline text-[var(--text-muted)]">{item.timeEstimate}</span>
                                )}
                                <ChevronRight className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                            </div>
                        </div>
                    );

                    if (item.href) {
                        return <Link key={item.id} href={item.href}>{content}</Link>;
                    }
                    return (
                        <button key={item.id} onClick={item.onClick} className="w-full text-left">
                            {content}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
