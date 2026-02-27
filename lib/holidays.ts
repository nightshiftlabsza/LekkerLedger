/**
 * South African Public Holidays Utility
 * Used to automatically detect holiday hours in the payslip wizard.
 */

export interface PublicHoliday {
    date: string; // ISO format YYYY-MM-DD
    name: string;
}

const HOLIDAYS: PublicHoliday[] = [
    // 2024
    { date: "2024-01-01", name: "New Year's Day" },
    { date: "2024-03-21", name: "Human Rights Day" },
    { date: "2024-03-29", name: "Good Friday" },
    { date: "2024-04-01", name: "Family Day" },
    { date: "2024-04-27", name: "Freedom Day" },
    { date: "2024-05-01", name: "Workers' Day" },
    { date: "2024-05-29", name: "National and Provincial Elections" },
    { date: "2024-06-16", name: "Youth Day" },
    { date: "2024-06-17", name: "Youth Day Observed" },
    { date: "2024-08-09", name: "National Women's Day" },
    { date: "2024-09-24", name: "Heritage Day" },
    { date: "2024-12-16", name: "Day of Reconciliation" },
    { date: "2024-12-25", name: "Christmas Day" },
    { date: "2024-12-26", name: "Day of Goodwill" },

    // 2025
    { date: "2025-01-01", name: "New Year's Day" },
    { date: "2025-03-21", name: "Human Rights Day" },
    { date: "2025-04-18", name: "Good Friday" },
    { date: "2025-04-21", name: "Family Day" },
    { date: "2025-04-27", name: "Freedom Day" },
    { date: "2025-04-28", name: "Freedom Day Observed" },
    { date: "2025-05-01", name: "Workers' Day" },
    { date: "2025-06-16", name: "Youth Day" },
    { date: "2025-08-09", name: "National Women's Day" },
    { date: "2025-08-11", name: "National Women's Day Observed" },
    { date: "2025-09-24", name: "Heritage Day" },
    { date: "2025-12-16", name: "Day of Reconciliation" },
    { date: "2025-12-25", name: "Christmas Day" },
    { date: "2025-12-26", name: "Day of Goodwill" },

    // 2026
    { date: "2026-01-01", name: "New Year's Day" },
    { date: "2026-03-21", name: "Human Rights Day" },
    { date: "2026-04-03", name: "Good Friday" },
    { date: "2026-04-06", name: "Family Day" },
    { date: "2026-04-27", name: "Freedom Day" },
    { date: "2026-05-01", name: "Workers' Day" },
    { date: "2026-06-16", name: "Youth Day" },
    { date: "2026-08-09", name: "National Women's Day" },
    { date: "2026-08-10", name: "National Women's Day Observed" },
    { date: "2026-09-24", name: "Heritage Day" },
    { date: "2026-12-16", name: "Day of Reconciliation" },
    { date: "2026-12-25", name: "Christmas Day" },
    { date: "2026-12-26", name: "Day of Goodwill" },

    // 2027
    { date: "2027-01-01", name: "New Year's Day" },
    { date: "2027-03-21", name: "Human Rights Day" },
    { date: "2027-03-22", name: "Human Rights Day Observed" },
    { date: "2027-03-26", name: "Good Friday" },
    { date: "2027-03-29", name: "Family Day" },
    { date: "2027-04-27", name: "Freedom Day" },
    { date: "2027-05-01", name: "Workers' Day" },
    { date: "2027-06-16", name: "Youth Day" },
    { date: "2027-08-09", name: "National Women's Day" },
    { date: "2027-09-24", name: "Heritage Day" },
    { date: "2027-12-16", name: "Day of Reconciliation" },
    { date: "2027-12-25", name: "Christmas Day" },
    { date: "2027-12-26", name: "Day of Goodwill" },
    { date: "2027-12-27", name: "Day of Goodwill Observed" },

    // 2028 (Leap Year)
    { date: "2028-01-01", name: "New Year's Day" },
    { date: "2028-03-21", name: "Human Rights Day" },
    { date: "2028-04-14", name: "Good Friday" },
    { date: "2028-04-17", name: "Family Day" },
    { date: "2028-04-27", name: "Freedom Day" },
    { date: "2028-05-01", name: "Workers' Day" },
    { date: "2028-06-16", name: "Youth Day" },
    { date: "2028-08-09", name: "National Women's Day" },
    { date: "2028-09-24", name: "Heritage Day" },
    { date: "2028-09-25", name: "Heritage Day Observed" },
    { date: "2028-12-16", name: "Day of Reconciliation" },
    { date: "2028-12-25", name: "Christmas Day" },
    { date: "2028-12-26", name: "Day of Goodwill" },

    // 2029
    { date: "2029-01-01", name: "New Year's Day" },
    { date: "2029-03-21", name: "Human Rights Day" },
    { date: "2029-03-30", name: "Good Friday" },
    { date: "2029-04-02", name: "Family Day" },
    { date: "2029-04-27", name: "Freedom Day" },
    { date: "2029-05-01", name: "Workers' Day" },
    { date: "2029-06-16", name: "Youth Day" },
    { date: "2029-08-09", name: "National Women's Day" },
    { date: "2029-09-24", name: "Heritage Day" },
    { date: "2029-12-16", name: "Day of Reconciliation" },
    { date: "2029-12-17", name: "Day of Reconciliation Observed" },
    { date: "2029-12-25", name: "Christmas Day" },
    { date: "2029-12-26", name: "Day of Goodwill" },

    // 2030
    { date: "2030-01-01", name: "New Year's Day" },
    { date: "2030-03-21", name: "Human Rights Day" },
    { date: "2030-04-19", name: "Good Friday" },
    { date: "2030-04-22", name: "Family Day" },
    { date: "2030-04-27", name: "Freedom Day" },
    { date: "2030-05-01", name: "Workers' Day" },
    { date: "2030-06-16", name: "Youth Day" },
    { date: "2030-06-17", name: "Youth Day Observed" },
    { date: "2030-08-09", name: "National Women's Day" },
    { date: "2030-09-24", name: "Heritage Day" },
    { date: "2030-12-16", name: "Day of Reconciliation" },
    { date: "2030-12-25", name: "Christmas Day" },
    { date: "2030-12-26", name: "Day of Goodwill" },

    // 2031
    { date: "2031-01-01", name: "New Year's Day" },
    { date: "2031-03-21", name: "Human Rights Day" },
    { date: "2031-04-11", name: "Good Friday" },
    { date: "2031-04-14", name: "Family Day" },
    { date: "2031-04-27", name: "Freedom Day" },
    { date: "2031-04-28", name: "Freedom Day Observed" },
    { date: "2031-05-01", name: "Workers' Day" },
    { date: "2031-06-16", name: "Youth Day" },
    { date: "2031-08-09", name: "National Women's Day" },
    { date: "2031-09-24", name: "Heritage Day" },
    { date: "2031-12-16", name: "Day of Reconciliation" },
    { date: "2031-12-25", name: "Christmas Day" },
    { date: "2031-12-26", name: "Day of Goodwill" },

    // 2032 (Leap Year)
    { date: "2032-01-01", name: "New Year's Day" },
    { date: "2032-03-21", name: "Human Rights Day" },
    { date: "2032-03-22", name: "Human Rights Day Observed" },
    { date: "2032-03-26", name: "Good Friday" },
    { date: "2032-03-29", name: "Family Day" },
    { date: "2032-04-27", name: "Freedom Day" },
    { date: "2032-05-01", name: "Workers' Day" },
    { date: "2032-06-16", name: "Youth Day" },
    { date: "2032-08-09", name: "National Women's Day" },
    { date: "2032-09-24", name: "Heritage Day" },
    { date: "2032-12-16", name: "Day of Reconciliation" },
    { date: "2032-12-25", name: "Christmas Day" },
    { date: "2032-12-26", name: "Day of Goodwill" },
    { date: "2032-12-27", name: "Day of Goodwill Observed" },
];

/**
 * Returns list of holidays that fall between start and end dates (inclusive).
 */
export function getHolidaysInRange(start: string | Date, end: string | Date): PublicHoliday[] {
    const s = new Date(start).toISOString().split("T")[0];
    const e = new Date(end).toISOString().split("T")[0];

    return HOLIDAYS.filter(h => h.date >= s && h.date <= e);
}
