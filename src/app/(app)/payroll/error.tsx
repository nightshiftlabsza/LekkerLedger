"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 pt-10">
            <EmptyState
                icon={AlertCircle}
                title="Something went wrong"
                description={error.message || "An unexpected error occurred while loading this page. Please try again."}
            />
            <div className="flex justify-center mt-4">
                <Button onClick={() => reset()} variant="outline" className="gap-2 font-bold">
                    <RotateCcw className="h-4 w-4" /> Try again
                </Button>
            </div>
        </div>
    );
}
