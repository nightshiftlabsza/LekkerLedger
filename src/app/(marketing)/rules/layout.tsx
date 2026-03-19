import type { Metadata } from "next";

export const metadata: Metadata = {
    robots: { index: false, follow: true },
};

export default function RulesLayout({ children }: { readonly children: React.ReactNode }) {
    return <>{children}</>;
}
