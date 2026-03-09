"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function RulesPage() {
    return (
        <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
            <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface-1)]/95 backdrop-blur px-4 py-4">
                <div className="mx-auto flex max-w-4xl items-center gap-3">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="rounded-xl">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <p className="type-overline text-[var(--text-muted)]">Checklist</p>
                        <h1 className="type-h4 text-[var(--text)]">Household checklist</h1>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-4 py-10">
                <Card className="glass-panel border-none overflow-hidden">
                    <CardContent className="space-y-6 p-8">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-[var(--primary)]">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <Badge>In-app guide</Badge>
                        </div>

                        <div className="space-y-3">
                            <h2 className="type-h2 text-[var(--text)]">The full household checklist now lives inside LekkerLedger.</h2>
                            <p className="type-body measure-readable text-[var(--text-muted)]">
                                Use the in-app checklist for the full onboarding path, monthly and annual tasks, UIF boundaries, ROE Pack mapping, worked examples, and source log. This marketing page stays short on purpose so the content only needs to be maintained in one place.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Link href="/help/admin">
                                <Button className="w-full gap-2">
                                    Open household checklist
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/compliance/coida/roe">
                                <Button variant="outline" className="w-full gap-2">
                                    Open ROE wizard
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>

                        <p className="text-sm text-[var(--text-muted)]">
                            Not legal advice. Always verify against official notices and portal prompts for your exact situation.
                        </p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
