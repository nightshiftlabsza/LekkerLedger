import { PageHeader } from "@/components/ui/page-header";
import { LeaveClient } from "@/components/leave/leave-client";

export default function LeavePage() {
    return (
        <div className="space-y-6 pb-20">
            <PageHeader title="Leave" subtitle="Track annual and sick leave across employees" />
            <LeaveClient />
        </div>
    );
}
