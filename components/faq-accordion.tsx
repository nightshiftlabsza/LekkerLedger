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
        answer: "No. LekkerLedger is a records tool — it helps you generate payslips, contracts, and keep an organised archive. You still pay your employee directly; we help you document it properly.",
    },
    {
        question: "Where is my data stored?",
        answer: "Your employee data stays on your device (in your browser's local storage). If you sign in with Google, you can optionally sync to your own Google Drive. LekkerLedger does not maintain a central employee database.",
    },
    {
        question: "Is this legal advice?",
        answer: "No. LekkerLedger provides guardrails based on publicly available regulations (like the National Minimum Wage and BCEA requirements), but it is not a substitute for professional legal advice. If you have a specific legal question, consult a labour attorney.",
    },
    {
        question: "What happens if I lose my device?",
        answer: "If you've enabled Google Drive sync, your records are backed up to your personal Drive. Without sync, data is only on your device — so we recommend enabling it for peace of mind.",
    },
    {
        question: "Do I need to register with UIF?",
        answer: "If your domestic worker works more than 24 hours per month, UIF registration is required by law. LekkerLedger reminds you of this threshold and can generate uFiling-compatible export files.",
    },
    {
        question: "Can I use this for more than one employee?",
        answer: "The free plan supports 1 employee. The Annual Support plan (R99/year) supports up to 3, and the Pro plan (R299 once-off) supports unlimited employees.",
    },
    {
        question: "How long should I keep payslip records?",
        answer: "The domestic sector determination requires keeping payslip statements and records for at least three years. LekkerLedger's paid plans offer archives of 1–5 years, and we recommend keeping records for as long as practically possible.",
    },
    {
        question: "Is this open source?",
        answer: "Yes. LekkerLedger's core is open source on GitHub. You can inspect the code, suggest improvements, or run it yourself.",
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
                        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden transition-shadow hover:shadow-[var(--shadow-sm)]"
                    >
                        <button
                            onClick={() => setOpenIndex(isOpen ? null : i)}
                            className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer group"
                            aria-expanded={isOpen}
                        >
                            <span className="text-sm sm:text-base font-bold pr-4" style={{ color: "var(--text-primary)" }}>
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
                            <div className="px-6 pb-5 text-sm leading-relaxed font-medium" style={{ color: "var(--text-secondary)" }}>
                                {item.answer}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
