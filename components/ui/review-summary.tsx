import * as React from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NMW_RATE } from "@/lib/calculator";

export interface ReviewItem {
    readonly label: string;
    readonly value: string | number;
    readonly highlight?: boolean;
    readonly isError?: boolean;
}

export interface ReviewSection {
    readonly title: string;
    readonly items: readonly ReviewItem[];
    readonly editAction?: () => void;
}

export interface ReviewSummaryProps {
    readonly sections: readonly ReviewSection[];
    readonly totalCost?: number;
    readonly warnings?: readonly string[];
    readonly errors?: readonly string[];
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
                            {errors.map((err) => <li key={err}><strong>Error:</strong> {err}</li>)}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {warnings.length > 0 && (
                <Alert variant="warning" className="bg-[var(--surface-2)] text-[var(--text)]">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        <ul className="list-disc pl-4 space-y-1">
                            {warnings.map((warn) => <li key={warn}>{warn}</li>)}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {/* Total Summary Banner (Optional) */}
            {totalCost !== undefined && (
                <Card className="glass-panel" style={{ borderColor: "var(--success-border)", backgroundColor: "var(--success-soft)" }}>
                    <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-wider text-[var(--success)]">
                                Estimated Household Cost
                            </p>
                            <p className="mt-1 text-xs text-[var(--success)]">
                                Gross pay plus employer UIF across all included employees.
                            </p>
                        </div>
                        <div className="text-2xl sm:text-3xl font-black tabular-nums text-[var(--success)]">
                            {formatZAR(totalCost)}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Detailed Sections */}
            <div className="grid gap-6 sm:grid-cols-2">
                {sections.map((section) => (
                    <Card key={section.title} className="glass-panel overflow-hidden border-[var(--border)]">
                        <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-1)]/50 flex items-center justify-between">
                            <h4 className="font-bold" style={{ color: "var(--text)" }}>
                                {section.title}
                            </h4>
                            {section.editAction && (
                                <button
                                    onClick={section.editAction}
                                    className="text-xs font-semibold text-[var(--primary)] hover:underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
                                >
                                    Change
                                </button>
                            )}
                        </div>
                        <CardContent className="p-0">
                            <dl className="divide-y divide-[var(--border)]">
                                {section.items.map((item) => (
                                    <div
                                        key={item.label}
                                        className={`px-5 py-3 flex items-center justify-between gap-4 ${item.highlight ? 'bg-[var(--surface-2)]' : ''}`}
                                    >
                                        <dt className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                                            {item.label}
                                        </dt>
                                        <dd
                                            className={`text-sm font-bold text-right ${item.isError ? 'text-[var(--danger)]' : ''}`}
                                            style={{ color: item.isError ? undefined : "var(--text)" }}
                                        >
                                            {typeof item.value === 'number' && item.label.toLowerCase().includes('rate') && item.value < NMW_RATE ? (
                                                <span className="flex items-center gap-1.5 text-[var(--danger)]">
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
