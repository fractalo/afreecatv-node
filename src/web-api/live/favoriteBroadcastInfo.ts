import { toNumberSafe, toStringArraySafe, toStringSafe } from "../../util/converters.js";
import { BroadcastInfo } from "./broadcastInfo.js";

export interface FavoriteBroadcastInfo extends BroadcastInfo {
    stationName: string;
}

export const toFavoriteBroadcastInfo = (record: Record<string, unknown>): Partial<FavoriteBroadcastInfo> => {
    const {
        user_id,
        user_nick,
        station_name,
        broad_no,
        broad_title,
        broad_cate_no,
        auto_hashtags,
        category_tags,
        hash_tags,
        is_password,
        broad_grade,
        visit_broad_type,
    } = record;

    const requiresPassword = toStringSafe(is_password) ? toStringSafe(is_password) === 'Y' : undefined;
    const isVisitAllowed = toStringSafe(visit_broad_type) ? toStringSafe(visit_broad_type) === '1' : undefined;

    return {
        userId: toStringSafe(user_id),
        userNickname: toStringSafe(user_nick),
        stationName: toStringSafe(station_name),
        broadcastId: toStringSafe(broad_no),
        title: toStringSafe(broad_title),
        categoryId: toStringSafe(broad_cate_no),
        autoHashtags: toStringArraySafe(auto_hashtags),
        categoryHashtags: toStringArraySafe(category_tags),
        customHashtags: toStringArraySafe(hash_tags),
        requiresPassword,
        ageLimit: toNumberSafe(broad_grade),
        isVisitAllowed,
    };
};