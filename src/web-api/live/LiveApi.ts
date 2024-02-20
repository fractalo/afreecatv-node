import { AxiosInstance } from "axios";
import winston from "winston";
import { LIVE_BASE_URL, PLAY_BASE_URL } from "../constants.js";
import { isRecord } from "../../util/typePredicates.js";
import { toArraySafe, toNumberSafe, toStringSafe } from "../../util/converters.js";
import { parseJsonp } from "../../util/jsonp.js";
import { toFavoriteBroadcastInfo } from "./favoriteBroadcastInfo.js";
import { UnauthorizedError } from "../../util/erros.js";
import { toBroadcastCategories } from "./broadcastCategory.js";
import qs from "qs";
import { SafeAny } from "../../util/SafeAny.js";
import { toBroadcastInfo } from "./broadcastInfo.js";



export class LiveApi {
    private client: AxiosInstance;
    private logger: winston.Logger;
    private timeoutMs: number | undefined;

    private static COMMON_HEADERS: Record<string, string> = {
        'Origin': PLAY_BASE_URL,
        'Referer': `${PLAY_BASE_URL}`,
    };

    constructor(client: AxiosInstance, logger: winston.Logger, timeoutMs?: number) {
        this.client = client;
        this.logger = logger;
        this.timeoutMs = timeoutMs;
    }

    private createAbortSignal() {
        if (this.timeoutMs) {
            return AbortSignal.timeout(this.timeoutMs);
        }  
    }

    /**
     * max 25 items per page
     */
    async getOnAirFavoriteChannels(pageNumber: number = 1) {                                   
        const response = await this.client.get<unknown>(`${LIVE_BASE_URL}/afreeca/favorite_list_api.php`, {
            params: {
                szFrom: 'html5',
                szLocation: 'live',
                szClub: 'y',
                nPage: pageNumber,
                szWork: 'LIST_ONAIR',
                _: Date.now(),
            },
            headers: {
                ...LiveApi.COMMON_HEADERS,
            },
            responseType: 'text',
            signal: this.createAbortSignal(),
        });

        const { data } = response;

        if (typeof data !== 'string') {
            throw new Error('response data is not a string.');
        }

        const parsedData = parseJsonp(data);

        const channelData = parsedData?.CHANNEL;
        if (!isRecord(channelData)) {
            throw new Error('no CHANNEL object under parsed data.');
        }

        const resultCode = toStringSafe(channelData.RESULT);
        const channelDataList = toArraySafe(channelData.LIST);
        const totalCount = toNumberSafe(channelData.TOTAL_CNT);

        if (resultCode === '-10') {
            throw new UnauthorizedError('Unauthorized');
        } else if (resultCode !== '1') {
            this.logger.info(`unknown result code: ${resultCode}`);
        }

        if (!channelDataList) {
            throw new Error('cannot get channel data list as array');
        }

        return channelDataList.filter(isRecord).map(toFavoriteBroadcastInfo);
    }

    async getBroadcastCategories() {
        const response = await this.client.get<unknown>(`${LIVE_BASE_URL}/script/locale/ko_KR/broad_category.js`, {
            headers: {
                ...LiveApi.COMMON_HEADERS,
            },
            responseType: 'text',
            'axios-retry': { retries: 1 },
        });

        const { data } = response;

        if (typeof data !== 'string') {
            throw new Error('response data is not a string.');
        }

        const parsedData = parseJsonp(data);

        const channelData = parsedData?.CHANNEL;
        if (!isRecord(channelData)) {
            throw new Error('no CHANNEL object under parsed data.');
        }

        const resultCode = toStringSafe(channelData.RESULT);
        const categoryList = toArraySafe(channelData.BROAD_CATEGORY);

        if (resultCode !== '1') {
            this.logger.info(`unknown result code: ${resultCode}`);
        }

        if (!categoryList) {
            throw new Error('cannot get channel data list as array');
        }

        return categoryList.filter(isRecord).map(toBroadcastCategories).flat();
    }

    async getLiveBroadcastInfo(channelId: string) {
        const formData = qs.stringify({
            bid: channelId,
            bno: null,
            type: 'live',
            player_type: 'html5',
            stream_type: 'common',
            quality: 'HD',
            mode: 'landing',
            from_api: 0,
        });

        const response = await this.client.post<SafeAny>(
            `${LIVE_BASE_URL}/afreeca/player_live_api.php`, 
            formData, 
            {
                params: {
                    bjid: channelId,
                },
                headers: {
                    ...LiveApi.COMMON_HEADERS,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                responseType: 'json',
                withCredentials: false,
                signal: this.createAbortSignal(),
            }
        );

        const { data } = response;
        const channelData = data?.CHANNEL;
        
        if (!isRecord(channelData)) {
            throw new Error('no CHANNEL object under response data.');
        }

        return toBroadcastInfo(channelData);
    }


}