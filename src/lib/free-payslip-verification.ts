export const FREE_PAYSLIP_TOOL_PATH = "/resources/tools/domestic-worker-payslip";
export const FREE_PAYSLIP_VERIFICATION_QUERY = "freePayslipVerification";

export type FreePayslipVerificationState =
    | "success"
    | "invalid-link"
    | "missing-session";

const VALID_STATES = new Set<FreePayslipVerificationState>([
    "success",
    "invalid-link",
    "missing-session",
]);

export function buildFreePayslipVerificationHref(state: FreePayslipVerificationState) {
    const params = new URLSearchParams({
        [FREE_PAYSLIP_VERIFICATION_QUERY]: state,
    });

    return `${FREE_PAYSLIP_TOOL_PATH}?${params.toString()}`;
}

export function isFreePayslipVerificationPath(next: string | null | undefined) {
    if (!next?.startsWith("/")) return false;

    try {
        const url = new URL(next, "https://lekkerledger.local");
        return url.pathname === FREE_PAYSLIP_TOOL_PATH;
    } catch {
        return false;
    }
}

export function parseFreePayslipVerificationState(
    value: URLSearchParams | string | null | undefined,
): FreePayslipVerificationState | null {
    const candidate = value instanceof URLSearchParams
        ? value.get(FREE_PAYSLIP_VERIFICATION_QUERY)
        : value;

    if (!candidate || !VALID_STATES.has(candidate as FreePayslipVerificationState)) {
        return null;
    }

    return candidate as FreePayslipVerificationState;
}
