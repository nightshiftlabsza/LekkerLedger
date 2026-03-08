import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmployeesClient } from "@/components/employees/employees-client";

export default function EmployeesPage() {
    return (
        <div className="space-y-6 pb-20">
            <PageHeader
                title="Employees"
                subtitle="Manage your household team and employment records"
                actions={
                    <Link href="/employees/new">
                        <Button className="bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)]">
                            Add employee
                        </Button>
                    </Link>
                }
            />
            <EmployeesClient />
        </div>
    );
}
