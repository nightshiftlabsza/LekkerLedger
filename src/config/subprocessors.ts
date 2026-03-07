export interface SubprocessorEntry {
    name: string;
    purpose: string;
    dataShared: string;
    whenUsed: string;
}

export const SUBPROCESSORS: SubprocessorEntry[] = [
    {
        name: "Google",
        purpose: "Optional sign-in, backup, and restore",
        dataShared: "Google account email, Google identifier, permission state, and backup files in your own Drive app-data area",
        whenUsed: "Only if you choose Google-connected backup or sign-in",
    },
    {
        name: "Paystack",
        purpose: "Payment processing and subscription checkout",
        dataShared: "Payment and billing details needed to complete the transaction and confirm paid access",
        whenUsed: "Only for paid upgrades",
    },
    {
        name: "Google Analytics",
        purpose: "Limited website and app usage analytics",
        dataShared: "Basic usage and event data such as page views and interaction events",
        whenUsed: "When analytics is enabled on the site or app",
    },
];
