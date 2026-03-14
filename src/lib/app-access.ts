import { PAID_LOGIN_SUCCESS_QUERY } from "./paid-activation";
import { type PlanId } from "../config/plans";

export function isPaidDashboardFlow(input: {
    pathname: string;
    paidLoginParam: string | null;
    activationParam: string | null;
    syncParam: string | null;
}): boolean {
    if (input.pathname !== "/dashboard") return false;
    if (input.paidLoginParam === "1") return true;
    if (input.activationParam === PAID_LOGIN_SUCCESS_QUERY) return true;
    return Boolean(input.syncParam?.trim());
}

export function shouldRedirectFreeUserFromApp(input: {
    pathname: string;
    planId: PlanId;
    settingsReady: boolean;
    paidFlowRequested: boolean;
}): boolean {
    void input;
    // Temporary safety valve: never bounce a signed-in user back to pricing while
    // billing state and recovery/sync boot are still stabilizing after login.
    return false;
}
