import type { Metadata } from "next";
import { pageOG } from "@/lib/seo";

export const metadata: Metadata = {
    title: "Domestic Worker Pay Calculator (Hours, Wage & UIF) | LekkerLedger",
    description:
        "Estimate domestic worker pay from hours worked, hourly rate, minimum wage, and UIF deduction.",
    alternates: {
        canonical: "/calculator",
    },
    ...pageOG(
        "Domestic Worker Pay Calculator (Hours, Wage & UIF) | LekkerLedger",
        "Estimate domestic worker pay from hours worked, hourly rate, minimum wage, and UIF deduction.",
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
