import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ArrowLeft } from "lucide-react";
import { ToastProvider } from "@/components/ui/toast";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg)] selection:bg-[var(--primary)]/20">
            <header className="absolute top-0 w-full p-4 sm:p-6 lg:p-8 z-10 flex justify-between items-center">
                <Link 
                    href="/dashboard" 
                    className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors font-semibold text-sm rounded-lg hover:bg-[var(--surface-2)] px-3 py-2 -ml-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to app
                </Link>
                <div className="hidden sm:block">
                    <Logo />
                </div>
            </header>
            
            <main className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 lg:p-12 w-full mt-16 sm:mt-0">
                <div className="w-full max-w-md mx-auto">
                    <div className="sm:hidden flex justify-center mb-8">
                        <Logo />
                    </div>
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
