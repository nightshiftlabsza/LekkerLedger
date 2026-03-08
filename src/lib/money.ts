/**
 * Safe monetary calculations utility.
 * Prevents floating-point errors (e.g., 0.1 + 0.2 = 0.30000000000000004)
 * by using integer-based arithmetic (cents) where possible.
 */

/**
 * Rounds a number to a specific number of decimal places using "Banker's Rounding"
 * (round half to even) for financial accuracy.
 */
export function roundTo(num: number, decimals: number = 2): number {
    const factor = Math.pow(10, decimals);
    const n = +(num * factor).toFixed(8); // Precision guard
    const i = Math.floor(n);
    const f = n - i;
    const e = 1e-8; // epsilon

    if (f > 0.5 - e && f < 0.5 + e) {
        return ((i % 2 === 0) ? i : i + 1) / factor;
    }
    return Math.round(n) / factor;
}

/**
 * Formats a number as a ZAR currency string (R 1,234.56).
 * Uses a consistent locale to avoid system-dependent formatting drift.
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(roundTo(amount));
}

/**
 * Calculates a percentage of an amount safely using integer-based intermediate steps.
 */
export function calculatePct(amount: number, pct: number): number {
    // Convert to cents to maintain precision during multiplication
    const amountInCents = Math.round(amount * 100);
    // Use the percentage (e.g. 0.01 for 1%)
    const resultInCents = (amountInCents * pct);
    return roundTo(resultInCents / 100);
}

/**
 * Converts a currency string or number to cents (integer).
 */
export function toCents(amount: number): number {
    return Math.round(roundTo(amount) * 100);
}

/**
 * Converts cents back to a decimal currency value.
 */
export function fromCents(cents: number): number {
    return roundTo(cents / 100);
}
