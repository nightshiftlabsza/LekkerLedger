export const ORDINARY_WORK_PATTERN_KEYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
] as const;

export type OrdinaryWorkPatternKey = typeof ORDINARY_WORK_PATTERN_KEYS[number];

export type OrdinaryWorkPattern = Record<OrdinaryWorkPatternKey, boolean>;

export const ORDINARY_WORK_PATTERN_LABELS: Record<OrdinaryWorkPatternKey, string> = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
};

export function buildEmptyOrdinaryWorkPattern(): OrdinaryWorkPattern {
    return {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
    };
}

export function normalizeOrdinaryWorkPattern(
    pattern: Partial<Record<OrdinaryWorkPatternKey, unknown>> | null | undefined,
): OrdinaryWorkPattern | undefined {
    if (!pattern || typeof pattern !== "object") {
        return undefined;
    }

    const normalized = buildEmptyOrdinaryWorkPattern();
    let hasSelection = false;

    for (const key of ORDINARY_WORK_PATTERN_KEYS) {
        normalized[key] = pattern[key] === true;
        hasSelection ||= normalized[key];
    }

    return hasSelection ? normalized : undefined;
}

export function hasConfirmedOrdinaryWorkPattern(
    pattern: Partial<Record<OrdinaryWorkPatternKey, unknown>> | null | undefined,
): boolean {
    return Boolean(normalizeOrdinaryWorkPattern(pattern));
}

export function countOrdinaryWorkPatternDays(pattern: OrdinaryWorkPattern | null | undefined): number {
    if (!pattern) return 0;
    return ORDINARY_WORK_PATTERN_KEYS.reduce((count, key) => count + (pattern[key] ? 1 : 0), 0);
}

export function ordinarilyWorksSundaysFromPattern(
    pattern: Partial<Record<OrdinaryWorkPatternKey, unknown>> | null | undefined,
): boolean {
    return normalizeOrdinaryWorkPattern(pattern)?.sunday ?? false;
}

export function formatOrdinaryWorkPattern(pattern: OrdinaryWorkPattern | null | undefined): string {
    if (!pattern) return "Not confirmed";

    const selectedDays = ORDINARY_WORK_PATTERN_KEYS.filter((key) => pattern[key]).map((key) => ORDINARY_WORK_PATTERN_LABELS[key]);
    return selectedDays.length > 0 ? selectedDays.join(", ") : "Not confirmed";
}
