import { toBooleanSafe, toStringSafe } from "../../util/converters.js";

export interface ChannelLiveStatus {
    isLive: boolean;
    userId: string;
    userNickname: string;
}

export const toChannelLiveStatus = (record: Record<string, unknown>): Partial<ChannelLiveStatus> => {
    const {
        is_live,
        user_id,
        nickname,
    } = record;

    return {
        isLive: toBooleanSafe(is_live),
        userId: toStringSafe(user_id),
        userNickname: toStringSafe(nickname),
    };
};