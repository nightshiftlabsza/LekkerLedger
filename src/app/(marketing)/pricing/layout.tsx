import type { Metadata } from "next";
import { pageOG } from "@/lib/seo";

export const metadata: Metadata = {
    title: "Pricing | LekkerLedger",
    description:
        "Compare LekkerLedger plans for South African household payroll, payslips, records, sync, and annual paperwork.",
    alternates: {
        canonical: "/pricing",
    },
    ...pageOG(
        "Pricing | LekkerLedger",
        "Compare LekkerLedger plans for South African household payroll, payslips, records, sync, and annual paperwork.",
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
