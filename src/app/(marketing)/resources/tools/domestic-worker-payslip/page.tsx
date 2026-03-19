import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { FreePayslipGenerator } from "@/components/marketing/free-payslip-generator";

export const metadata = {
    title: "Domestic Worker Payslip Generator | LekkerLedger",
    description: "Create a domestic worker payslip PDF for this month. No billing, no account, and payroll figures stay on this device until download.",
    alternates: {
        canonical: "/resources/tools/domestic-worker-payslip",
    },
};

export default function PayslipGeneratorPage() {
    return (
        <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
            <MarketingHeader />
            <main className="content-container-wide px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
                <div className="mb-8">
                    <Link
                        href="/resources/tools"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--primary)]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to tools
                    </Link>
                </div>

                <FreePayslipGenerator />
            </main>
        </div>
    );
}
