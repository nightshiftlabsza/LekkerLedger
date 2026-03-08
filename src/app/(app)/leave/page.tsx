import { PageHeader } from "@/components/ui/page-header";
import { LeaveClient } from "@/components/leave/leave-client";

export default function LeavePage() {
    return (
        <div className="space-y-6 pb-20">
            <PageHeader
                title="Leave overview"
                subtitle="Monitor leave across employees and open the correct employee record to manage entries."
            />
            <LeaveClient />
        </div>
    );
}
