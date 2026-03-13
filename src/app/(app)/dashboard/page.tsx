"use client";

import Link from "next/link";
import { ArrowRight, Settings, UserPlus, FolderOpen, Banknote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

const QUICK_LINKS = [
    {
        href: "/employees/new",
        label: "Add employee",
        description: "Create a new worker record.",
        icon: UserPlus,
    },
    {
        href: "/payroll/new",
        label: "Start payroll",
        description: "Open a new pay period.",
        icon: Banknote,
    },
    {
        href: "/documents",
        label: "Open documents",
        description: "Browse payslips and files.",
        icon: FolderOpen,
    },
    {
        href: "/settings",
        label: "Open settings",
        description: "Manage backup, sync, and billing.",
        icon: Settings,
    },
];

export default function DashboardPage() {
    return (
        <div className="space-y-6 pb-8">
            <PageHeader
                title="Dashboard"
                subtitle="You are signed in. This simplified dashboard is temporarily shown while we stabilize the full workspace."
            />

            <Card className="border-[var(--border)] bg-[var(--surface-raised)]">
                <CardContent className="space-y-4 p-6">
                    <p className="text-sm leading-6 text-[var(--text-muted)]">
                        Your account is open. Use the shortcuts below to keep working while the full dashboard widgets stay disabled.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {QUICK_LINKS.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.href} href={item.href} className="block">
                                    <div className="flex h-full items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 transition-colors hover:bg-[var(--surface-2)]">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--primary)]">
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-[var(--text)]">{item.label}</p>
                                            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{item.description}</p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/employees/new">
                    <Button className="w-full gap-2 sm:w-auto">
                        Add employee <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
                <Link href="/settings">
                    <Button variant="outline" className="w-full sm:w-auto">
                        Open settings
                    </Button>
                </Link>
            </div>
        </div>
    );
}
