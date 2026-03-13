function digitsOnly(value: string): string {
    return value.replaceAll(/\D/g, "");
}

function isDigitsLike(value: string): boolean {
    return /^[\d\s-]+$/.test(value);
}

function isValidDateYYMMDD(value: string): boolean {
    const yy = Number(value.slice(0, 2));
    const mm = Number(value.slice(2, 4));
    const dd = Number(value.slice(4, 6));

    if (!Number.isInteger(yy) || !Number.isInteger(mm) || !Number.isInteger(dd)) return false;
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;

    const fullYear = yy <= new Date().getFullYear() % 100 ? 2000 + yy : 1900 + yy;
    const candidate = new Date(fullYear, mm - 1, dd);

    return candidate.getFullYear() === fullYear
        && candidate.getMonth() === mm - 1
        && candidate.getDate() === dd;
}

export function isValidSouthAfricanIdNumber(value: string): boolean {
    const normalized = digitsOnly(value);
    if (normalized.length !== 13) return false;
    if (!isValidDateYYMMDD(normalized)) return false;

    const checkDigit = Number(normalized[12]);
    let oddSum = 0;
    for (let index = 0; index < 12; index += 2) {
        oddSum += Number(normalized[index]);
    }

    let evenDigits = "";
    for (let index = 1; index < 12; index += 2) {
        evenDigits += normalized[index];
    }

    const doubled = String(Number(evenDigits) * 2);
    const evenSum = doubled.split("").reduce((sum, digit) => sum + Number(digit), 0);
    const total = oddSum + evenSum;
    const calculatedCheckDigit = (10 - (total % 10)) % 10;

    return calculatedCheckDigit === checkDigit;
}

export function normalizeEmployeeIdNumber(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return "";

    if (isDigitsLike(trimmed)) {
        return digitsOnly(trimmed);
    }

    return trimmed.replaceAll(/\s+/g, " ").toUpperCase();
}

export function formatEmployeeIdNumberInput(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return "";

    if (!isDigitsLike(trimmed)) {
        return trimmed.replaceAll(/\s+/g, " ").toUpperCase();
    }

    const digits = digitsOnly(trimmed).slice(0, 13);
    const first = digits.slice(0, 6);
    const second = digits.slice(6, 10);
    const third = digits.slice(10, 13);

    return [first, second, third].filter(Boolean).join(" ");
}

export function getEmployeeIdValidationMessage(value: string): string | null {
    const normalized = normalizeEmployeeIdNumber(value);
    if (!normalized) return null;

    if (/^\d+$/.test(normalized)) {
        if (normalized.length !== 13) {
            return "SA ID numbers must be 13 digits.";
        }
        if (!isValidSouthAfricanIdNumber(normalized)) {
            return "Check the SA ID number. The date or checksum does not look right.";
        }
        return null;
    }

    if (!/^[A-Z0-9][A-Z0-9/\- ]{5,19}$/.test(normalized)) {
        return "Passport numbers can use letters, numbers, spaces, '/' or '-'.";
    }

    return null;
}

export function maskEmployeeIdNumber(value: string): string {
    const normalized = normalizeEmployeeIdNumber(value);
    if (!normalized) return "";

    if (/^\d{13}$/.test(normalized)) {
        return `${normalized.slice(0, 6)} ${"*".repeat(4)} ${normalized.slice(-3)}`;
    }

    if (normalized.length <= 4) return normalized;
    return `${normalized.slice(0, 2)}${"*".repeat(Math.max(2, normalized.length - 4))}${normalized.slice(-2)}`;
}
