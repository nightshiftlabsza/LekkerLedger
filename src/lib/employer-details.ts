import type { EmployerSettings } from "./schema";

export const EMPLOYER_DETAILS_REQUIRED_ERROR = "Add your employer name and address in Settings before generating payslips.";

export function hasRequiredEmployerDetails(settings: EmployerSettings | null | undefined): boolean {
    return Boolean(settings?.employerName?.trim() && settings?.employerAddress?.trim());
}

export function getEmployerDetailsSettingsHref(nextPath?: string): string {
    const params = new URLSearchParams({ tab: "general" });

    if (nextPath?.trim()) {
        params.set("next", nextPath);
    }

    return `/settings?${params.toString()}`;
}
