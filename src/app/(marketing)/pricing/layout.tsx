import type { Metadata } from "next";
import { pageOG } from "@/lib/seo";

export const metadata: Metadata = {
    title: "Pricing for Domestic Worker Payroll Software | LekkerLedger",
    description:
        "Compare Free, Standard, and Pro for domestic worker payslips, UIF records, leave tracking, contracts, and household payroll admin in South Africa.",
    alternates: {
        canonical: "/pricing",
    },
    ...pageOG(
        "Pricing for Domestic Worker Payroll Software | LekkerLedger",
        "Compare Free, Standard, and Pro for domestic worker payslips, UIF records, leave tracking, contracts, and household payroll admin in South Africa.",
        "/pricing",
    ),
};

export default function PricingLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
