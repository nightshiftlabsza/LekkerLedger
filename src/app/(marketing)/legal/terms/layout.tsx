import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service | LekkerLedger",
    description:
        "Terms governing use of LekkerLedger household payroll software, including subscriptions, data handling, and liability.",
    alternates: {
        canonical: "/legal/terms",
    },
};

export default function TermsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
