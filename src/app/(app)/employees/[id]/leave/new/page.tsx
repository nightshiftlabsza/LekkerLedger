"use client";

import { useParams } from "next/navigation";
import { RecordLeaveForm } from "@/components/leave/record-leave-form";

export default function EmployeeLeaveNewPage() {
    const params = useParams<{ id: string }>();
    const employeeId = params?.id ?? "";
    const backHref = employeeId ? `/employees/${employeeId}?tab=leave` : "/leave";

    return (
        <RecordLeaveForm
            initialEmployeeId={employeeId}
            lockEmployee
            backHref={backHref}
            onSavedHref={backHref}
            title="Record leave"
            subtitle="Save this leave entry on the employee record."
        />
    );
}
