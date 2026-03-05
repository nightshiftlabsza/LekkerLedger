import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { PageHeader } from "@/components/ui/page-header";

export default function Loading() {
    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 pb-20">
            <PageHeader title="Leave Balance" subtitle="Monitor and record time off" />
            <div className="space-y-4">
                <CardSkeleton />
                <CardSkeleton />
            </div>
        </div>
    );
}
