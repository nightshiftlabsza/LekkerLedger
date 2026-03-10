import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { COMPANY_NAME } from "@/src/config/brand";

export function MarketingFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative mt-12 border-t border-[var(--border)] bg-[var(--surface-2)] overflow-hidden">
            {/* Subtle top gradient bar */}
            <div 
                className="h-1 w-full" 
                style={{ background: "linear-gradient(90deg, var(--primary) 0%, #C47A1C 100%)", opacity: 0.15 }} 
            />
            
            <div className="content-container-wide px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2.8fr)] lg:items-start">
                    <div className="flex flex-col gap-3">
                        <Link href="/" className="inline-flex items-center gap-2 outline-none transition-transform hover:scale-[1.01] active:scale-[0.99]">
                            <Logo iconClassName="h-9 w-9" textClassName="text-[1.12rem]" className="gap-2" />
                        </Link>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            Household payroll records, calmer monthly admin, and organised annual paperwork.
                        </p>
                    </div>

                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <h4 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>Product</h4>
                            <div className="space-y-2.5">
                                <Link href="/#how-it-works" className="block text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">How it works</Link>
                                <Link href="/pricing" className="block text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">Pricing</Link>
                                <Link href="/calculator" className="block text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">Wage & UIF calculator</Link>
                                <Link href="/rules" className="block text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">Household checklist</Link>
                            </div>
                        </div>
                        <div>
                            <h4 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>Legal</h4>
                            <div className="space-y-2.5">
                                <Link href="/legal/privacy" className="block text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">Privacy Policy</Link>
                                <Link href="/legal/terms" className="block text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">Terms of Service</Link>
                                <Link href="/legal/refunds" className="block text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">Refund Policy</Link>
                                <Link href="/trust" className="block text-sm font-bold text-[var(--primary)] hover:underline">Trust Center</Link>
                            </div>
                        </div>
                        <div>
                            <h4 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>Connect</h4>
                            <div className="space-y-2.5">
                                <Link href="/support" className="block text-sm font-bold text-[var(--primary)] hover:underline">
                                    Support Center
                                </Link>
                                <a
                                    href="mailto:support@lekkerledger.co.za"
                                    className="flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                                >
                                    <Mail className="h-3.5 w-3.5" />
                                    Email support
                                </a>
                                <p className="max-w-[18rem] text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                    Reply within 1-4 business days in South African time (Mon-Fri).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div 
                    className="mt-10 flex flex-col gap-6 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-start sm:justify-between"
                >
                    <div className="max-w-xl">
                        <div className="hidden lg:block space-y-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text)]">Professional disclaimer</p>
                            <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                LekkerLedger provides administrative tools for household record-keeping. Calculations and templates are based on general South African labor guidelines but do not constitute legal or tax advice. While we strive for accuracy, the application is not a substitute for professional counsel. Always verify specific or unusual employment situations against official Department of Employment and Labour or SARS documentation before final submission.
                            </p>
                        </div>

                        <details className="lg:hidden rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3">
                            <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wider text-[var(--text)]">
                                Professional disclaimer
                            </summary>
                            <p className="mt-2 text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                LekkerLedger provides administrative tools for household record-keeping. Calculations and templates are based on general South African labor guidelines but do not constitute legal or tax advice. While we strive for accuracy, the application is not a substitute for professional counsel. Always verify specific or unusual employment situations against official Department of Employment and Labour or SARS documentation before final submission.
                            </p>
                        </details>
                    </div>
                    <div className="flex flex-col gap-2 text-left sm:text-right">
                        <p className="text-[11px] font-bold" style={{ color: "var(--text)" }}>© {currentYear} LekkerLedger. All rights reserved.</p>
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Built by {COMPANY_NAME}.</p>
                        <div className="mt-2 flex items-center gap-2 sm:justify-end">
                            <span className="h-1 w-1 rounded-full bg-[var(--primary)]" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Made in South Africa</p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
