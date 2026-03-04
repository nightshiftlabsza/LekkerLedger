"use client";

import * as React from "react";
import { AlertTriangle, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    actionHref?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, actionHref }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6">
            {Icon && (
                <div className="h-16 w-16 rounded-2xl bg-[var(--bg-subtle)] flex items-center justify-center mb-5">
                    <Icon className="h-7 w-7 text-[var(--text-muted)]" />
                </div>
            )}
            <h3 className="type-h3 text-[var(--text-primary)] mb-2">{title}</h3>
            {description && <p className="type-body text-[var(--text-secondary)] max-w-xs mb-6">{description}</p>}
            {actionLabel && (
                actionHref ? (
                    <a href={actionHref}>
                        <Button className="bg-[var(--amber-500)] text-white font-bold hover:bg-[var(--amber-600)]">
                            {actionLabel}
                        </Button>
                    </a>
                ) : (
                    <Button onClick={onAction} className="bg-[var(--amber-500)] text-white font-bold hover:bg-[var(--amber-600)]">
                        {actionLabel}
                    </Button>
                )
            )}
        </div>
    );
}

interface ErrorStateProps {
    title?: string;
    description?: string;
    onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", description, onRetry }: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6">
            <div className="h-16 w-16 rounded-2xl bg-[var(--red-50)] flex items-center justify-center mb-5">
                <AlertTriangle className="h-7 w-7 text-[var(--red-500)]" />
            </div>
            <h3 className="type-h3 text-[var(--text-primary)] mb-2">{title}</h3>
            {description && <p className="type-body text-[var(--text-secondary)] max-w-xs mb-4">{description}</p>}
            {onRetry && (
                <Button onClick={onRetry} variant="outline" className="font-bold">
                    Try Again
                </Button>
            )}
        </div>
    );
}
