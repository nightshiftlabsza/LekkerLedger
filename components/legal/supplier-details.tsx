import * as React from "react";
import { COMPANY_NAME } from "@/src/config/brand";

export function SupplierDetails() {
    return (
        <section className="rounded-2xl border border-[var(--primary)]/10 bg-[var(--primary)]/5 p-6">
            <h2 className="text-xl font-black text-white">Supplier details</h2>
            <div className="mt-4 space-y-2 text-sm leading-7 text-zinc-400">
                <p>
                    <strong className="text-white">Supplier:</strong> {COMPANY_NAME}
                </p>
                <p>
                    <strong className="text-white">Jurisdiction:</strong> South Africa
                </p>
                <p>
                    <strong className="text-white">Physical address:</strong> Yssel St, Witbank, 1034
                </p>
                <p>
                    <strong className="text-white">General contact:</strong>{" "}
                    <a href="mailto:support@lekkerledger.co.za">support@lekkerledger.co.za</a>
                </p>
                <p>
                    <strong className="text-white">Privacy contact:</strong>{" "}
                    <a href="mailto:privacy@lekkerledger.co.za">privacy@lekkerledger.co.za</a>
                </p>
            </div>
        </section>
    );
}
