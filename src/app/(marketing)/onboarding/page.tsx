import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
    {
        title: "Try the free payslip tool",
        body: "Generate one payslip per month as a downloadable PDF. No account needed, no data stored.",
    },
    {
        title: "Upgrade for cloud-secured records",
        body: "Paid plans add encrypted cloud storage, the dashboard, documents, contracts, leave tracking, and exports.",
    },
    {
        title: "Choose your encryption mode",
        body: "During secure setup, choose Recoverable Encryption for password-based recovery or Maximum Privacy for key-only access.",
    },
] as const;

export default function OnboardingPage() {
    return (
        <main id="main-content" className="min-h-screen bg-[var(--bg)] px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,24rem)] lg:items-start">
                <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)] sm:p-8 lg:p-10">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/15 bg-[var(--primary)]/8 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Start calmly
                    </div>

                    <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl">
                        Try a free payslip. Upgrade when you need more.
                    </h1>
                    <p className="mt-4 max-w-[42rem] text-base leading-7 text-[var(--text-muted)]">
                        Start with the free payslip tool — no account needed. When you need cloud-secured records, the dashboard, contracts, and more, upgrade to a paid plan.
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link href="/dashboard" className="w-full sm:w-auto">
                            <Button className="w-full sm:min-w-[220px]">
                                Start free
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/pricing" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full sm:min-w-[220px]">
                                View plans
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-10 grid gap-4 md:grid-cols-3">
                        {steps.map((step) => (
                            <article key={step.title} className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-1)] p-5">
                                <div className="flex items-center gap-2 text-[var(--primary)]">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em]">Step</p>
                                </div>
                                <h2 className="mt-3 text-lg font-bold text-[var(--text)]">{step.title}</h2>
                                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{step.body}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <aside className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-sm)] sm:p-7">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                            <Smartphone className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Good to know</p>
                            <p className="text-sm font-semibold text-[var(--text)]">Free is one PDF per month</p>
                        </div>
                    </div>

                    <ul className="mt-6 space-y-3 text-sm leading-6 text-[var(--text-muted)]">
                        <li>No account is required for the free payslip tool.</li>
                        <li>Paid plans unlock cloud-secured records, the dashboard, and account-based access from any device.</li>
                        <li>On a new device, sign in to access your encrypted cloud records.</li>
                    </ul>
                </aside>
            </div>
        </main>
    );
}
