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
    subscriptionStatus?: string;
    unlockStatus?: string;
    hasPendingReference?: boolean;
}): boolean {
    if (!input.settingsReady) return false;
    if (input.paidFlowRequested) return false;
    if (input.hasPendingReference) return false;
    if (input.subscriptionStatus !== undefined && input.subscriptionStatus !== "resolved") return false;
    if (input.unlockStatus === "pending" || input.unlockStatus === "required") return false;
    if (!input.pathname.startsWith("/")) return false;

    return input.planId === "free";
}
