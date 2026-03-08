"use client";

import { env } from "@/lib/env";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { usePathname } from "next/navigation";

export function GoogleWrapper({ children }: { children: React.ReactNode }) {
    const clientId = env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    const pathname = usePathname();
    const needsGoogleProvider = Boolean(clientId) || pathname?.startsWith("/open-app");

    if (!clientId && env.NODE_ENV !== "production") {
        console.warn("LekkerLedger: NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing. Google Drive sync will not work.");
    }

    if (!needsGoogleProvider) {
        return (
            <>
                {children}
                {!clientId && env.NODE_ENV !== "production" && (
                    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] hidden max-w-xs rounded-xl bg-amber-500 p-3 text-[10px] font-bold text-white shadow-2xl md:block">
                        ⚠️ NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing in .env
                    </div>
                )}
            </>
        );
    }

    return (
        <GoogleOAuthProvider clientId={clientId}>
            {children}
            {!clientId && process.env.NODE_ENV !== "production" && (
                <div className="pointer-events-none fixed bottom-4 right-4 z-[100] hidden max-w-xs rounded-xl bg-amber-500 p-3 text-[10px] font-bold text-white shadow-2xl md:block">
                    ⚠️ NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing in .env
                </div>
            )}
        </GoogleOAuthProvider>
    );
}
