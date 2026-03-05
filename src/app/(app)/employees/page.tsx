import { PageHeader } from "@/components/ui/page-header";
import { EmployeesClient } from "@/components/employees/employees-client";

export default function EmployeesPage() {
    return (
        <div className="space-y-6 pb-20">
            <PageHeader
                title="Employees"
                subtitle="Manage your household team and compliance records"
            />
            <EmployeesClient />
        </div>
    );
}
