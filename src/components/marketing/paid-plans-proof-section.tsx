"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";

type ProofPanel = {
    id: "monthly-record" | "contracts-documents";
    label: string;
    title: string;
    body: string;
    bullets: string[];
    ctaLabel: string;
    href: string;
    imageSrc: string;
    imageAlt: string;
};

const PANELS: readonly ProofPanel[] = [
    {
        id: "monthly-record",
        label: "Monthly record",
        title: "See the month in one place",
        body: "Paid plans help you keep the current pay period, worker details, and supporting records together, so you can see what is done and what still needs attention.",
        bullets: [
            "Return next month without starting from scratch",
            "Keep payroll, leave, and documents tied to the same worker record",
        ],
        ctaLabel: "See full pricing",
        href: "/pricing",
        imageSrc: "/images/marketing/homepage-dashboard-overview.webp",
        imageAlt: "LekkerLedger dashboard showing the current monthly workspace, payroll progress, and recent records for one worker.",
    },
    {
        id: "contracts-documents",
        label: "Contracts and documents",
        title: "Keep contracts with the worker record",
        body: "Store contracts and supporting documents in the same place as the monthly record, instead of scattering files across email, folders, and chat attachments.",
        bullets: [
            "Find the right paperwork quickly",
            "Keep the contract attached to the worker it belongs to",
        ],
        ctaLabel: "See what paid plans include",
        href: "/pricing",
        imageSrc: "/images/marketing/homepage-contracts-documents.webp",
        imageAlt: "LekkerLedger contracts view showing the worker contract workflow and related documents in one place.",
    },
] as const;

export function PaidPlansProofSection() {
    const [activePanelId, setActivePanelId] = React.useState<ProofPanel["id"]>(PANELS[0].id);
    const activePanel = PANELS.find((panel) => panel.id === activePanelId) ?? PANELS[0];

    return (
        <section id="paid-plans" className="scroll-mt-24" style={{ backgroundColor: "var(--bg)" }}>
            <div className="marketing-shell marketing-section">
                <div className="max-w-3xl space-y-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                        Paid plans
                    </p>
                    <h2 className="type-h2 max-w-[20ch]" style={{ color: "var(--text)" }}>
                        What paid plans add after the first payslip
                    </h2>
                    <p className="max-w-[44rem] text-base leading-7" style={{ color: "var(--text-muted)" }}>
                        The free sample helps you check one month. Paid plans keep the rest of the household record together, so you are not rebuilding the same admin every payday.
                    </p>
                </div>

                <div className="mt-8 hidden lg:grid lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)] lg:gap-8 xl:gap-10">
                    <div
                        role="tablist"
                        aria-label="Paid plan proof panels"
                        className="space-y-3 rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-[var(--shadow-1)]"
                    >
                        {PANELS.map((panel) => {
                            const isActive = panel.id === activePanel.id;
                            return (
                                <button
                                    key={panel.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-controls={`paid-proof-panel-${panel.id}`}
                                    onClick={() => setActivePanelId(panel.id)}
                                    className={`w-full rounded-[22px] border px-4 py-4 text-left transition-colors ${
                                        isActive
                                            ? "border-[var(--primary)]/25 bg-[var(--primary)]/7"
                                            : "border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--primary)]/15 hover:bg-[var(--surface-1)]"
                                    }`}
                                >
                                    <p
                                        className="text-[10px] font-black uppercase tracking-[0.18em]"
                                        style={{ color: isActive ? "var(--primary)" : "var(--text-muted)" }}
                                    >
                                        {panel.label}
                                    </p>
                                    <h3 className="mt-2 text-lg font-black" style={{ color: "var(--text)" }}>
                                        {panel.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                                        {panel.body}
                                    </p>
                                </button>
                            );
                        })}
                    </div>

                    <article
                        id={`paid-proof-panel-${activePanel.id}`}
                        className="rounded-[30px] border border-[var(--border)] bg-[var(--surface-1)] p-5 shadow-[0_20px_50px_rgba(16,24,40,0.08)] sm:p-6"
                    >
                        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] xl:items-start">
                            <ProofImageFrame
                                src={activePanel.imageSrc}
                                alt={activePanel.imageAlt}
                                className="order-1 xl:order-2"
                            />
                            <div className="order-2 space-y-4 xl:order-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--primary)" }}>
                                    {activePanel.label}
                                </p>
                                <h3 className="text-2xl font-black tracking-tight" style={{ color: "var(--text)" }}>
                                    {activePanel.title}
                                </h3>
                                <p className="text-sm leading-7" style={{ color: "var(--text-muted)" }}>
                                    {activePanel.body}
                                </p>
                                <ul className="space-y-3">
                                    {activePanel.bullets.map((bullet) => (
                                        <li key={bullet} className="flex items-start gap-3">
                                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
                                            <span className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                                                {bullet}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href={activePanel.href}
                                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--primary-hover)]"
                                >
                                    {activePanel.ctaLabel} <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </article>
                </div>

                <div className="mt-8 space-y-4 lg:hidden">
                    {PANELS.map((panel) => {
                        const isOpen = panel.id === activePanelId;
                        return (
                            <article
                                key={panel.id}
                                className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--shadow-1)]"
                            >
                                <button
                                    type="button"
                                    aria-expanded={isOpen}
                                    aria-controls={`paid-proof-accordion-${panel.id}`}
                                    onClick={() => setActivePanelId(panel.id)}
                                    className="flex min-h-[44px] w-full items-start justify-between gap-4 px-4 py-4 text-left"
                                >
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "var(--primary)" }}>
                                            {panel.label}
                                        </p>
                                        <h3 className="mt-2 text-lg font-black" style={{ color: "var(--text)" }}>
                                            {panel.title}
                                        </h3>
                                    </div>
                                    <ChevronDown
                                        className={`mt-1 h-5 w-5 shrink-0 text-[var(--text-muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}
                                    />
                                </button>
                                {isOpen ? (
                                    <div id={`paid-proof-accordion-${panel.id}`} className="space-y-4 border-t border-[var(--border)] px-4 py-4">
                                        <p className="text-sm leading-7" style={{ color: "var(--text-muted)" }}>
                                            {panel.body}
                                        </p>
                                        <ProofImageFrame src={panel.imageSrc} alt={panel.imageAlt} />
                                        <ul className="space-y-3">
                                            {panel.bullets.map((bullet) => (
                                                <li key={bullet} className="flex items-start gap-3">
                                                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
                                                    <span className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                                                        {bullet}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}
                            </article>
                        );
                    })}

                    <Link
                        href="/pricing"
                        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--primary-hover)]"
                    >
                        See full pricing <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}

function ProofImageFrame({
    src,
    alt,
    className,
}: Readonly<{
    src: string;
    alt: string;
    className?: string;
}>) {
    return (
        <div className={`rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-3 shadow-[0_12px_30px_rgba(16,24,40,0.06)] ${className ?? ""}`}>
            <div className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-white">
                <Image
                    src={src}
                    alt={alt}
                    width={1440}
                    height={960}
                    className="block h-auto w-full object-cover"
                    sizes="(max-width: 1023px) 100vw, 58vw"
                />
            </div>
        </div>
    );
}
