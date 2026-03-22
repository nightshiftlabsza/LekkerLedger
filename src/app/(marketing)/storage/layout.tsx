import type { Metadata } from "next";
import { pageOG } from "@/lib/seo";

export const metadata: Metadata = {
    title: "Security & Storage | LekkerLedger",
    description:
        "How LekkerLedger secures your household payroll data with end-to-end encrypted cloud storage for paid accounts.",
    alternates: { canonical: "/storage" },
    ...pageOG(
        "Security & Storage | LekkerLedger",
        "How LekkerLedger secures your household payroll data with end-to-end encrypted cloud storage for paid accounts.",
        "/storage",
    ),
};

export default function StorageLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
