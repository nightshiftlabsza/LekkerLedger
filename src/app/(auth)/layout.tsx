import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ArrowLeft } from "lucide-react";
import { ToastProvider } from "@/components/ui/toast";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg)] selection:bg-[var(--primary)]/20">
            <header className="absolute top-0 w-full p-6 sm:p-8 lg:p-10 z-10 flex justify-between items-center">
                <Link 
                    href="/dashboard" 
                    className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors font-bold text-sm rounded-xl hover:bg-[var(--surface-raised)] px-4 py-3 -ml-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to app
                </Link>
                <div>
                    <Logo className="scale-90 origin-right" />
                </div>
            </header>
            
            <main className="flex-1 flex flex-col justify-center items-center p-6 sm:p-8 md:p-12 lg:p-16 w-full mt-20">
                <div className="w-full max-w-md mx-auto">
                    <ToastProvider>
                        <Suspense fallback={null}>
                            {children}
                        </Suspense>
                    </ToastProvider>
                </div>
            </main>
        </div>
    );
}
