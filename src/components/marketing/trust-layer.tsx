import { CheckCircle2, XCircle } from "lucide-react";

export function Testimonials() {
    return (
        <section className="border-t border-[var(--border)] py-16" style={{ backgroundColor: "var(--surface-raised)" }}>
            <div className="marketing-shell">
                <div className="mb-10 text-center">
                    <h2 className="type-h2" style={{ color: "var(--text)" }}>Trusted by South African Households</h2>
                    <p className="mt-3 text-base" style={{ color: "var(--text-muted)" }}>
                        Running a household shouldn&apos;t feel like running a corporate HR department.
                    </p>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    <TestimonialCard 
                        quote="I built this because I employ a domestic worker and spent too long on spreadsheets every month."
                        author="Zakariyya"
                        role="Founder, LekkerLedger"
                    />
                    <TestimonialCard 
                        quote="Finally, a tool that actually shows me the exact UIF deduction without needing to check the government site every time."
                        author="Nomsa D."
                        role="Household Employer"
                    />
                    <TestimonialCard 
                        quote="I used to dread month-end. Now I click generate, email the payslip, and I know I have a record if I ever need it."
                        author="Sarah M."
                        role="Homeowner, Johannesburg"
                    />
                </div>
            </div>
        </section>
    );
}

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
    return (
        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-sm">
            <p className="text-[15px] italic leading-relaxed" style={{ color: "var(--text)" }}>
                &ldquo;{quote}&rdquo;
            </p>
            <div className="mt-6 flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center font-bold" style={{ color: "var(--primary)" }}>
                    {author[0]}
                </div>
                <div>
                    <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{author}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{role}</p>
                </div>
            </div>
        </div>
    );
}

export function ComparisonTable() {
    return (
        <section className="py-16" style={{ backgroundColor: "var(--bg)" }}>
            <div className="marketing-shell">
                <div className="mb-10 text-center">
                    <h2 className="type-h2" style={{ color: "var(--text)" }}>Why not just...</h2>
                    <p className="mt-3 text-base" style={{ color: "var(--text-muted)" }}>
                        See how LekkerLedger saves you time compared to the alternatives.
                    </p>
                </div>
                
                <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface-1)] shadow-sm">
                    <div className="grid grid-cols-4 border-b border-[var(--border)] bg-[var(--surface-raised)] p-4 sm:p-6 text-sm font-bold">
                        <div className="col-span-1" style={{ color: "var(--text-muted)" }}>Features</div>
                        <div className="text-center" style={{ color: "var(--text-muted)" }}>Spreadsheet</div>
                        <div className="text-center" style={{ color: "var(--text-muted)" }}>Using an Accountant</div>
                        <div className="text-center" style={{ color: "var(--primary)" }}>LekkerLedger</div>
                    </div>
                    <ComparisonRow feature="Cost" ex1="Free" ex2="R500 - R1,500/mo" ex3="From R299/yr" />
                    <ComparisonRow feature="Auto-calculates UIF" ex1={false} ex2={true} ex3={true} />
                    <ComparisonRow feature="Stores worker records securely" ex1={false} ex2={true} ex3={true} />
                    <ComparisonRow feature="Generates payslips instantly" ex1={false} ex2={true} ex3={true} />
                    <ComparisonRow feature="Done in under 90 seconds" ex1={false} ex2={false} ex3={true} />
                </div>
            </div>
        </section>
    );
}

function ComparisonRow({ feature, ex1, ex2, ex3 }: { feature: string; ex1: string | boolean; ex2: string | boolean; ex3: string | boolean }) {
    const renderCell = (val: string | boolean, isPrimary: boolean = false) => {
        if (typeof val === "string") return <span className="font-medium" style={{ color: isPrimary ? "var(--text)" : "var(--text-muted)" }}>{val}</span>;
        return val ? <CheckCircle2 className="mx-auto h-5 w-5" style={{ color: isPrimary ? "var(--primary)" : "var(--text-muted)" }} /> : <XCircle className="mx-auto h-5 w-5 opacity-30" style={{ color: "var(--text-muted)" }} />;
    };

    return (
        <div className="grid grid-cols-4 items-center border-b border-[var(--border)] last:border-0 p-4 sm:p-6 text-sm">
            <div className="col-span-1 font-medium" style={{ color: "var(--text)" }}>{feature}</div>
            <div className="text-center">{renderCell(ex1)}</div>
            <div className="text-center">{renderCell(ex2)}</div>
            <div className="text-center">{renderCell(ex3, true)}</div>
        </div>
    );
}

export function FounderBlock() {
    return (
        <section className="py-16" style={{ backgroundColor: "var(--bg)" }}>
            <div className="marketing-shell max-w-3xl">
                <div className="rounded-[32px] border border-[var(--focus)]/20 p-8 sm:p-12" style={{ background: "linear-gradient(135deg, rgba(0, 122, 77, 0.04) 0%, rgba(0, 122, 77, 0.01) 100%)" }}>
                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "var(--primary)" }}>
                        Why Trust Us
                    </p>
                    <h2 className="mt-4 type-h2" style={{ color: "var(--text)" }}>Built by a South African household employer who got tired of the admin.</h2>
                    <p className="mt-6 text-base leading-8" style={{ color: "var(--text-muted)" }}>
                        &ldquo;I built LekkerLedger because I employ a domestic worker and was spending too much time fighting with spreadsheets at the end of every month. I wanted a tool that would calculate the exact UIF deductions, generate a clean PDF payslip, and securely store my records in case of any future compliance checks. LekkerLedger is exactly that. Based in Mpumalanga, built for South African households.&rdquo;
                    </p>
                    <div className="mt-8 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-lg">Z</div>
                        <div>
                            <p className="font-bold text-base" style={{ color: "var(--text)" }}>Zakariyya</p>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Founder, NightShift Labs ZA</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
