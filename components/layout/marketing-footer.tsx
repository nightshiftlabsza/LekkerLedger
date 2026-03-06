import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export function MarketingFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-20 border-t border-[var(--border)] bg-[var(--surface-2)]">
            <div className="content-container-wide px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Product</h4>
                        <div className="space-y-2">
                            <Link href="/#how-it-works" className="block text-sm text-[var(--text-muted)] hover:text-[var(--primary)]">How it works</Link>
                            <Link href="/pricing" className="block text-sm text-[var(--text-muted)] hover:text-[var(--primary)]">Pricing</Link>
                            <Link href="/calculator" className="block text-sm text-[var(--text-muted)] hover:text-[var(--primary)]">Wage Calculator</Link>
                            <Link href="/rules" className="block text-sm text-[var(--text-muted)] hover:text-[var(--primary)]">Compliance Guide</Link>
                        </div>
                    </div>
                    <div>
                        <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Legal</h4>
                        <div className="space-y-2">
                            <Link href="/legal/privacy" className="block text-sm text-[var(--text-muted)] hover:text-[var(--primary)]">Privacy Policy</Link>
                            <Link href="/legal/terms" className="block text-sm text-[var(--text-muted)] hover:text-[var(--primary)]">Terms of Service</Link>
                            <Link href="/legal/refunds" className="block text-sm text-[var(--text-muted)] hover:text-[var(--primary)]">Refund Policy</Link>
                            <Link href="/trust" className="block text-sm font-semibold text-[var(--primary)] hover:underline">Trust Center</Link>
                        </div>
                    </div>
                    <div>
                        <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Connect</h4>
                        <a
                            href="mailto:support@lekkerledger.co.za"
                            className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--primary)]"
                        >
                            <Mail className="h-3.5 w-3.5" />
                            Email Support
                        </a>
                    </div>
                    <div className="max-w-xs">
                        <Link href="/" className="mb-5 inline-block outline-none transition-opacity hover:opacity-90">
                            <Logo iconClassName="h-12 w-12" textClassName="text-[1.32rem]" className="gap-2.5" />
                        </Link>
                        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                            Household payroll records
                        </p>
                        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                            Calm payroll records, annual paperwork, and document history in one place.
                        </p>
                    </div>
                </div>

                <div className="mt-10 flex flex-col gap-3 border-t border-[var(--border)] pt-6 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <p>© {currentYear} LekkerLedger. All rights reserved.</p>
                        <p>Built by NightShift Labs ZA. Made in South Africa.</p>
                    </div>
                    <p>General information, not legal advice.</p>
                </div>
            </div>
        </footer>
    );
}
