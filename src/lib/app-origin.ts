const DEFAULT_LOCAL_ORIGIN = "http://localhost:3000";
const UNSAFE_HOST_REWRITES: Record<string, string> = {
    "0.0.0.0": "localhost",
    "[::]": "localhost",
};

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

export function getConfiguredAppOrigin(): string | null {
    return (
        normalizeAppOrigin(process.env.NEXT_PUBLIC_APP_URL) ||
        normalizeAppOrigin(process.env.NEXT_PUBLIC_SITE_URL)
    );
}

export function getBrowserAppOrigin(): string {
    const configuredOrigin = getConfiguredAppOrigin();
    if (configuredOrigin) return configuredOrigin;

    if (typeof globalThis.window === "undefined") {
        return DEFAULT_LOCAL_ORIGIN;
    }

    return normalizeAppOrigin(globalThis.window.location.origin) || DEFAULT_LOCAL_ORIGIN;
}

export function getRequestAppOrigin(request: Request): string {
    const configuredOrigin = getConfiguredAppOrigin();
    if (configuredOrigin) return configuredOrigin;

    const requestUrl = new URL(request.url);
    const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const forwardedProto = request.headers.get("x-forwarded-proto") || requestUrl.protocol.replace(":", "");

    if (forwardedHost) {
        const requestOrigin = normalizeAppOrigin(`${forwardedProto || "https"}://${forwardedHost}`);
        if (requestOrigin) return requestOrigin;
    }

    return normalizeAppOrigin(requestUrl.origin) || DEFAULT_LOCAL_ORIGIN;
}
