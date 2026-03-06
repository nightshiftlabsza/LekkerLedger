import { PageHeader } from "@/components/ui/page-header";
import { UFilingClient } from "@/components/ufiling/ufiling-client";

export default function UFilingPage() {
    return (
        <div className="space-y-6 pb-20">
            <PageHeader title="uFiling Export" subtitle="Prepare UIF declaration CSV files for uFiling and the Department of Employment and Labour process" />
            <UFilingClient />
        </div>
    );
}
