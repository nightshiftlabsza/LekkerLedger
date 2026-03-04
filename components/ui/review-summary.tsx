import * as React from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NMW_RATE } from "@/lib/calculator";

export interface ReviewItem {
    label: string;
    value: string | number;
    highlight?: boolean;
    isError?: boolean;
}

export interface ReviewSection {
    title: string;
    items: ReviewItem[];
    editAction?: () => void;
}

export interface ReviewSummaryProps {
    sections: ReviewSection[];
    totalCost?: number;
    warnings?: string[];
    errors?: string[];
}

export function ReviewSummary({ sections, totalCost, warnings = [], errors = [] }: ReviewSummaryProps) {
    const formatZAR = (amount: number) => {
        return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* System Warnings/Errors */}
            {errors.length > 0 && (
                <Alert variant="error" className="animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <ul className="list-disc pl-4 space-y-1">
                            {errors.map((err, i) => <li key={i}><strong>Error:</strong> {err}</li>)}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {warnings.length > 0 && (
                <Alert variant="default" className="bg-amber-50 border-amber-500/30 text-amber-900 dark:bg-amber-900/10 dark:text-amber-400">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        <ul className="list-disc pl-4 space-y-1">
                            {warnings.map((warn, i) => <li key={i}>{warn}</li>)}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {/* Total Summary Banner (Optional) */}
            {totalCost !== undefined && (
                <Card className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 glass-panel">
                    <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-500">
                                Total Pay Cycle Cost
                            </p>
                            <p className="text-xs text-emerald-700/80 dark:text-emerald-500/70 mt-1">
                                Total net pay across all included employees.
                            </p>
                        </div>
                        <div className="text-2xl sm:text-3xl font-black tabular-nums text-emerald-700 dark:text-emerald-400">
                            {formatZAR(totalCost)}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Detailed Sections */}
            <div className="grid gap-6 sm:grid-cols-2">
                {sections.map((section, idx) => (
                    <Card key={idx} className="glass-panel overflow-hidden border-[var(--border-subtle)]">
                        <div className="px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 flex items-center justify-between">
                            <h4 className="font-bold" style={{ color: "var(--text-primary)" }}>
                                {section.title}
                            </h4>
                            {section.editAction && (
                                <button
                                    onClick={section.editAction}
                                    className="text-xs font-semibold text-[var(--amber-500)] hover:underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber-500)] rounded"
                                >
                                    Change
                                </button>
                            )}
                        </div>
                        <CardContent className="p-0">
                            <dl className="divide-y divide-[var(--border-subtle)]">
                                {section.items.map((item, itemIdx) => (
                                    <div
                                        key={itemIdx}
                                        className={`px-5 py-3 flex items-center justify-between gap-4 ${item.highlight ? 'bg-[var(--bg-subtle)]' : ''}`}
                                    >
                                        <dt className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                                            {item.label}
                                        </dt>
                                        <dd
                                            className={`text-sm font-bold text-right ${item.isError ? 'text-rose-600 dark:text-rose-400' : ''}`}
                                            style={{ color: item.isError ? undefined : "var(--text-primary)" }}
                                        >
                                            {typeof item.value === 'number' && item.label.toLowerCase().includes('rate') && item.value < NMW_RATE ? (
                                                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    R{item.value.toFixed(2)}
                                                </span>
                                            ) : (
                                                item.value
                                            )}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
