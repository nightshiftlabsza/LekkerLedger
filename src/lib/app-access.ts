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
    if (!input.settingsReady) return false;
    if (input.pathname === "/dashboard" && input.paidFlowRequested) return false;
    return input.planId === "free";
}
