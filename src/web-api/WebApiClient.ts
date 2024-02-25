import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { CookieJar } from 'tough-cookie';
import { FileCookieStore } from 'tough-cookie-file-store';
import { ProxyAgent, ProxyAgentOptions } from 'proxy-agent';
import { HttpCookieAgent, HttpsCookieAgent, createCookieAgent } from 'http-cookie-agent/http';
import type { User } from '../types.js';
import { AuthApi } from './authApi/AuthApi.js';
import { createHash } from 'crypto';
import { USERAGENT_WINDOWS_CHROME } from './constants.js';
import winston from 'winston';
import { MyApi } from './myApi/MyApi.js';
import { BjApi } from './bjApi/BjApi.js';
import { logAxiosError } from '../util/errorLoggers.js';
import { LiveApi } from './liveApi/LiveApi.js';
import { UnauthorizedError } from '../util/erros.js';
import { LiveImageApi } from './liveImageApi/LiveImageApi.js';


const ProxyCookieAgent = createCookieAgent(ProxyAgent);

interface WebApiClientConfig {
    user?: User | null;
    proxyOptions?: ProxyAgentOptions;
    userAgent?: string;
    loggerOptions?: winston.LoggerOptions;
    apiTimeoutMs?: number;
}

export class WebApiClient {
    private logger: winston.Logger;
    private axiosInstance: AxiosInstance;
    private cookieJar: CookieJar;
    private user: User | null;

    private authApi: AuthApi;
    private myApi: MyApi;
    private bjApi: BjApi;
    private liveApi: LiveApi;
    private liveImageApi: LiveImageApi;

    constructor(config: WebApiClientConfig) {
        const loggerOptions = config.loggerOptions ?? {
            level: 'info',
            transports: [
                new winston.transports.Console(),
            ],
        };
        this.logger = winston.createLogger(loggerOptions);
        this.user = config.user ?? null;

        const jar = new CookieJar();

        const axiosAgentOptions = config.proxyOptions ?
            {
                httpAgent: new ProxyCookieAgent({ cookies: {jar}, ...config.proxyOptions }),
                httpsAgent: new ProxyCookieAgent({ cookies: {jar}, ...config.proxyOptions })
            } :
            {
                httpAgent: new HttpCookieAgent({ cookies: {jar}, keepAlive: true }),
                httpsAgent: new HttpsCookieAgent({ cookies: {jar}, keepAlive: true })
            };

        const axiosInstance = axios.create({
            headers: {
                'User-Agent': config.userAgent ?? USERAGENT_WINDOWS_CHROME,
            },
            withCredentials: true,
            ...axiosAgentOptions,
        });
        axiosRetry(axiosInstance, { retries: 0 });

        this.axiosInstance = axiosInstance;
        this.cookieJar = jar;

        this.authApi = new AuthApi(this.axiosInstance, this.logger);
        this.myApi = new MyApi(this.axiosInstance, this.logger);
        this.bjApi = new BjApi(this.axiosInstance, this.logger);
        this.liveApi = new LiveApi(this.axiosInstance, this.logger, config.apiTimeoutMs);
        this.liveImageApi = new LiveImageApi(this.axiosInstance, this.logger, config.apiTimeoutMs);

        this.login();
    }

    private createCookieJar() {
        const hash = createHash('sha256');
        hash.update(this.user?.id ?? '<guest>');
        const cookieFilePath = `./cookies/afreecatv_web_${hash.digest('hex')}.json`;
        return new CookieJar(new FileCookieStore(cookieFilePath));
    }

    private async login() {
        if (this.user) {
            await this.authApi.login(this.user);
        }
    }

    async switchUser(user: User) {
        this.user = user;
        return this.authApi.login(this.user);
    }

    private async callApi<T>(apiCaller: () => Promise<T>, config?: ApiCallConfig): Promise<T> {
        const maxRetries = config?.maxRetries ?? 1;
        const shouldAuth = config?.shouldAuth ?? true;
        const isLoggingDisabled = config?.isLoggingDisabled ?? true;

        if (shouldAuth) {
            await this.authApi.waitForLogin();
        }

        for (let tryCount = 0; ; ++tryCount) {
            try {
                return await apiCaller();
            } catch (error) {
                if (error instanceof UnauthorizedError && tryCount < maxRetries) {
                    await this.login();
                    continue;
                }

                if (isLoggingDisabled) {
                    throw error;
                }

                if (error instanceof Error) {
                    this.logger.warn(error.message);
                }
                if (axios.isAxiosError(error)) {
                    logAxiosError(error);
                }
                throw error;
            }
        }
    }

    async getFavoriteLiveBroadcasts() {
        return this.callApi(
            () => this.liveApi.getOnAirFavoriteChannels(), 
            { shouldAuth: true, }
        );
    }

    async getBroadcastCategories() {
        return this.callApi(
            () => this.liveApi.getBroadcastCategories(),
            { shouldAuth: false, }
        );
    }

    async getFavoriteChannelsLiveStatus() {
        return this.callApi(
            () => this.bjApi.getFavoriteChannelsLiveStatus(), 
            { shouldAuth: true, }
        );
    }

    async getLiveBroadcast(channelId: string) {
        return this.callApi(
            () => this.liveApi.getLiveBroadcastInfo(channelId), 
            { shouldAuth: true, }
        );
    }

    async getLivePreviewImage(broadcastId: string) {
        return this.callApi(
            () => this.liveImageApi.getLivePreviewImage(broadcastId),
            { shouldAuth: false, isLoggingDisabled: true }
        );
    }
}

interface ApiCallConfig {
    shouldAuth?: boolean;
    maxRetries?: number;
    isLoggingDisabled?: boolean;
}