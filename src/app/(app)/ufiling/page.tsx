import { PageHeader } from "@/components/ui/page-header";
import { UFilingClient } from "@/components/ufiling/ufiling-client";

export default function UFilingPage() {
    return (
        <div className="space-y-6 pb-20">
            <PageHeader title="uFiling Export" subtitle="Generate UIF declaration CSV files for Department of Labour" />
            <UFilingClient />
        </div>
    );
}
