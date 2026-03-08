"use client";

import * as React from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  ExternalLink, 
  Settings, 
  Users, 
  CreditCard, 
  FileText, 
  ShieldCheck, 
  Calculator,
  ChevronDown,
  Info
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { helpAdminContent, type QuickAction, type TaskGuide } from "@/src/content/help-admin";

const actionIcons: Record<string, React.ReactNode> = {
    "employer-details": <Settings className="h-5 w-5" />,
    "add-employee": <Users className="h-5 w-5" />,
    "run-payroll": <Calculator className="h-5 w-5" />,
    "export-payslips": <FileText className="h-5 w-5" />,
    "uif-help": <ShieldCheck className="h-5 w-5" />,
    "roe-help": <CreditCard className="h-5 w-5" />
};

function QuickActionCard({ action }: { action: QuickAction }) {
    return (
        <Card className="surface-raised border-[var(--border)] transition-all hover:bg-[var(--surface-1)]">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-[var(--primary)]/10 p-2 text-[var(--primary)]">
                        {actionIcons[action.id]}
                    </div>
                    <CardTitle className="type-h4 text-[var(--text)]">{action.title}</CardTitle>
                </div>
                <CardDescription className="mt-2 text-sm text-[var(--text-muted)] min-h-[40px]">
                    {action.description}
                </CardDescription>
            </CardHeader>
            <CardFooter>
                <Link href={action.href} passHref>
                    <Button variant="ghost" className="w-full justify-between group px-2 text-[var(--primary)] hover:text-[var(--primary-hover)]">
                        {action.cta}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}

function TaskGuideSection({ guide }: { guide: TaskGuide }) {
    return (
        <div id={guide.id} className="scroll-mt-20 border-b border-[var(--border)] py-8 last:border-b-0">
            <h3 className="type-h3 text-[var(--text)]">{guide.title}</h3>
            <p className="mt-2 type-body measure-readable text-[var(--text-muted)]">
                {guide.intro}
            </p>
            
            <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div>
                    <h4 className="type-label text-[var(--text)] mb-3 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
                        What to check
                    </h4>
                    <ul className="space-y-2">
                        {guide.check.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--border)]" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]/50 p-4">
                    <div className="space-y-3">
                        <div>
                            <p className="type-overline text-xs text-[var(--text-muted)] uppercase tracking-wider">Common mistake</p>
                            <p className="mt-1 text-sm text-[var(--text)]">{guide.mistake}</p>
                        </div>
                        <div>
                            <p className="type-overline text-xs text-[var(--text-muted)] uppercase tracking-wider">Next step</p>
                            <p className="mt-1 text-sm text-[var(--text)] font-medium">{guide.next}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminHelpPage() {
    return (
        <div className="max-w-[1400px] mx-auto space-y-12 pb-20">
            {/* LAYER 1: Intro + Disclaimer + Quick Actions */}
            <section className="space-y-8">
                <PageHeader
                    title={helpAdminContent.title}
                    subtitle={helpAdminContent.intro}
                />

                <Alert variant="default" className="border-[var(--primary)]/20 bg-[var(--primary)]/5 max-w-3xl">
                    <Info className="h-4 w-4 text-[var(--primary)]" />
                    <AlertTitle className="text-[var(--text)] font-semibold">Important Disclaimer</AlertTitle>
                    <AlertDescription className="text-sm text-[var(--text-muted)] leading-relaxed">
                        {helpAdminContent.disclaimer}
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {helpAdminContent.quickActions.map((action) => (
                        <QuickActionCard key={action.id} action={action} />
                    ))}
                </div>
            </section>

            {/* LAYER 2: Practical Help by Task */}
            <section className="space-y-6">
                <div className="border-b border-[var(--border)] pb-4">
                    <h2 className="type-h2 text-[var(--text)]">Task Guides</h2>
                    <p className="text-[var(--text-muted)]">Practical guidance for domestic worker administration.</p>
                </div>
                
                <div className="flex flex-col">
                    {helpAdminContent.taskGuides.map((guide) => (
                        <TaskGuideSection key={guide.id} guide={guide} />
                    ))}
                </div>
            </section>

            {/* LAYER 3: Official Sources */}
            <section className="space-y-8 pt-8 border-t border-[var(--border)]">
                <div className="grid lg:grid-cols-[1fr_2fr] gap-12">
                    <div className="space-y-4">
                        <h2 className="type-h3 text-[var(--text)]">Official Sources</h2>
                        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                            Always verify details against official portals before relying on them for compliance.
                        </p>
                        <div className="flex flex-col gap-2">
                            {helpAdminContent.officialSources.map((source) => (
                                <a 
                                    key={source.label}
                                    href={source.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] group"
                                >
                                    {source.label}
                                    <ExternalLink className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <Card className="surface-raised border-[var(--border)]">
                        <details className="group">
                            <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 hover:bg-[var(--surface-1)]">
                                <span className="type-label text-[var(--text)]">Source Notes & Thresholds</span>
                                <ChevronDown className="h-4 w-4 text-[var(--text-muted)] transition-transform group-open:rotate-180" />
                            </summary>
                            <div className="px-6 pb-6 pt-0">
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
                                    {helpAdminContent.sourceNotes}
                                </p>
                            </div>
                        </details>
                    </Card>
                </div>
            </section>

            {/* Ultrawide Supporting Panel (Contextual) - Note: In a real app this might be a sidebar, 
                but here we use it as a footer-style support block to fill the wide layout intentionally */}
            <div className="hidden min-[1600px]:block fixed right-8 top-32 w-64 space-y-4">
                <Card className="surface-raised border-[var(--border)] shadow-sm">
                    <CardHeader className="p-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">Quick Reference</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                        <div className="space-y-1">
                            <p className="text-xs text-[var(--text-muted)]">Min Wage (2026)</p>
                            <p className="text-sm font-bold text-[var(--text)]">R30.23 / hour</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-[var(--text-muted)]">UIF Ceiling</p>
                            <p className="text-sm font-bold text-[var(--text)]">R17,712 / month</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-[var(--text-muted)]">ROE Min (Domestic)</p>
                            <p className="text-sm font-bold text-[var(--text)]">R560 / year</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
