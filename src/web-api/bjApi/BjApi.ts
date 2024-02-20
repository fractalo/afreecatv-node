import axios, { AxiosInstance } from "axios";
import winston from "winston";
import { BJAPI_BASE_URL, BJ_BASE_URL } from "../constants.js";
import { UnauthorizedError } from "../../util/erros.js";
import { isRecord } from "../../util/typePredicates.js";
import { toArraySafe, toStringSafe } from "../../util/converters.js";
import { toChannelLiveStatus } from "./channelLiveStatus.js";


export class BjApi {
    private client: AxiosInstance;
    private logger: winston.Logger;
    private timeoutMs: number | undefined;

    constructor(client: AxiosInstance, logger: winston.Logger, timeoutMs?: number) {
        this.client = client;
        this.logger = logger;
        this.timeoutMs = timeoutMs;
    }

    async getFavoriteChannelsLiveStatus() {
        let abortSignal: AbortSignal | undefined;
        if (this.timeoutMs) {
            abortSignal = AbortSignal.timeout(this.timeoutMs);
        } 

        const response = await this.client.get<unknown>(`${BJAPI_BASE_URL}/api/favorite`, {
            headers: {
                Origin: BJ_BASE_URL,
                Referer: BJ_BASE_URL,
            },
            responseType: 'json',
            signal: abortSignal,
        })
        .catch((error: unknown) => {
            if (!axios.isAxiosError(error)) throw error;
            
            if (!error.response) throw error;

            const data: unknown = error.response.data;

            if (!isRecord(data)) throw error;

            if (toStringSafe(data.code) === '-10000') {
                throw new UnauthorizedError('Unauthorized');
            }

            throw error;
        });

        const channelDataList = toArraySafe(response.data);

        if (!channelDataList) {
            throw new Error('cannot get channel data list as array');
        }

        return channelDataList.filter(isRecord).map(toChannelLiveStatus);
    }
}