"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function OpenAppCompatibilityContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    React.useEffect(() => {
        const source = searchParams.get("source");
        const recommendedGoogle = searchParams.get("recommended") === "google";
        const next = searchParams.get("next");
        const safeNext = next && next.startsWith("/") ? next : null;

        const shouldRunPaidLogin = recommendedGoogle || source === "billing" || source === "onboarding";

        if (shouldRunPaidLogin) {
            const params = new URLSearchParams({ paidLogin: "1" });
            if (safeNext) params.set("next", safeNext);
            router.replace(`/dashboard?${params.toString()}`);
            return;
        }

        router.replace(safeNext || "/dashboard");
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 text-center" style={{ backgroundColor: "var(--bg)" }}>
            <p className="text-sm font-semibold text-[var(--text-muted)]">Opening LekkerLedger...</p>
        </div>
    );
}

export default function OpenAppPage() {
    return (
        <Suspense fallback={null}>
            <OpenAppCompatibilityContent />
        </Suspense>
    );
}
