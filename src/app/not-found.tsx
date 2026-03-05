import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center" style={{ backgroundColor: "var(--bg)" }}>
            <h2 className="text-4xl font-black tracking-tight mb-4" style={{ color: "var(--text)" }}>Page Not Found</h2>
            <p className="text-base mb-8 max-w-md" style={{ color: "var(--text-muted)" }}>
                The page you are looking for doesn&apos;t exist or has been moved.
            </p>
            <Link href="/dashboard">
                <Button className="h-11 px-6 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)] text-white font-bold shadow-md">
                    Return to Dashboard
                </Button>
            </Link>
        </div>
    );
}
