import * as React from "react";
import { COMPANY_NAME, COMPANY_ADDRESS, SUPPORT_EMAIL, PRIVACY_EMAIL } from "@/config/brand";

export function SupplierDetails() {
    return (
        <section className="rounded-2xl border border-[var(--primary)]/10 bg-[var(--primary)]/5 p-6">
            <h2 className="text-xl font-black text-[var(--text)]">Supplier details</h2>
            <div className="mt-4 space-y-2 text-sm leading-7 text-[var(--text-muted)]">
                <p>
                    <strong className="text-[var(--text)]">Supplier:</strong> {COMPANY_NAME}
                </p>
                <p>
                    <strong className="text-[var(--text)]">Entity type:</strong> Sole proprietorship
                </p>
                <p>
                    <strong className="text-[var(--text)]">Jurisdiction:</strong> South Africa
                </p>
                <p>
                    <strong className="text-[var(--text)]">Physical address:</strong> {COMPANY_ADDRESS}
                </p>
                <p>
                    <strong className="text-[var(--text)]">General contact:</strong>{" "}
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[var(--primary)]">{SUPPORT_EMAIL}</a>
                </p>
                <p>
                    <strong className="text-[var(--text)]">Privacy contact:</strong>{" "}
                    <a href={`mailto:${PRIVACY_EMAIL}`} className="text-[var(--primary)]">{PRIVACY_EMAIL}</a>
                </p>
            </div>
        </section>
    );
}
