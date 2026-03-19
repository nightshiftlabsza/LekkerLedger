import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { COMPANY_NAME, PRIVACY_EMAIL, SUPPORT_EMAIL } from "@/config/brand";

const FOOTER_GROUPS = [
    {
        title: "Product",
        links: [
            { href: "/#how-it-works", label: "How it works" },
            { href: "/pricing", label: "Pricing" },
            { href: "/calculator", label: "Wage & UIF calculator" },
            { href: "/login", label: "Log in" },
        ],
    },
    {
        title: "Resources",
        links: [
            { href: "/resources/tools/domestic-worker-payslip", label: "Payslip Generator" },
            { href: "/resources/guides/uif-for-domestic-workers", label: "UIF Guide" },
            { href: "/resources/guides/domestic-worker-minimum-wage-2026", label: "NMW Rules 2026" },
            { href: "/resources/guides/4-hour-minimum-pay-rule", label: "4-Hour Pay Rule" },
            { href: "/uif-calculator", label: "UIF Calculator" },
            { href: "/resources/checklists/household-employer-monthly", label: "Monthly Checklist" },
            { href: "/resources", label: "All Resources" },
        ],
    },
    {
        title: "Legal",
        links: [
            { href: "/legal/privacy", label: "Privacy Policy" },
            { href: "/legal/terms", label: "Terms of Service" },
            { href: "/legal/refunds", label: "Refund Policy" },
            { href: "/trust", label: "Trust Center", accent: true },
        ],
    },
    {
        title: "Connect",
        links: [
            { href: "/support", label: "Support Center", accent: true },
        ],
    },
] as const;

export function MarketingFooter() {
    const currentYear = new Date().getFullYear();
    const footerLinkClass = "block min-h-[44px] rounded-lg py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--primary)]";
    const footerAccentLinkClass = "block min-h-[44px] rounded-lg py-2 text-sm font-bold text-[var(--primary)] transition-colors hover:underline";

    return (
        <footer className="relative mt-12 overflow-hidden border-t border-[var(--border)] bg-[var(--surface-2)]">
            <div
                className="h-1 w-full"
                style={{ background: "linear-gradient(90deg, var(--primary) 0%, #C47A1C 100%)", opacity: 0.15 }}
            />

            <div className="marketing-shell py-10 sm:py-12">
                <div className="grid gap-10 border-b border-[var(--border)] pb-10 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:gap-12">
                    <div className="space-y-4">
                        <Link href="/" className="inline-flex min-h-[44px] items-center gap-2 rounded-xl py-1 outline-none transition-transform hover:scale-[1.01] active:scale-[0.99]">
                            <Logo iconClassName="h-9 w-9" textClassName="text-[1.12rem]" className="gap-2" />
                        </Link>

                        <p className="max-w-[34ch] text-sm leading-7" style={{ color: "var(--text-muted)" }}>
                            Household payroll records, calmer monthly admin, and organised annual paperwork.
                        </p>

                        <div className="space-y-1.5 text-[11px] leading-5" style={{ color: "var(--text-muted)" }}>
                            <p className="font-semibold" style={{ color: "var(--text)" }}>
                                Copyright {currentYear} LekkerLedger. All rights reserved.
                            </p>
                            <p>Built by {COMPANY_NAME}.</p>
                            <p className="font-semibold uppercase tracking-[0.18em]">Made for South African household employers.</p>
                        </div>
                    </div>

                    <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 xl:grid-cols-4">
                        {FOOTER_GROUPS.map((group) => (
                            <section key={group.title} className="space-y-4">
                                <h2 className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
                                    {group.title}
                                </h2>

                                <nav className="space-y-1.5">
                                    {group.links.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={link.accent ? footerAccentLinkClass : footerLinkClass}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </nav>

                                {group.title === "Connect" ? (
                                    <div className="space-y-3 border-t border-[var(--border)] pt-4">
                                        <a
                                            href={`mailto:${SUPPORT_EMAIL}`}
                                            className={footerLinkClass}
                                        >
                                            <span className="flex min-h-[28px] items-center gap-2">
                                                <Mail className="h-3.5 w-3.5" />
                                                Email support
                                            </span>
                                        </a>
                                        <a
                                            href={`mailto:${PRIVACY_EMAIL}`}
                                            className={footerLinkClass}
                                        >
                                            <span className="flex min-h-[28px] items-center gap-2">
                                                <Mail className="h-3.5 w-3.5" />
                                                Privacy & data
                                            </span>
                                        </a>
                                        <p className="max-w-[24ch] text-xs leading-6" style={{ color: "var(--text-muted)" }}>
                                            Replies usually land within 1 to 4 business days in South African time, Monday to Friday.
                                        </p>
                                    </div>
                                ) : null}
                            </section>
                        ))}
                    </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,44rem)] lg:items-start">
                    <div className="max-w-[30rem] text-xs leading-6" style={{ color: "var(--text-muted)" }}>
                        Keep payslips, contracts, exports, backup access, and support information in one place so the practical and legal details stay easy to find.
                    </div>

                    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:p-6">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text)" }}>
                            Disclaimer
                        </p>
                        <p className="mt-3 max-w-[62ch] text-[11px] leading-6" style={{ color: "var(--text-muted)" }}>
                            LekkerLedger provides administrative tools for household record-keeping. Calculations and templates follow general South African labour guidance, but they are not legal or tax advice. Please verify unusual employment situations against official Department of Employment and Labour, uFiling, or SARS guidance before final submission.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
