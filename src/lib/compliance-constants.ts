/**
 * Single Source of Truth for Compliance Constants
 * Reference: Civic Ledger Guidelines & Government Gazettes
 */

export const COMPLIANCE = {
    NMW: {
        RATE_PER_HOUR: 30.23,
        EFFECTIVE_DATE: "1 March 2026",
        SOURCE_URL: "https://www.gov.za/sites/default/files/gcis_document/202602/54075rg11941gon7083.pdf",
        HISTORICAL: [
            { effectiveDate: "2022-03-01", rate: 23.19 },
            { effectiveDate: "2023-03-01", rate: 25.42 },
            { effectiveDate: "2024-03-01", rate: 27.58 },
            { effectiveDate: "2025-03-01", rate: 28.79 },
            { effectiveDate: "2026-03-01", rate: 30.23 },
        ],
    },
    UIF: {
        THRESHOLD_HOURS_PER_MONTH: 24,
        DEDUCTION_PERCENTAGE: 0.01,
        MONTHLY_CAP: 17712,
        SOURCE_URL: "https://www.gov.za/faq/government-services/how-do-i-register-my-domestic-worker-uif",
    },
    RECORD_KEEPING: {
        MINIMUM_YEARS: 3,
        SOURCE_URL: "https://www.labour.gov.za/DocumentCenter/Acts/Basic%20Conditions%20of%20Employment/Act%20-%20Basic%20Conditions%20of%20Employment.pdf",
    },
    OVERTIME: {
        MAX_HOURS_PER_WEEK: 10,
        RATE_MULTIPLIER: 1.5,
        SOURCE_URL: "https://www.labour.gov.za/DocumentCenter/Acts/Basic%20Conditions%20of%20Employment/Act%20-%20Basic%20Conditions%20of%20Employment.pdf",
    },
    SUNDAY_PAY: {
        NORMAL_MULTIPLIER: 2.0,
        ORDINARILY_WORKS_MULTIPLIER: 1.5,
        SOURCE_URL: "https://www.labour.gov.za/DocumentCenter/Acts/Basic%20Conditions%20of%20Employment/Act%20-%20Basic%20Conditions%20of%20Employment.pdf",
    },
    PUBLIC_HOLIDAY_PAY: {
        MULTIPLIER_IF_WORKED: 2.0,
        SOURCE_URL: "https://www.labour.gov.za/DocumentCenter/Acts/Basic%20Conditions%20of%20Employment/Act%20-%20Basic%20Conditions%20of%20Employment.pdf",
    },
    MINIMUM_DAILY_PAY: {
        MINIMUM_HOURS_PAID: 4,
        SOURCE_URL: "https://www.labour.gov.za/DocumentCenter/Publications/Basic%20Conditions%20of%20Employment/National%20Minimum%20Wage%20flyer%202026.pdf",
    },
    SD7: {
        ACCOMMODATION_MAX_PCT: 0.10, // Max deduction for accommodation
    },
    LEAVE: {
        DAYS_WORKED_PER_LEAVE_DAY: 17, // BCEA: 1 day for every 17 days worked
        RATE: 1 / 17,
        SOURCE_URL: "https://www.labour.gov.za/DocumentCenter/Acts/Basic%20Conditions%20of%20Employment/Act%20-%20Basic%20Conditions%20of%20Employment.pdf",
    },
    COIDA: {
        DOMESTIC_CLASS: "M",
        DOMESTIC_SUBCLASS: "2500",
        ASSESSMENT_RATE: 1.04,
        MINIMUM_ASSESSMENT_DOMESTIC: 560,
        EARNINGS_CAP_2025: 633168,
        SOURCE_URL: "https://www.gov.za/sites/default/files/gcis_document/202506/52453gen3115.pdf",
    }
};
