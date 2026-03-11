import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PayrollClient } from "@/components/payroll/payroll-client";

export default function PayrollPage() {
    return (
        <div className="pb-20">
            <PageHeader
                title="Monthly Payroll"
                subtitle="Work through one month at a time, then finalise it when you are happy"
                actions={
                    <Link href="/employees/new">
                        <Button variant="outline" className="font-bold">
                            Add employee
                        </Button>
                    </Link>
                }
            />
            <Suspense fallback={<div className="h-40 flex items-center justify-center text-[var(--text-muted)]">Loading payroll...</div>}>
                <PayrollClient />
            </Suspense>
        </div>
    );
}
