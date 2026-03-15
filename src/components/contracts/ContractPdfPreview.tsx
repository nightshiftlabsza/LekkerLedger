"use client";

import { useMemo } from "react";
import type { Contract, Employee, EmployerSettings } from "@/lib/schema";
import { buildContractClauses } from "@/lib/contracts/contractTemplate";

type ContractPdfPreviewProps = {
    contract: Contract;
    employee: Employee;
    settings: EmployerSettings;
};

export function ContractPdfPreview({ contract, employee, settings }: ContractPdfPreviewProps) {
    const clauses = useMemo(() => {
        try {
            return buildContractClauses(contract, employee, settings);
        } catch (error) {
            console.error(error);
            return [];
        }
    }, [contract, employee, settings]);

    if (!clauses.length) {
        return (
            <div className="flex h-full items-center justify-center p-8 text-center text-sm text-[var(--text-muted)] bg-[var(--surface-1)]">
                Could not generate preview content.
            </div>
        );
    }

    const employerName = settings.employerName || "Employer";

    return (
        <div className="mx-auto my-8 max-w-[595px] bg-white p-10 shadow-lg sm:p-12 print:m-0 print:max-w-none print:shadow-none min-h-[842px]">
            <header className="mb-10 text-center space-y-1">
                <h1 className="font-serif text-2xl font-bold text-gray-900 tracking-tight">EMPLOYMENT CONTRACT</h1>
                <p className="text-sm text-gray-600">
                    Between <strong>{employerName}</strong> and <strong>{employee.name}</strong>
                </p>
                {contract.effectiveDate && (
                    <p className="text-xs text-gray-400">
                        Effective {new Date(contract.effectiveDate).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                )}
                <div className="mt-4 border-b-2 border-gray-800" />
            </header>

            <main className="space-y-8 text-[13px] leading-relaxed text-gray-800">
                {clauses.map((clause, index) => {
                    const number = index + 1;

                    if (clause.type === "signatures") {
                        return (
                            <section key={clause.title} className="mt-12 break-inside-avoid">
                                <h2 className="mb-2 font-sans text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-1">
                                    {number}. {clause.title}
                                </h2>
                                <p className="text-center text-[10px] text-gray-400 mb-6 uppercase tracking-widest">— Please sign below —</p>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <div className="border-t border-gray-400 pt-2">
                                            <p className="font-bold text-gray-500 text-[10px] uppercase">Employer signature</p>
                                            <p className="mt-1 text-gray-900">{settings.employerName || "Employer"}</p>
                                            <p className="mt-4 text-gray-500 text-[10px]">Date: ____________________</p>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="border-t border-gray-400 pt-2">
                                            <p className="font-bold text-gray-500 text-[10px] uppercase">Employee signature</p>
                                            <p className="mt-1 text-gray-900">{employee.name}</p>
                                            <p className="mt-4 text-gray-500 text-[10px]">Date: ____________________</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        );
                    }

                    return (
                        <section key={clause.title}>
                            <h2 className="mb-3 font-sans text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-1">
                                {number}. {clause.title}
                            </h2>

                            {clause.type === "rows" && clause.rows && (
                                <div className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-2">
                                    {clause.rows.map((row) => (
                                        <div key={row.label} className="contents">
                                            <div className="font-semibold text-gray-500 py-0.5 border-b border-gray-50">{row.label}:</div>
                                            <div className="text-gray-900 py-0.5 border-b border-gray-50">{row.value}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {clause.type === "paragraphs" && clause.paragraphs && (
                                <div className="space-y-2">
                                    {clause.paragraphs.map((p) => (
                                        <p key={p.slice(0, 32)}>{p}</p>
                                    ))}
                                </div>
                            )}

                            {clause.type === "bullets" && clause.bullets && (
                                <ul className="list-inside space-y-1">
                                    {clause.bullets.map((b) => (
                                        <li key={b.slice(0, 32)} className="flex gap-2">
                                            <span className="mt-[-1px] font-bold text-[#007A4D]">&bull;</span>
                                            <span>{b}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    );
                })}
            </main>

            <footer className="mt-12 border-t border-gray-200 pt-4 text-center">
                <p className="text-[10px] text-gray-400">
                    Review carefully before signing · Keep the signed copy with the employee&apos;s records
                </p>
            </footer>
        </div>
    );
}
