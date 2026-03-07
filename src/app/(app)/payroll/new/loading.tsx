import Link from "next/link";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Loading() {
    return (
        <div className="w-full max-w-3xl mx-auto space-y-6 pb-20">
            <PageHeader title="Setting up your payslip..." subtitle="Step 1 of 3: choose who you are paying, then confirm the pay period." />

            <Card className="glass-panel border-[var(--border)] shadow-[var(--shadow-1)]">
                <CardContent className="p-6 space-y-5">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">What happens next</p>
                        <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                            <li>1. Choose an employee, or add your first one.</li>
                            <li>2. Confirm the pay period dates.</li>
                            <li>3. Open the payroll workspace and enter hours.</li>
                        </ul>
                    </div>

                    <p className="text-sm text-[var(--text-muted)]">
                        If loading takes longer than a few seconds, refresh this page or start with onboarding if this is your first time using the app.
                    </p>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link href="/onboarding" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full sm:w-auto">
                                Go to onboarding
                            </Button>
                        </Link>
                        <Link href="/calculator" className="w-full sm:w-auto">
                            <Button variant="ghost" className="w-full sm:w-auto">
                                Back to calculator
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4" aria-hidden="true">
                <CardSkeleton />
                <CardSkeleton />
            </div>
        </div>
    );
}
