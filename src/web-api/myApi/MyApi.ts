import { AxiosInstance } from "axios";
import winston from "winston";
import { MYAPI_BASE_URL, MY_BASE_URL } from "../constants.js";
import { isRecord } from "../../util/typePredicates.js";
import { toArraySafe } from "../../util/converters.js";
import { toFavoriteChannels } from "./favoriteChannel.js";


export class MyApi {
    private client: AxiosInstance;
    private logger: winston.Logger;

    constructor(client: AxiosInstance, logger: winston.Logger) {
        this.client = client;
        this.logger = logger;
    }

    /**
     * @deprecated
     * It takes about 10 seconds for the changed broadcast information to be reflected in the response.
     * It is not suitable for use when real-time data is needed.
     */
    async getAllFavoriteChannels() {
        const response = await this.client.get<unknown>(`${MYAPI_BASE_URL}/api/favorite`, {
            headers: {
                'Origin': MY_BASE_URL,
                'Referer': `${MY_BASE_URL}/favorite`,
            },
            responseType: 'json',
        });

        const { data } = response;

        if (!isRecord(data)) {
            throw new Error('response data is not a record.');
        }

        const channelList = toArraySafe(data.data);

        if (!channelList) {
            throw new Error('cannot get favorite channels as array');
        }

        return toFavoriteChannels(channelList);
    }


}