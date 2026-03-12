import { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
    title: "Set new password | LekkerLedger",
    description: "Set a new password for your LekkerLedger account.",
};

export default function ResetPasswordPage() {
    return <ResetPasswordForm />;
}
