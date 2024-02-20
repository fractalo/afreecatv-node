import { toArraySafe, toStringSafe } from "../../util/converters.js";
import { isRecord } from "../../util/typePredicates.js";

export interface BroadcastCategory {
    id: string;
    name: string;
}

export const toBroadcastCategories = (record: Record<string, unknown>): Partial<BroadcastCategory>[] => {
    const {
        cate_name,
        cate_no,
        child,
    } = record;
    
    const childCategories = toArraySafe(child) ?? [];

    const categories = childCategories.filter(isRecord).map(toBroadcastCategories).flat();

    categories.push({
        id: toStringSafe(cate_no),
        name: toStringSafe(cate_name),
    });

    return categories;
};