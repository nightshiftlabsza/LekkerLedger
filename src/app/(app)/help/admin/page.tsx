"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUp, Check, Copy, ExternalLink, FileText, ListChecks } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { adminGuide, type GuideBlock, type GuideListItem } from "@/src/content/admin-guide";


function renderRichText(text: string) {
    return text.split(/(\*\*.*?\*\*)/g).filter(Boolean).map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={`${part}-${index}`} className="font-semibold text-[var(--text)]">{part.slice(2, -2)}</strong>;
        }
        return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
    });
}

function CitationLinks({ footnotes }: { footnotes?: number[] }) {
    if (!footnotes?.length) return null;

    return (
        <span className="ml-1 inline-flex flex-wrap gap-1 align-middle">
            {footnotes.map((id) => (
                <a
                    key={id}
                    href={`#footnote-${id}`}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                    [{id}]
                </a>
            ))}
        </span>
    );
}

function BlockRenderer({ block }: { block: GuideBlock }) {
    if (block.type === "paragraph") {
        return (
            <p className="type-body leading-7 text-[var(--text-muted)]">
                {renderRichText(block.text)}
                <CitationLinks footnotes={block.footnotes} />
            </p>
        );
    }

    const ListTag = block.ordered ? "ol" : "ul";

    return (
        <ListTag className={`space-y-2 pl-5 text-[var(--text-muted)] ${block.ordered ? "list-decimal" : "list-disc"}`}>
            {block.items.map((item, index) => (
                <li key={`${item.lead ?? item.text}-${index}`} className="type-body leading-7">
                    {item.lead && <strong className="font-semibold text-[var(--text)]">{renderRichText(item.lead)} </strong>}
                    {renderRichText(item.text)}
                    <CitationLinks footnotes={item.footnotes} />
                </li>
            ))}
        </ListTag>
    );
}

function CopyHeading({
    id,
    title,
    level,
    copiedId,
    onCopy,
    actions,
}: {
    id: string;
    title: string;
    level: "h2" | "h3";
    copiedId: string | null;
    onCopy: (id: string) => void;
    actions?: React.ReactNode;
}) {
    const Tag = level;
    const className = level === "h2" ? "type-h2" : "type-h3";

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <Tag id={id} className={`${className} scroll-mt-20 text-[var(--text)]`}>
                {title}
            </Tag>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {actions}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Copy link to ${title}`}
                    onClick={() => onCopy(id)}
                    className="h-11 w-11 rounded-2xl"
                >
                    {copiedId === id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
}

function BackToTop() {
    return (
        <div className="pt-2">
            <a href="#top" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]">
                <ArrowUp className="h-4 w-4" />
                Back to top
            </a>
        </div>
    );
}

function ExpandableSection({
    id,
    title,
    description,
    children,
    defaultOpen = false,
}: {
    id: string;
    title: string;
    description: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    return (
        <Card id={id} className="glass-panel border-none overflow-hidden scroll-mt-20">
            <details className="group" open={defaultOpen}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
                    <div>
                        <h2 className="type-h3 text-[var(--text)]">{title}</h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
                    </div>
                    <span className="text-sm font-semibold text-[var(--primary)] group-open:hidden">Open</span>
                    <span className="hidden text-sm font-semibold text-[var(--primary)] group-open:inline">Close</span>
                </summary>
                <div className="border-t border-[var(--border)] p-5">
                    {children}
                </div>
            </details>
        </Card>
    );
}

export default function AdminHelpPage() {
    const [copiedId, setCopiedId] = React.useState<string | null>(null);
    const copyTimerRef = React.useRef<number | null>(null);

    React.useEffect(() => {
        return () => {
            if (copyTimerRef.current) {
                window.clearTimeout(copyTimerRef.current);
            }
        };
    }, []);

    const handleCopy = React.useCallback(async (id: string) => {
        const url = typeof window === "undefined"
            ? `#${id}`
            : `${window.location.origin}${window.location.pathname}#${id}`;

        try {
            await navigator.clipboard.writeText(url);
        } catch {
            if (typeof window !== "undefined") {
                window.location.hash = id;
            }
        }

        setCopiedId(id);
        if (copyTimerRef.current) {
            window.clearTimeout(copyTimerRef.current);
        }
        copyTimerRef.current = window.setTimeout(() => {
            setCopiedId((current) => (current === id ? null : current));
            copyTimerRef.current = null;
        }, 1800);
    }, []);

    return (
        <div id="top" className="space-y-6 pb-8">
            <PageHeader
                title={adminGuide.title}
                subtitle={adminGuide.subtitle}
                actions={
                    <Link href="/compliance/coida/roe">
                        <Button variant="outline" className="min-h-11 gap-2">
                            <FileText className="h-4 w-4" />
                            Open ROE wizard
                        </Button>
                    </Link>
                }
            />

            <div className="flex flex-wrap gap-2">
                <Badge>In-app checklist</Badge>
                <Badge variant="outline">Updated 6 Mar 2026</Badge>
            </div>

            <Alert variant="warning">
                <AlertTitle>Not legal advice</AlertTitle>
                <AlertDescription>
                    {adminGuide.disclaimer} The goal here is to help you stay organised early, because routine payroll clean-up is usually much harder than keeping records tidy month by month.
                </AlertDescription>
            </Alert>

            <Card className="glass-panel border-none">
                <CardContent className="space-y-4 p-6">
                    <div className="flex items-center gap-2 text-[var(--primary)]">
                        <ListChecks className="h-4 w-4" />
                        <p className="type-overline">Start here first</p>
                    </div>
                    <p className="type-body measure-readable leading-7 text-[var(--text-muted)]">
                        Most households do not need to study labour law every week. In practice, you usually want 5 things under control: correct employee details, a clean monthly payroll record, payslips kept in Documents, UIF where it applies, and annual ROE paperwork when required.
                    </p>
                    <div className="grid gap-4 lg:grid-cols-2">
                        {adminGuide.startHereSteps.slice(0, 4).map((step) => (
                            <Card key={step.id} className="border border-[var(--border)] bg-[var(--surface-raised)] shadow-none">
                                <CardContent className="space-y-3 p-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <Badge variant="outline">{step.screenLabel}</Badge>
                                        <Link href={step.screenHref} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]">
                                            Open
                                        </Link>
                                    </div>
                                    <h3 className="type-h4 text-[var(--text)]">{step.title}</h3>
                                    <p className="type-body text-[var(--text-muted)]">{renderRichText(step.whatToDo)}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <ExpandableSection
                    id="start-here"
                    title="Step-by-step setup"
                    description="Use this if you are setting up the household for the first time."
                    defaultOpen
                >
                    <section className="space-y-5 scroll-mt-20">
                        <CopyHeading id="start-here" title="Start Here (onboarding path)" level="h2" copiedId={copiedId} onCopy={handleCopy} />
                        <p className="type-body leading-7 text-[var(--text-muted)]">5–10 minutes. Follow this path first if you are setting up the household for the first time.</p>
                        <div className="grid gap-4 lg:grid-cols-2">
                            {adminGuide.startHereSteps.map((step) => (
                                <Card key={step.id} className="glass-panel border-none">
                                    <CardContent className="space-y-4 p-5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="outline">{step.screenLabel}</Badge>
                                            <Link href={step.screenHref} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]">
                                                Open screen
                                            </Link>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="type-h4 text-[var(--text)]">{step.title}</h3>
                                            <a href={`#${step.seeAlsoId}`} className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 text-sm text-[var(--text-muted)] underline-offset-4 hover:underline">
                                                See full guide section
                                            </a>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="type-body text-[var(--text-muted)]"><strong className="text-[var(--text)]">What to do:</strong> {renderRichText(step.whatToDo)}<CitationLinks footnotes={step.footnotes} /></p>
                                            <p className="type-body text-[var(--text-muted)]"><strong className="text-[var(--text)]">What it means:</strong> {renderRichText(step.whatItMeans)}</p>
                                            <p className="type-body text-[var(--text-muted)]"><strong className="text-[var(--text)]">Common mistakes:</strong> {renderRichText(step.commonMistakes)}<CitationLinks footnotes={step.footnotes} /></p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <BackToTop />
                    </section>
                </ExpandableSection>

                <ExpandableSection
                    id="full-guide"
                    title="Detailed guide by screen"
                    description="Open this when you want fuller explanations, edge cases, and screen-by-screen guidance."
                >
                    <section className="space-y-5 scroll-mt-20">
                        <CopyHeading id="full-guide" title="Full Guide (by screens)" level="h2" copiedId={copiedId} onCopy={handleCopy} />
                        <div className="space-y-6">
                            {adminGuide.guideSections.map((section) => (
                                <Card key={section.id} className="glass-panel border-none">
                                    <CardContent className="space-y-5 p-6">
                                        <CopyHeading
                                            id={section.id}
                                            title={section.title}
                                            level="h3"
                                            copiedId={copiedId}
                                            onCopy={handleCopy}
                                            actions={section.screenHref ? (
                                                <Link href={section.screenHref} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]">
                                                    {section.screenLabel ?? "Open screen"}
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                            ) : undefined}
                                        />
                                        {section.intro?.map((block, index) => (
                                            <BlockRenderer key={`${section.id}-intro-${index}`} block={block} />
                                        ))}
                                        {section.subsections?.map((subsection) => (
                                            <div key={`${section.id}-${subsection.title}`} className="space-y-3 border-t border-[var(--border)] pt-4 first:border-t-0 first:pt-0">
                                                <h4 className="type-h4 text-[var(--text)]">{subsection.title}</h4>
                                                <div className="space-y-3">
                                                    {subsection.blocks.map((block, index) => (
                                                        <BlockRenderer key={`${section.id}-${subsection.title}-${index}`} block={block} />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        {section.wizardSteps && (
                                            <Card className="border-[var(--primary)]/15 bg-[var(--surface-raised)] shadow-none">
                                                <CardContent className="space-y-4 p-5">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <div>
                                                            <p className="type-overline text-[var(--text-muted)]">Wizard mapping</p>
                                                            <h4 className="type-h4 text-[var(--text)]">{section.wizardSteps.title}</h4>
                                                        </div>
                                                        <Link href="/compliance/coida/roe">
                                                            <Button variant="outline" className="min-h-11 gap-2">
                                                                <FileText className="h-4 w-4" />
                                                                Go to /compliance/coida/roe
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                    <ul className="list-disc space-y-2 pl-5 text-[var(--text-muted)]">
                                                        {section.wizardSteps.steps.map((step, index) => (
                                                            <li key={`${section.id}-wizard-${index}`} className="type-body leading-7">
                                                                {step.lead && <strong className="font-semibold text-[var(--text)]">{renderRichText(step.lead)} </strong>}
                                                                {renderRichText(step.text)}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <BackToTop />
                    </section>
                </ExpandableSection>

                <ExpandableSection
                    id="screen-callouts"
                    title="What each screen is for"
                    description="Short reminders for the main screens without reading the full reference."
                >
                    <section className="space-y-5 scroll-mt-20">
                        <CopyHeading id="screen-callouts" title="Screen callout boxes" level="h2" copiedId={copiedId} onCopy={handleCopy} />
                        <div className="grid gap-4 lg:grid-cols-2">
                            {adminGuide.screenCallouts.map((callout) => (
                                <Card key={callout.id} id={callout.id} className="border-[var(--primary)]/20 bg-[var(--surface-raised)] shadow-none scroll-mt-20">
                                    <CardContent className="space-y-4 p-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="type-overline text-[var(--text-muted)]">What to do on this screen</p>
                                                <h3 className="type-h4 text-[var(--text)]">{callout.title}</h3>
                                            </div>
                                            {callout.screenHref && (
                                                <Link href={callout.screenHref} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]">
                                                    Open
                                                </Link>
                                            )}
                                        </div>
                                        <ul className="list-disc space-y-2 pl-5 text-[var(--text-muted)]">
                                            {callout.items.map((item) => (
                                                <li key={item} className="type-body leading-7">{item}</li>
                                            ))}
                                        </ul>
                                        <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
                                            <p className="type-body text-[var(--text-muted)]"><strong className="text-[var(--text)]">Common mistake:</strong> {callout.commonMistake}</p>
                                            <p className="type-body text-[var(--text-muted)]"><strong className="text-[var(--text)]">You’re okay if…</strong> {callout.okayIf}<CitationLinks footnotes={callout.footnotes} /></p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <BackToTop />
                    </section>
                </ExpandableSection>

                <ExpandableSection
                    id="microcopy"
                    title="Field help and wording"
                    description="Open only if you want detailed tooltip wording or field-by-field help."
                >
                    <section className="space-y-5 scroll-mt-20">
                        <CopyHeading id="microcopy" title="Microcopy/tooltips" level="h2" copiedId={copiedId} onCopy={handleCopy} />
                        <div className="space-y-3">
                            {adminGuide.microcopyGroups.map((group) => (
                                <Card key={group.id} className="glass-panel border-none overflow-hidden">
                                    <details className="group">
                                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
                                            <div>
                                                <p className="type-overline text-[var(--text-muted)]">Tooltip pack</p>
                                                <h3 className="type-h4 text-[var(--text)]">{group.title}</h3>
                                            </div>
                                            <span className="text-sm font-semibold text-[var(--primary)] group-open:hidden">Open</span>
                                            <span className="hidden text-sm font-semibold text-[var(--primary)] group-open:inline">Close</span>
                                        </summary>
                                        <div className="border-t border-[var(--border)] px-5 pb-5 pt-4">
                                            <div className="space-y-3">
                                                {group.items.map((item) => (
                                                    <div key={`${group.id}-${item.number}`} className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                                                        <p className="type-label text-[var(--text)]">{item.number}. {item.label}</p>
                                                        <p className="type-body mt-2 text-[var(--text-muted)]">{renderRichText(item.text)}<CitationLinks footnotes={item.footnotes} /></p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </details>
                                </Card>
                            ))}
                        </div>
                        <BackToTop />
                    </section>
                </ExpandableSection>

                <ExpandableSection
                    id="worked-examples"
                    title="Worked examples"
                    description="Simple examples for common household pay situations."
                >
                    <section className="space-y-5 scroll-mt-20">
                        <CopyHeading id="worked-examples" title="Worked examples" level="h2" copiedId={copiedId} onCopy={handleCopy} />
                        <div className="grid gap-4 lg:grid-cols-2">
                            {adminGuide.workedExamples.map((example) => (
                                <Card key={example.id} id={example.id} className="glass-panel border-none scroll-mt-20">
                                    <CardContent className="space-y-4 p-5">
                                        <h3 className="type-h4 text-[var(--text)]">{example.title}</h3>
                                        {example.paragraphs?.map((paragraph, index) => (
                                            <p key={`${example.id}-paragraph-${index}`} className="type-body leading-7 text-[var(--text-muted)]">
                                                {renderRichText(paragraph.text)}
                                                <CitationLinks footnotes={paragraph.footnotes} />
                                            </p>
                                        ))}
                                        {example.bullets && (
                                            <ul className="list-disc space-y-2 pl-5 text-[var(--text-muted)]">
                                                {example.bullets.map((bullet: GuideListItem, index) => (
                                                    <li key={`${example.id}-bullet-${index}`} className="type-body leading-7">
                                                        {renderRichText(bullet.text)}
                                                        <CitationLinks footnotes={bullet.footnotes} />
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <BackToTop />
                    </section>
                </ExpandableSection>

                <ExpandableSection
                    id="source-log"
                    title="Sources and verification"
                    description="Reference material behind the guide. Most household users will not need this every visit."
                >
                    <section className="space-y-5 scroll-mt-20">
                        <CopyHeading id="source-log" title="Source log" level="h2" copiedId={copiedId} onCopy={handleCopy} />
                        <Alert>
                            <AlertTitle>Source note</AlertTitle>
                            <AlertDescription>{adminGuide.sourceVerificationNote}</AlertDescription>
                        </Alert>
                        <div className="space-y-3">
                            {adminGuide.sourceLog.map((section) => (
                                <Card key={section.id} className="glass-panel border-none overflow-hidden">
                                    <details className="group" open={section.id === "source-dashboard"}>
                                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
                                            <h3 className="type-h4 text-[var(--text)]">{section.title}</h3>
                                            <span className="text-sm font-semibold text-[var(--primary)] group-open:hidden">Open</span>
                                            <span className="hidden text-sm font-semibold text-[var(--primary)] group-open:inline">Close</span>
                                        </summary>
                                        <div className="border-t border-[var(--border)] px-5 pb-5 pt-4">
                                            <ul className="space-y-3">
                                                {section.items.map((item, index) => (
                                                    <li key={`${section.id}-${index}`} className={`rounded-xl border p-4 ${item.note ? "border-[var(--focus)]/30 bg-[var(--surface-raised)]" : "border-[var(--border)] bg-[var(--surface-1)]"}`}>
                                                        <p className="type-body leading-7 text-[var(--text-muted)]">
                                                            {renderRichText(item.text)}
                                                            <CitationLinks footnotes={item.footnotes} />
                                                        </p>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </details>
                                </Card>
                            ))}
                        </div>

                        <Card className="glass-panel border-none">
                            <CardHeader>
                                <CardTitle className="type-h4">Footnotes</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0">
                                {adminGuide.footnotes.map((footnote) => (
                                    <div key={footnote.id} id={`footnote-${footnote.id}`} className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 scroll-mt-20">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="outline">[{footnote.id}]</Badge>
                                            {footnote.needsVerification && <Badge>Verify link</Badge>}
                                        </div>
                                        <a
                                            href={footnote.href}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-3 inline-flex items-center gap-2 break-all text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]"
                                        >
                                            {footnote.title}
                                            <ExternalLink className="h-4 w-4 shrink-0" />
                                        </a>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        <BackToTop />
                    </section>
                </ExpandableSection>
            </div>
        </div>
    );
}
