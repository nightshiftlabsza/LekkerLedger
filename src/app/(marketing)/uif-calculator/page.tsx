import type { Metadata } from "next";
import { UifCalculatorLanding } from "./uif-calculator-landing";

export const metadata: Metadata = {
    title: "Domestic worker UIF calculator (South Africa)",
    description:
        "Estimate UIF contributions for domestic workers in South Africa and learn how employee and employer UIF deductions work.",
    alternates: {
        canonical: "/uif-calculator",
    },
};

export default function UifCalculatorPage() {
    return <UifCalculatorLanding />;
}
