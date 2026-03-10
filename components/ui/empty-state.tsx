import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface EmptyStateProps {
    title: string;
    description: string;
    icon: LucideIcon;
    actionLabel?: string;
    actionHref?: string;
    actionOnClick?: () => void;
    secondaryActionLabel?: string;
    secondaryActionHref?: string;
    requirements?: string[];
    highlights?: string[];
}

export function EmptyState({
    title,
    description,
    icon: Icon,
    actionLabel,
    actionHref,
    actionOnClick,
    secondaryActionLabel,
    secondaryActionHref,
    requirements,
    highlights,
}: EmptyStateProps) {
    return (
        <Card className="border-dashed border-2 glass-panel hover:border-[var(--primary)] transition-colors duration-300 group overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center p-6 sm:p-10 text-center text-balance">
                <div className="h-14 w-14 sm:h-18 sm:w-18 rounded-3xl bg-[var(--surface-2)] flex items-center justify-center mb-4 group-hover:-translate-y-1 transition-transform duration-300">
                    <Icon className="h-7 w-7 sm:h-9 sm:w-9 text-[var(--primary)]" strokeWidth={1.5} />
                </div>

                <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ color: "var(--text)" }}>
                    {title}
                </h3>

                <p className="max-w-md text-sm leading-relaxed mb-5" style={{ color: "var(--text-muted)" }}>
                    {description}
                </p>

                {requirements && requirements.length > 0 && (
                    <div className="bg-[var(--surface-2)] rounded-xl p-4 mb-8 text-left w-full max-w-sm">
                        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                            What you&apos;ll need
                        </p>
                        <ul className="space-y-4">
                            {requirements.map((req, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                                    <div className="h-5 w-5 rounded-full bg-[var(--primary)] flex items-center justify-center text-white shrink-0 mt-0.5" style={{ fontSize: "11px", fontWeight: "bold" }}>
                                        {i + 1}
                                    </div>
                                    <span className="leading-tight pt-0.5">{req}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {highlights && highlights.length > 0 && (
                    <div className="bg-[var(--surface-2)] rounded-xl p-4 mb-8 text-left w-full max-w-xl">
                        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                            What shows up here
                        </p>
                        <ul className="space-y-3">
                            {highlights.map((item, index) => (
                                <li key={index} className="flex items-start gap-3 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--primary)] shrink-0" />
                                    <span className="leading-relaxed">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full sm:w-auto">
                    {actionLabel && actionHref && (
                        <Link href={actionHref} className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto h-11 px-6 text-sm font-bold bg-[var(--primary)] text-white active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
                                {actionLabel}
                            </Button>
                        </Link>
                    )}

                    {actionLabel && actionOnClick && !actionHref && (
                        <Button onClick={actionOnClick} className="w-full sm:w-auto h-11 px-6 text-sm font-bold bg-[var(--primary)] text-white active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
                            {actionLabel}
                        </Button>
                    )}

                    {secondaryActionLabel && secondaryActionHref && (
                        <Link href={secondaryActionHref} className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full sm:w-auto h-11 px-6 text-sm font-bold bg-transparent text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface-2)] active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
                                {secondaryActionLabel}
                            </Button>
                        </Link>
                    )}
                </div>


            </CardContent>
        </Card>
    );
}

export interface ErrorStateProps {
    title?: string;
    description?: string;
    onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", description, onRetry }: ErrorStateProps) {
    return (
        <Card className="border-dashed border-2 border-red-200 bg-red-50/30 overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <div className="h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center mb-5">
                    <Icon className="h-7 w-7 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-red-900 mb-2">{title}</h3>
                {description && <p className="text-sm text-red-700 max-w-xs mb-6">{description}</p>}
                {onRetry && (
                    <Button onClick={onRetry} variant="outline" className="font-bold border-red-200 text-red-700 hover:bg-red-50">
                        Try Again
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

// Helper to keep Icon available for common error state
import { AlertCircle as Icon } from "lucide-react";
