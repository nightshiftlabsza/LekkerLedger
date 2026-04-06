const DEFAULT_LOCAL_ORIGIN = "http://localhost:3002";
const UNSAFE_HOST_REWRITES: Record<string, string> = {
    "0.0.0.0": "localhost",
    "[::]": "localhost",
};
const CANONICAL_HOST_REWRITES: Record<string, string> = {
    "www.lekkerledger.co.za": "lekkerledger.co.za",
};
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

function ensureOrigin(candidate: string): string {
    if (/^https?:\/\//i.test(candidate)) return candidate;
    return candidate.startsWith("localhost") || candidate.startsWith("127.") || candidate.startsWith("0.0.0.0")
        ? `http://${candidate}`
        : `https://${candidate}`;
}

export function normalizeAppOrigin(candidate: string | null | undefined): string | null {
    const rawValue = candidate?.trim();
    if (!rawValue) return null;

    try {
        const url = new URL(ensureOrigin(rawValue));
        if (url.protocol !== "http:" && url.protocol !== "https:") return null;

        const safeHost = UNSAFE_HOST_REWRITES[url.hostname];
        if (safeHost) {
            url.hostname = safeHost;
        }

        url.pathname = "";
        url.search = "";
        url.hash = "";

        return url.origin;
    } catch {
        return null;
    }
}

export function getCanonicalAppOrigin(candidate: string | null | undefined): string | null {
    const origin = normalizeAppOrigin(candidate);
    if (!origin) return null;

    try {
        const url = new URL(origin);
        const canonicalHost = CANONICAL_HOST_REWRITES[url.hostname];
        if (canonicalHost) {
            url.hostname = canonicalHost;
        }
        return url.origin;
    } catch {
        return origin;
    }
}

export function getConfiguredAppOrigin(): string | null {
    return (
        getCanonicalAppOrigin(process.env.NEXT_PUBLIC_APP_URL) ||
        getCanonicalAppOrigin(process.env.NEXT_PUBLIC_SITE_URL)
    );
}

export function isLocalAppOrigin(origin: string | null | undefined): boolean {
    if (!origin) return false;

    try {
        const { hostname } = new URL(origin);
        return LOCAL_HOSTNAMES.has(hostname);
    } catch {
        return false;
    }
}

export function getBrowserAppOrigin(): string {
    const browserOrigin = typeof globalThis.window === "undefined"
        ? null
        : getCanonicalAppOrigin(globalThis.window.location.origin);

    if (browserOrigin) return browserOrigin;

    const configuredOrigin = getConfiguredAppOrigin();
    if (configuredOrigin) return configuredOrigin;

    return DEFAULT_LOCAL_ORIGIN;
}

function hasForwardedHost(request: Request): boolean {
    return !!(request.headers.get("x-forwarded-host") || request.headers.get("host"));
}

export function getRequestAppOrigin(request: Request): string {
    const requestOrigin = getCanonicalAppOrigin(getRequestCurrentOrigin(request)) || getRequestCurrentOrigin(request);
    if (!isLocalAppOrigin(requestOrigin)) return requestOrigin;

    const configuredOrigin = getConfiguredAppOrigin();
    if (!hasForwardedHost(request) && configuredOrigin && !isLocalAppOrigin(configuredOrigin)) return configuredOrigin;

    return requestOrigin;
}

export function getRequestCurrentOrigin(request: Request): string {
    const requestUrl = new URL(request.url);
    const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const forwardedProto = request.headers.get("x-forwarded-proto") || requestUrl.protocol.replace(":", "");

    if (forwardedHost) {
        const requestOrigin = normalizeAppOrigin(`${forwardedProto || "https"}://${forwardedHost}`);
        if (requestOrigin) return requestOrigin;
    }

    return normalizeAppOrigin(requestUrl.origin) || DEFAULT_LOCAL_ORIGIN;
}
