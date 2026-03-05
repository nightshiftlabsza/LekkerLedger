import { PageHeader } from "@/components/ui/page-header";
import { PayrollClient } from "@/components/payroll/payroll-client";

export default function PayrollPage() {
    return (
        <div className="pb-20">
            <PageHeader
                title="Monthly Payroll"
                subtitle="Manage pay periods for your household"
            />
            <PayrollClient />
        </div>
    );
}
