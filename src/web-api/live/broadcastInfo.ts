import { toNumberSafe, toStringArraySafe, toStringSafe } from "../../util/converters.js";

export interface BroadcastInfo {
    userId: string;
    userNickname: string;

    broadcastId: string;
    title: string;
    categoryId: string;
    autoHashtags: string[];
    categoryHashtags: string[];
    customHashtags: string[];

    requiresPassword: boolean;
    ageLimit: number;
    isVisitAllowed: boolean; // 탐방
}

export const toBroadcastInfo = (record: Record<string, unknown>): Partial<BroadcastInfo | null> => {
    const {
        BJID,
        BJNICK,
        BNO,
        TITLE,
        CATE,
        AUTO_HASHTAGS,
        CATEGORY_TAGS,
        HASH_TAGS,
        BPWD,
        GRADE,
        VBT,
    } = record;

    const requiresPassword = toStringSafe(BPWD) ? toStringSafe(BPWD) === 'Y' : undefined;
    const isVisitAllowed = toStringSafe(VBT) ? toStringSafe(VBT) === '1' : undefined;

    const broadcastInfo: Partial<BroadcastInfo> = {
        userId: toStringSafe(BJID),
        userNickname: toStringSafe(BJNICK),
        broadcastId: toStringSafe(BNO),
        title: toStringSafe(TITLE),
        categoryId: toStringSafe(CATE),
        autoHashtags: toStringArraySafe(AUTO_HASHTAGS),
        categoryHashtags: toStringArraySafe(CATEGORY_TAGS),
        customHashtags: toStringArraySafe(HASH_TAGS),
        requiresPassword,
        ageLimit: toNumberSafe(GRADE),
        isVisitAllowed,
    };

    const isLive = Object.values(broadcastInfo).some(value => value !== undefined);

    return isLive ? broadcastInfo : null
};