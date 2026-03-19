import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pricing | LekkerLedger",
    description:
        "Compare LekkerLedger plans for South African household payroll, payslips, records, sync, and annual paperwork.",
    alternates: {
        canonical: "/pricing",
    },
};

export default function PricingLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
