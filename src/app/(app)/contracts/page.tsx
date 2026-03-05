import Link from "next/link";
import { Plus, Clock, FileBadge, Palmtree } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ContractsClient } from "@/components/contracts/contracts-client";

export default function ContractsPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Contracts"
                subtitle="Manage employment agreements and BCEA compliance"
                actions={
                    <Link href="/contracts/new">
                        <Button className="gap-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] font-bold">
                            <Plus className="h-4 w-4" /> New Contract
                        </Button>
                    </Link>
                }
            />

            <ContractsClient />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <Card className="glass-panel border-none">
                    <CardContent className="p-4 flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                            <FileBadge className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[var(--text)]">BCEA Compliant</p>
                            <p className="text-[10px] text-[var(--text-muted)]">Templates follow Sectoral Determination 7 guidelines.</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-panel border-none">
                    <CardContent className="p-4 flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[var(--text)]">Version Control</p>
                            <p className="text-[10px] text-[var(--text-muted)]">Keep track of changes and signed agreements over time.</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-panel border-none">
                    <CardContent className="p-4 flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                            <Palmtree className="h-4 w-4 text-[var(--focus)]" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[var(--text)]">Auto-sync Leave</p>
                            <p className="text-[10px] text-[var(--text-muted)]">Contracts define entitlements that feed into payroll.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
