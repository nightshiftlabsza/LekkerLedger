import * as React from "react";
import { AlertTriangle, RefreshCcw, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface ErrorStateProps {
    title?: string;
    message: string;
    onRetry?: () => void;
    supportEmail?: string;
}

export function ErrorState({
    title = "Something went wrong",
    message,
    onRetry,
    supportEmail = "nightshiftlabsza@gmail.com",
}: ErrorStateProps) {
    return (
        <Card className="border-rose-500/20 glass-panel bg-rose-500/5 overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center p-8 sm:p-12 text-center text-balance">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-rose-500/10 flex items-center justify-center mb-6">
                    <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10 text-rose-500" strokeWidth={1.5} />
                </div>

                <h3 className="text-xl font-bold mb-3 text-rose-900 dark:text-rose-400">
                    {title}
                </h3>

                <p className="max-w-md text-sm sm:text-base leading-relaxed mb-8 text-rose-700 dark:text-rose-300">
                    {message}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    {onRetry && (
                        <Button
                            onClick={onRetry}
                            variant="default"
                            className="w-full sm:w-auto h-12 px-8 text-base font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                        >
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    )}

                    <a
                        href={`mailto:${supportEmail}?subject=LekkerLedger%20Error%20Report`}
                        className="w-full sm:w-auto"
                    >
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto h-12 px-6 text-sm font-bold border-rose-500/30 text-rose-700 hover:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        >
                            <Mail className="h-4 w-4 mr-2" />
                            Contact Support
                        </Button>
                    </a>
                </div>
            </CardContent>
        </Card>
    );
}
