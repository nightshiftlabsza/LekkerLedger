import { Metadata } from "next";
import { AuthGuard } from "@/components/auth/auth-guard";
import { SignUpForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
    title: "Create Account | LekkerLedger",
    description: "Create a LekkerLedger account to secure and sync your household payroll data.",
};

export default function SignUpPage() {
    return (
        <AuthGuard type="signup">
            <SignUpForm />
        </AuthGuard>
    );
}
