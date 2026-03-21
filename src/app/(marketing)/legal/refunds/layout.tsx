import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Refund & Cancellation Policy | LekkerLedger",
    description:
        "LekkerLedger refund terms for paid household payroll plans, including cancellation windows and billing cycles.",
    alternates: {
        canonical: "/legal/refunds",
    },
};

export default function RefundsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
