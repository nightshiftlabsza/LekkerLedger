"use client";

import * as React from "react";
import Link from "next/link";
import { XCircle, ArrowLeft, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BillingCancelPage() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
            <div className="mb-6 rounded-full p-4" style={{ backgroundColor: "var(--danger-soft)", color: "var(--danger)" }}>
                <XCircle className="h-12 w-12" />
            </div>

            <h1 className="text-2xl font-black mb-3">Payment Cancelled</h1>
            <p className="text-[var(--text-muted)] max-w-md mb-8 leading-relaxed">
                Your payment was not completed. No charges were made. If you experienced a technical issue, please try again or contact support.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                <Link href="/upgrade" className="w-full">
                    <Button className="w-full h-12 gap-2 bg-[var(--primary)] text-white font-bold rounded-2xl">
                        Try Again <RefreshCcw className="h-4 w-4" />
                    </Button>
                </Link>
                <Link href="/dashboard" className="w-full">
                    <Button variant="outline" className="w-full h-12 gap-2 font-bold rounded-2xl">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>
            </div>

            <p className="mt-8 text-xs text-[var(--text-muted)]">
                Need help? Email us at <a href="mailto:support@lekkerledger.co.za" className="underline font-bold">support@lekkerledger.co.za</a>
            </p>
        </div>
    );
}
