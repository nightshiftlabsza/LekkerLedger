import { Metadata } from "next";
import { AuthGuard } from "@/components/auth/auth-guard";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
    title: "Log in | LekkerLedger",
    description: "Access your LekkerLedger account to sync your household payroll records.",
};

export default function LoginPage() {
    return (
        <AuthGuard type="login">
            <LoginForm />
        </AuthGuard>
    );
}
