export interface SubprocessorEntry {
    name: string;
    purpose: string;
    dataShared: string;
    whenUsed: string;
}

export const SUBPROCESSORS: SubprocessorEntry[] = [
    {
        name: "Supabase",
        purpose: "Authentication and encrypted sync",
        dataShared: "Email address, encrypted backup data",
        whenUsed: "Only if you create an account for encrypted sync",
    },
    {
        name: "Paystack",
        purpose: "Payment processing and subscription checkout",
        dataShared: "Payment and billing details needed to complete the transaction and confirm paid access",
        whenUsed: "Only for paid upgrades",
    },
];
