export const PAID_LOGIN_SUCCESS_QUERY = "paid-login-success";

function normalizeReference(reference?: string | null): string {
    return reference?.trim() || "";
}

export function buildPaidLoginHref(reference?: string | null): string {
    const resolvedReference = normalizeReference(reference);
    if (!resolvedReference) return "/login";

    const params = new URLSearchParams({ reference: resolvedReference });
    return `/login?${params.toString()}`;
}

export function buildPaidDashboardHref(input?: {
    reference?: string | null;
    activation?: string | null;
    sync?: string | null;
}): string {
    const params = new URLSearchParams();
    const resolvedReference = normalizeReference(input?.reference);

    if (resolvedReference) {
        params.set("paidLogin", "1");
        params.set("reference", resolvedReference);
    }

    if (input?.activation?.trim()) {
        params.set("activation", input.activation.trim());
    }

    if (input?.sync?.trim()) {
        params.set("sync", input.sync.trim());
    }

    const query = params.toString();
    return query ? `/dashboard?${query}` : "/dashboard";
}
