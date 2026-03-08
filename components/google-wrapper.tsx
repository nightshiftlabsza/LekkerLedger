"use client";

import { env } from "@/lib/env";
import { GoogleOAuthProvider } from "@react-oauth/google";

export function GoogleWrapper({ children }: { children: React.ReactNode }) {
    const clientId = env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

    if (!clientId) {
        if (env.NODE_ENV !== "production") {
            console.warn("LekkerLedger: NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing. Google sign-in is disabled in this build.");
        }
        return <>{children}</>;
    }

    return (
        <GoogleOAuthProvider clientId={clientId}>
            {children}
        </GoogleOAuthProvider>
    );
}
