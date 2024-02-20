import { isRecord, isUnknownArray } from "./typePredicates.js";

export const toStringSafe = (value: unknown): string | undefined => {
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
    }
};

export const toNumberSafe = (value: unknown): number | undefined => {
    if (typeof value === 'string' || typeof value === 'number') {
        return Number(value);
    }
};

export const toStringArraySafe = (value: unknown): string[] | undefined => {
    if (!isUnknownArray(value)) return;
    return value
            .map(toStringSafe)
            .filter((item): item is string => item !== undefined);
};

export const toStringSetSafe = (value: unknown): Set<string> | undefined => {
    const stringArray = toStringArraySafe(value);
    if (stringArray) {
        return new Set(stringArray);
    }
};

export const toDateSafe = (value: unknown): Date | undefined => {
    if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? undefined : date;
    }
};

export const toArraySafe = (value: unknown): unknown[] | undefined => {
    if (isRecord(value)) {
        return Object.values(value);
    } else if (isUnknownArray(value)) {
        return value;
    }
};

export const toBooleanSafe = (value: unknown): boolean | undefined => {
    if (value === undefined) return;

    return Boolean(value);
}