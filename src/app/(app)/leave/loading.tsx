import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { PageHeader } from "@/components/ui/page-header";

export default function Loading() {
    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 pb-20">
            <PageHeader title="Leave overview" subtitle="Monitor balances across employees and route to the right record." />
            <div className="space-y-4">
                <CardSkeleton />
                <CardSkeleton />
            </div>
        </div>
    );
}
