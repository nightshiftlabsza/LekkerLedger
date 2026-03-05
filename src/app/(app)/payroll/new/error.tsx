"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { AlertCircle } from "lucide-react";

export default function NewPayrollError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center pt-10">
            <EmptyState
                title="Something went wrong"
                description={error.message || "Failed to load the payslip wizard. Please try again or export diagnostics."}
                icon={AlertCircle}
                actionLabel="Retry"
                actionHref="#"
            />
            {/* The EmptyState actionHref won't use our reset function directly natively without a custom button, so we just add a manual retry button below it */}
            <button
                onClick={() => reset()}
                className="mt-4 text-sm font-bold text-[var(--primary)] hover:underline"
            >
                Retry Loading Wizard
            </button>
        </div>
    );
}
