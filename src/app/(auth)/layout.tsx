import type { Metadata, Viewport } from "next";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
    title: "Account Access | LekkerLedger",
    description: "Log in, create your account, or reset your password for LekkerLedger.",
    robots: {
        index: false,
        follow: true,
    },
};

export const viewport: Viewport = {
    themeColor: "#c47a1c",
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    minimumScale: 1,
    maximumScale: 5,
    userScalable: true,
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <AuthShell>{children}</AuthShell>;
}
