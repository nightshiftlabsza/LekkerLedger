import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Support & Contact | LekkerLedger",
    description:
        "Get help with LekkerLedger household payroll — billing, account access, storage, and general questions.",
    alternates: {
        canonical: "/support",
    },
};

export default function SupportLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
