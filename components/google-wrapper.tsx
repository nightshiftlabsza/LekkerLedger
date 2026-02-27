"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

export function GoogleWrapper({ children }: { children: React.ReactNode }) {
    // If there is no client ID yet, it just provides an empty string, OAuth functions will fail gracefully
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

    return (
        <GoogleOAuthProvider clientId={clientId}>
            {children}
        </GoogleOAuthProvider>
    );
}
