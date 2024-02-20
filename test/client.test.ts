import 'dotenv/config';

import { expect, test, describe, beforeAll } from 'vitest';
import type { User } from '../src/index.js';
import winston from 'winston';
import { WebApiClient } from '../src/index.js';

const user: User = {
    id: process.env.AFREECATV_ID!,
    password: process.env.AFREECATV_PASSWORD!
};


describe('web client', () => {

    let apiClient: WebApiClient;

    beforeAll(() => {
        apiClient = new WebApiClient({
            user,
            loggerOptions: {
                level: 'debug',
                transports: [
                    new winston.transports.Console()
                ] 
            }
        });
    });

    test('switch user', async() => {
        await apiClient.switchUser(user);
    });

    test('get live broadcasts of favorite channels', async() => {
        const broadcasts = await apiClient.getFavoriteLiveBroadcasts();
        console.log(broadcasts);
    });

    test('get all broadcast categories', async() => {
        const categories = await apiClient.getBroadcastCategories();
        console.log(categories);
    });

    test('get live status of favorite channels', async() => {
        const liveStatusList = await apiClient.getFavoriteChannelsLiveStatus();
        console.log(liveStatusList);
    });

    test('get live broadcast of specific channel', async() => {
        const broadcast = await apiClient.getLiveBroadcast('afsupport');
        console.log(broadcast);
    });


});