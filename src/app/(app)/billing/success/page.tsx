"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerCelebration } from "@/components/ui/confetti-trigger";

export default function BillingSuccessPage() {
    React.useEffect(() => {
        triggerCelebration();
    }, []);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
            <div className="relative mb-6">
                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
                <div className="relative bg-emerald-500 rounded-full p-4 text-white shadow-xl shadow-emerald-500/20">
                    <CheckCircle2 className="h-12 w-12" />
                </div>
            </div>

            <h1 className="text-3xl font-black mb-3">Payment Successful!</h1>
            <p className="text-[var(--text-muted)] max-w-md mb-8 leading-relaxed">
                Your paid features are active. Next, connect Google so your records can be restored across the Android app, the website, or another browser while staying private from LekkerLedger.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                <Link href="/open-app?source=billing&recommended=google&next=/dashboard" className="w-full">
                    <Button className="w-full h-12 gap-2 bg-[var(--primary)] text-white font-bold rounded-2xl">
                        Connect Google Access <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
                <Link href="/dashboard" className="w-full">
                    <Button variant="outline" className="w-full h-12 font-bold rounded-2xl">
                        Open Dashboard
                    </Button>
                </Link>
            </div>

            <div className="mt-12 flex items-center gap-2 text-[var(--text-muted)] text-sm font-medium">
                <PartyPopper className="h-4 w-4 text-[var(--focus)]" />
                <span>Happy payroll processing!</span>
            </div>
        </div>
    );
}
