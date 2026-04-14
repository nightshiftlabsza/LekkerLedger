import type { Metadata } from "next";

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: true,
    },
};

export default function HelpLayout({ children }: { readonly children: React.ReactNode }) {
    return children;
}
