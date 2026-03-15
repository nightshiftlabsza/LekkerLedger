export const E2E_FREE_PAYSLIP_COOKIE = "ll-e2e-free-payslip-email";

function buildCookieMap(request: Request) {
    const rawCookie = request.headers.get("cookie") ?? "";

    return new Map(
        rawCookie
            .split(";")
            .map((part) => part.trim())
            .filter(Boolean)
            .map((part) => {
                const [name, ...valueParts] = part.split("=");
                return [name, decodeURIComponent(valueParts.join("="))];
            }),
    );
}

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function getE2EFreePayslipEmail(request: Request) {
    if (process.env.E2E_BYPASS_AUTH !== "1") {
        return null;
    }

    const email = buildCookieMap(request).get(E2E_FREE_PAYSLIP_COOKIE)?.trim().toLowerCase() ?? "";
    if (!email || !isValidEmail(email)) {
        return null;
    }

    return email;
}
