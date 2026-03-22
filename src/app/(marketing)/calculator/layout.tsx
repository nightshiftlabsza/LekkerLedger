import type { Metadata } from "next";
import { pageOG } from "@/lib/seo";

export const metadata: Metadata = {
    title: "Wage & UIF Calculator | LekkerLedger",
    description:
        "Estimate domestic worker wages and UIF deductions for South African household payroll before creating a full payslip.",
    alternates: {
        canonical: "/calculator",
    },
    ...pageOG(
        "Wage & UIF Calculator | LekkerLedger",
        "Estimate domestic worker wages and UIF deductions for South African household payroll before creating a full payslip.",
        "/calculator",
    ),
};

export default function CalculatorLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
