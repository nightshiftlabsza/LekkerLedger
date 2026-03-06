import Link from "next/link";

export function MarketingFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-20 border-t border-[var(--border)] bg-[var(--bg)]">
            <div className="content-container-wide mx-auto flex w-full flex-col gap-4 px-4 py-8 text-sm text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                <div className="space-y-1">
                    <p className="font-semibold text-[var(--text)]">LekkerLedger</p>
                    <p>Built by NightShift Labs ZA. Made in South Africa.</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <Link href="/legal/privacy" className="hover:text-[var(--primary)]">Privacy</Link>
                    <Link href="/legal/terms" className="hover:text-[var(--primary)]">Terms</Link>
                    <Link href="/legal/refunds" className="hover:text-[var(--primary)]">Refunds</Link>
                    <span>© {currentYear}</span>
                </div>
            </div>
        </footer>
    );
}
