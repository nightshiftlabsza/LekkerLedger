import { PageHeader } from "@/components/ui/page-header";
import { NewPayrollWizardClient } from "@/components/payroll/new-payroll-wizard-client";

export default function NewPayrollPage() {
    return (
        <div className="w-full max-w-3xl mx-auto space-y-6 pb-20">
            <PageHeader
                title="Create Payslip"
                subtitle="Start a new pay period"
            />
            <NewPayrollWizardClient />
        </div>
    );
}
