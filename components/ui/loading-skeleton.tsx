"use client";

import * as React from "react";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse rounded-lg bg-[var(--border)] ${className}`}
            aria-hidden="true"
        />
    );
}

/** Card-shaped skeleton */
export function CardSkeleton({ className = "" }: SkeletonProps) {
    return (
        <div className={`glass-panel rounded-2xl p-5 space-y-4 ${className}`}>
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 flex-1 rounded-lg" />
                <Skeleton className="h-8 flex-1 rounded-lg" />
            </div>
        </div>
    );
}

/** Table row skeleton */
export function RowSkeleton({ columns = 4, className = "" }: SkeletonProps & { columns?: number }) {
    return (
        <div className={`flex items-center gap-4 py-3 px-4 border-b border-[var(--border)] ${className}`}>
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} className={`h-4 ${i === 0 ? "w-1/3" : "flex-1"}`} />
            ))}
        </div>
    );
}

/** Stat block skeleton */
export function StatSkeleton({ className = "" }: SkeletonProps) {
    return (
        <div className={`glass-panel rounded-2xl p-5 flex flex-col items-center gap-2 ${className}`}>
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
        </div>
    );
}
