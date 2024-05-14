import axios, { AxiosInstance } from "axios";
import winston from "winston";
import { LIVEIMG_BASE_URL } from "../constants.js";

export interface LivePreviewImage {
    broadcastId: string;
    url: string;
    data: Buffer;
}

export class LiveImageApi {
    private client: AxiosInstance;
    private logger: winston.Logger;
    private timeoutMs: number | undefined;

    constructor(client: AxiosInstance, logger: winston.Logger, timeoutMs?: number) {
        this.client = client;
        this.logger = logger;
        this.timeoutMs = timeoutMs;
    }

    createLivePreviewImageUrl(broadcastId: string) {
        return `${LIVEIMG_BASE_URL}/h/${broadcastId}.jpg`;
    }

    async getLivePreviewImage(broadcastId: string): Promise<LivePreviewImage> {
        const baseUrl = this.createLivePreviewImageUrl(broadcastId);

        const params = {
            t: Date.now()
        };

        const response = await this.client.get<unknown>(baseUrl, {
            params,
            responseType: 'arraybuffer',
            signal: this.createAbortSignal(),
        });

        const { data } = response;

        if (!Buffer.isBuffer(data)) {
            throw new Error('response data is not a buffer');
        }

        const url = new URL(baseUrl);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value.toString());
        });

        return {
            broadcastId, 
            url: url.toString(), 
            data 
        };
    }

    private createAbortSignal() {
        if (this.timeoutMs) {
            return AbortSignal.timeout(this.timeoutMs);
        }  
    }
}