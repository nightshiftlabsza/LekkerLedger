/**
 * analytics.ts — tiny GA4 event helper
 *
 * - Never throws; all errors are silently swallowed.
 * - Works even if window.gtag hasn't loaded yet: queues onto dataLayer.
 * - NEVER send PII (names, wages, dates, employer info, etc.).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function track(eventName: string, params: Record<string, any> = {}): void {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any;
        w.dataLayer = w.dataLayer || [];

        if (typeof w.gtag === "function") {
            // gtag is already initialised — fire immediately
            w.gtag("event", eventName, params);
        } else {
            // gtag not ready yet — push as a plain object so GA picks it up once it loads
            w.dataLayer.push({ event: eventName, ...params });
        }
    } catch {
        // Fail silently — never break the app if GA is blocked
    }
}
