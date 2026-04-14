import type { Metadata } from "next";
import { pageOG } from "@/lib/seo";
import { UifCalculatorLanding } from "./uif-calculator-landing";

export const metadata: Metadata = {
    title: "UIF Deduction Calculator for Domestic Workers | LekkerLedger",
    description:
        "Calculate employer and employee UIF contributions for a domestic worker, check the current ceiling, and understand the monthly deduction.",
    alternates: {
        canonical: "/uif-calculator",
    },
    ...pageOG(
        "UIF Deduction Calculator for Domestic Workers | LekkerLedger",
        "Calculate employer and employee UIF contributions for a domestic worker, check the current ceiling, and understand the monthly deduction.",
        "/uif-calculator",
    ),
};

export default function UifCalculatorPage() {
    return <UifCalculatorLanding />;
}
