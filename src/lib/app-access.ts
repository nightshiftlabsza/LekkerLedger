import { type PlanId } from "../config/plans";

export function shouldRedirectFreeUserFromApp(input: {
    pathname: string;
    planId: PlanId;
    settingsReady: boolean;
    paidLoginRequested: boolean;
}): boolean {
    if (!input.settingsReady) return false;
    if (input.pathname === "/dashboard" && input.paidLoginRequested) return false;
    return input.planId === "free";
}
