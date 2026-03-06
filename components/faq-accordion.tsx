"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
    question: string;
    answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
    {
        question: "Is LekkerLedger a payroll service?",
        answer: "No. LekkerLedger is a records tool. It helps you generate payslips, contracts, exports, and a clean archive. You still pay your employee directly; LekkerLedger helps you document it properly.",
    },
    {
        question: "Where is my data stored?",
        answer: "Your employee data stays on your device by default. If you sign in with Google, you can optionally sync to your own Google Drive. LekkerLedger does not maintain a central employee database.",
    },
    {
        question: "Is this legal advice?",
        answer: "No. LekkerLedger provides guardrails based on publicly available regulations, but it is not a substitute for professional legal advice.",
    },
    {
        question: "What happens if I lose my device?",
        answer: "If you've enabled Google Drive backup, your records are backed up to your personal Drive. Without backup, data is only on your device.",
    },
    {
        question: "Can I use this for more than one employee?",
        answer: "Yes. Free supports 1 active employee. Standard supports up to 3 active employees. Pro supports unlimited employees.",
    },
    {
        question: "Which plan supports more than one household?",
        answer: "Pro is the multi-household tier. It's designed for families, bookkeepers, or anyone managing payroll admin across more than one home.",
    },
    {
        question: "How long should I keep payslip records?",
        answer: "Household employers should keep payroll records for years, not weeks. Requests do happen, and it is much easier to respond calmly when the record trail is already there. Standard gives you a 12-month archive, and Pro extends that to 5 years with deeper backup and workspace tools.",
    },
    {
        question: "Why pay for this instead of fixing records later?",
        answer: "Because tidy monthly records are usually far cheaper than rushed clean-up work later, especially if UIF or COIDA paperwork needs to be reconstructed. The paid plans are priced for households, not large HR teams or managed payroll retainers.",
    },
];

export function FaqAccordion() {
    const [openIndex, setOpenIndex] = React.useState<number | null>(null);

    return (
        <div className="space-y-3 max-w-3xl mx-auto">
            {FAQ_ITEMS.map((item, i) => {
                const isOpen = openIndex === i;
                return (
                    <div
                        key={i}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden transition-shadow hover:shadow-[var(--shadow-1)]"
                    >
                        <button
                            onClick={() => setOpenIndex(isOpen ? null : i)}
                            className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer group"
                            aria-expanded={isOpen}
                        >
                            <span className="text-sm sm:text-base font-bold pr-4" style={{ color: "var(--text)" }}>
                                {item.question}
                            </span>
                            <ChevronDown
                                className="h-4 w-4 shrink-0 transition-transform duration-300"
                                style={{
                                    color: "var(--text-muted)",
                                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                                }}
                            />
                        </button>
                        <div
                            className="overflow-hidden transition-all duration-300 ease-out"
                            style={{
                                maxHeight: isOpen ? "300px" : "0px",
                                opacity: isOpen ? 1 : 0,
                            }}
                        >
                            <div className="px-6 pb-5 text-sm leading-relaxed font-medium" style={{ color: "var(--text-muted)" }}>
                                {item.answer}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}


