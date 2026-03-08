import * as React from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface LoadingStateProps {
    message?: string;
    subtext?: string;
    skeletonLines?: number;
}

export function LoadingState({
    message = "Loading...",
    subtext,
    skeletonLines = 3,
}: LoadingStateProps) {
    return (
        <Card className="border-none glass-panel overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
                <div className="h-16 w-16 rounded-3xl bg-[var(--surface-raised)] flex items-center justify-center mb-6 shadow-[var(--shadow-sm)]">
                    <Loader2 className="h-8 w-8 text-[var(--primary)] animate-spin" strokeWidth={2.5} />
                </div>

                <h3 className="type-h3 mb-2 text-balance" style={{ color: "var(--text)" }}>
                    {message}
                </h3>

                {subtext && (
                    <p className="max-w-xs type-body mb-8 text-balance" style={{ color: "var(--text-muted)" }}>
                        {subtext}
                    </p>
                )}

                {/* Optional context skeleton to make the loading feel structured */}
                {skeletonLines > 0 && (
                    <div className="w-full max-w-sm space-y-3 mt-4">
                        {Array.from({ length: skeletonLines }).map((_, i) => (
                            <div
                                key={i}
                                className="h-4 rounded-full bg-[var(--surface-raised)] shimmer"
                                style={{ width: `${Math.max(40, 100 - i * 15)}%`, opacity: 1 - (i * 0.2) }}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
