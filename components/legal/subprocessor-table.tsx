import * as React from "react";
import { SUBPROCESSORS } from "@/src/config/subprocessors";

export function SubprocessorTable() {
    return (
        <div className="not-prose overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]">
            <div className="hidden grid-cols-[1fr_1.1fr_1.4fr_1fr] border-b border-[var(--border)] bg-[var(--surface-2)] px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] md:grid" style={{ color: "var(--text-muted)" }}>
                <div>Provider</div>
                <div>Purpose</div>
                <div>Data involved</div>
                <div>When used</div>
            </div>
            {SUBPROCESSORS.map((entry) => (
                <div key={entry.name} className="grid gap-3 border-t border-[var(--border)] px-5 py-4 text-sm md:grid-cols-[1fr_1.1fr_1.4fr_1fr] md:gap-4 first:border-t-0">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] md:hidden" style={{ color: "var(--text-muted)" }}>Provider</p>
                        <p className="font-bold text-[var(--text)]">{entry.name}</p>
                    </div>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] md:hidden" style={{ color: "var(--text-muted)" }}>Purpose</p>
                        <p>{entry.purpose}</p>
                    </div>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] md:hidden" style={{ color: "var(--text-muted)" }}>Data involved</p>
                        <p>{entry.dataShared}</p>
                    </div>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] md:hidden" style={{ color: "var(--text-muted)" }}>When used</p>
                        <p>{entry.whenUsed}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
