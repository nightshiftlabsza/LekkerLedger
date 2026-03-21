import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy | LekkerLedger",
    description:
        "How LekkerLedger collects, stores, and protects personal data for South African household employment records.",
    alternates: {
        canonical: "/legal/privacy",
    },
};

export default function PrivacyLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
