import { toArraySafe } from "../../util/converters.js";
import { isRecord } from "../../util/typePredicates.js";

export interface FavoriteChannel {
    userId: string;
    userNickname: string;
    stationName: string;
    isLive: boolean;
}

const toBroadcastInfo = (value: unknown) => {
    
};

export const toFavoriteChannels = (list: unknown[]): FavoriteChannel[] => {

    const channels = list
            .filter(isRecord)
            .map(object => {
                toBroadcastInfo(object.broad_info);
            });

    


    return [];
}