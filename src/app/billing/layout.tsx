import type { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: "Billing | LekkerLedger",
        template: "%s | LekkerLedger",
    },
    description: "Complete checkout and paid account activation for LekkerLedger.",
    robots: {
        index: false,
        follow: true,
    },
};

export default function BillingLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
