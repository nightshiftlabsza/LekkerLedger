/**
 * Safe monetary calculations utility.
 * Prevents floating-point errors (e.g., 0.1 + 0.2 = 0.30000000000000004).
 */

/**
 * Rounds a number to a specific number of decimal places (default 2).
 */
export function roundTo(num: number, decimals: number = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * Formats a number as a ZAR currency string (R 1,234.56).
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
        minimumFractionDigits: 2,
    }).format(amount);
}

/**
 * Calculates a percentage of an amount safely.
 */
export function calculatePct(amount: number, pct: number): number {
    return roundTo(amount * pct);
}
