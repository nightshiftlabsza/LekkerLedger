import type { BillingCycle } from "../config/plans";

export type PaidActivationStatus =
    | "pending_payment"
    | "payment_verified_new_user"
    | "payment_verified_existing_login"
    | "payment_verified_existing_continue_setup"
    | "payment_verified_existing_unlock"
    | "already_active"
    | "payment_failed_or_unpaid"
    | "payment_cancelled_or_abandoned";

export interface PaidActivationState {
    status: PaidActivationStatus;
    reference: string;
    email: string;
    planId?: "standard" | "pro";
    billingCycle?: BillingCycle;
}
