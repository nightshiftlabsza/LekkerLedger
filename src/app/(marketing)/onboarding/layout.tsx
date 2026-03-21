import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Get Started | LekkerLedger",
    description:
        "Start with a free payslip, then upgrade to cloud-secured records, contracts, and dashboard access for South African household payroll.",
    alternates: {
        canonical: "/onboarding",
    },
};

export default function OnboardingLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
