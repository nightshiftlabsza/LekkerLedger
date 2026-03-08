import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Returns an ISO date string (YYYY-MM-DD) for a given Date object.
 */
export function toIsoDate(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/** @deprecated Use toIsoDate instead */
export const formatDateSafe = toIsoDate;

/**
 * Checks if a Date object is valid.
 */
export function isValidDate(date: Date): boolean {
    return !Number.isNaN(date.getTime());
}
