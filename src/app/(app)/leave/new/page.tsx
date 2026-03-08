"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { RecordLeaveForm } from "@/components/leave/record-leave-form";

function NewLeaveContent() {
    const searchParams = useSearchParams();
    const employeeId = searchParams.get("employeeId") || "";
    const backHref = employeeId ? `/employees/${employeeId}?tab=leave` : "/leave";

    return (
        <RecordLeaveForm
            initialEmployeeId={employeeId}
            lockEmployee={Boolean(employeeId)}
            backHref={backHref}
            onSavedHref={backHref}
            title="Record leave"
            subtitle={employeeId ? "Saving this leave entry on the selected employee record." : "Choose an employee and save a leave entry."}
        />
    );
}

export default function NewLeavePage() {
    return (
        <React.Suspense
            fallback={
                <div className="flex flex-col items-center gap-4 p-12">
                    <Loader2 className="h-10 w-10 animate-spin text-[var(--primary)]" />
                    <p className="text-sm font-bold text-[var(--text-muted)]">Loading leave form...</p>
                </div>
            }
        >
            <NewLeaveContent />
        </React.Suspense>
    );
}
