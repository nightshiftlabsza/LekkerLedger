import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { FreePayslipGenerator } from "@/components/marketing/free-payslip-generator";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "Domestic Worker Payslip Generator | LekkerLedger",
    description: "Create a domestic worker payslip PDF for this month. No billing, no account, and payroll figures stay on this device until download.",
};

const beforeYouStart = [
    "Employer name and address",
    "Worker name and role",
    "This month's hours and hourly rate",
    "Any agreed deductions you need to show",
];

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

                <div className="grid gap-6">
                    <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-md)] sm:p-8">
                        <div className="max-w-3xl space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                <ShieldCheck className="h-3.5 w-3.5 text-[var(--primary)]" />
                                Free public tool
                            </div>
                            <h1 className="font-serif text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl">
                                Create a domestic worker payslip for this month
                            </h1>
                            <p className="max-w-2xl text-base leading-8 text-[var(--text-muted)]">
                                Work through a short payslip wizard on your phone, review the final figures, and download the PDF once your email is verified on this device.
                            </p>
                            <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm leading-7 text-[var(--text)]">
                                No billing. No account. We only use your email to verify the free monthly download limit. The payroll figures stay on this device until you download the PDF.
                            </div>
                            <div className="pt-2">
                                <Link href="#free-payslip-wizard" className="inline-flex">
                                    <Button type="button" size="lg">
                                        Start payslip
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
                        <div className="max-w-3xl space-y-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Before you start</p>
                            <h2 className="font-serif text-2xl font-bold text-[var(--text)]">What you need in front of you</h2>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {beforeYouStart.map((item) => (
                                    <div
                                        key={item}
                                        className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text)]"
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <FreePayslipGenerator />
                </div>
            </main>
        </div>
    );
}
