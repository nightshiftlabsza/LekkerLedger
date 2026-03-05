import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/loading-skeleton";

export default function NewPayrollLoading() {
    return (
        <div className="w-full max-w-3xl mx-auto space-y-6 pb-20">
            <PageHeader title="Create Payslip" subtitle="Loading..." />
            <CardSkeleton />
        </div>
    );
}
