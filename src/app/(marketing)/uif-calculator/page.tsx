import type { Metadata } from "next";
import { pageOG } from "@/lib/seo";
import { UifCalculatorLanding } from "./uif-calculator-landing";

export const metadata: Metadata = {
    title: "UIF Calculator for Domestic Workers in South Africa | LekkerLedger",
    description:
        "Calculate employee and employer UIF contributions for your domestic worker. Understand how 1% + 1% deductions work and what to declare on uFiling.",
    alternates: {
        canonical: "/uif-calculator",
    },
    ...pageOG(
        "UIF Calculator for Domestic Workers in South Africa | LekkerLedger",
        "Calculate employee and employer UIF contributions for your domestic worker. Understand how 1% + 1% deductions work and what to declare on uFiling.",
        "/uif-calculator",
    ),
};

export default function UifCalculatorPage() {
    return <UifCalculatorLanding />;
}
