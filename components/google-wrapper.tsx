"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

export function GoogleWrapper({ children }: { children: React.ReactNode }) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

    if (!clientId && process.env.NODE_ENV !== "production") {
        console.warn("LekkerLedger: NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing. Google Drive sync will not work.");
    }

    return (
        <GoogleOAuthProvider clientId={clientId}>
            {children}
            {!clientId && process.env.NODE_ENV !== "production" && (
                <div className="fixed bottom-4 right-4 z-[100] bg-amber-500 text-white p-3 rounded-xl shadow-2xl text-[10px] font-bold max-w-xs animate-bounce">
                    ⚠️ NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing in .env
                </div>
            )}
        </GoogleOAuthProvider>
    );
}
