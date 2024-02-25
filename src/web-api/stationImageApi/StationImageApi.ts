import axios, { AxiosInstance } from "axios";
import winston from "winston";
import { STATIONIMG_BASE_URL } from "../constants.js";

export interface ProfileImage {
    channelId: string;
    url: string;
    data: Buffer;
}

export class StationImageApi {
    private client: AxiosInstance;
    private logger: winston.Logger;
    private timeoutMs: number | undefined;

    constructor(client: AxiosInstance, logger: winston.Logger, timeoutMs?: number) {
        this.client = client;
        this.logger = logger;
        this.timeoutMs = timeoutMs;
    }

    createProfileImageUrl(channelId: string) {
        return `${STATIONIMG_BASE_URL}/LOGO/${channelId.slice(0, 2)}/${channelId}/${channelId}.jpg`;
    }

    async getProfileImage(channelId: string): Promise<ProfileImage> {
        const url = this.createProfileImageUrl(channelId);

        const response = await this.client.get<unknown>(url, {
            params: {
                t: Date.now()
            },
            responseType: 'arraybuffer',
            "axios-retry": { retries: 2 },
            signal: this.createAbortSignal(),
        });

        const { data } = response;

        if (!Buffer.isBuffer(data)) {
            throw new Error('response data is not a buffer');
        }
        return { channelId, url, data };
    }

    private createAbortSignal() {
        if (this.timeoutMs) {
            return AbortSignal.timeout(this.timeoutMs);
        }  
    }
}