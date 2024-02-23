import axios, { AxiosInstance } from "axios";
import qs from 'qs';
import { AUTH_BASE_URL, LOGIN_PAGE_URL } from "../constants.js";
import { toStringSafe } from "../../util/converters.js";
import { User } from "../../types.js";
import { isRecord } from "../../util/typePredicates.js";
import { Cookie } from "tough-cookie";
import winston from "winston";
import { logAxiosError } from "../../util/errorLoggers.js";

/**
 * manages client user login and logout.
 * doesn't care whether currently logged in or not.
 */
export class AuthApi {
    private client: AxiosInstance;
    private logger: winston.Logger;
    private loginPromise: Promise<void> | null = null;

    constructor(client: AxiosInstance, logger: winston.Logger) {
        this.client = client;
        this.logger = logger;
    }

    async login(user: User) {
        if (!this.loginPromise) {
            this.loginPromise = this._login(user)
                    .then(() => {
                        this.loginPromise = null;
                    })
                    .catch((error: unknown) => {
                        this.logger.warn('failed to login.', 'Error: ', error);
                    });
        }
        return this.loginPromise;
    }

    private async _login(user: User) {
        // setup cookies (not required currently)
        await this.getLoginPage()
                .catch((error: unknown) => {
                    if (axios.isAxiosError(error)) {
                        logAxiosError(error);
                    } else if (error instanceof Error) {
                        this.logger.info(error.message);
                    }
                });

        await this.postLoginForm(user);
    }

    async waitForLogin() {
        return this.loginPromise;
    }

    private async getLoginPage() {
        const response = await this.client.get<unknown>(LOGIN_PAGE_URL, {
            headers: {
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
            },
            responseType: 'document',
            'axios-retry': { retries: 3 },
        });
        return toStringSafe(response.data);
    }

    private async postLoginForm(user: User) {
        const formData = qs.stringify({
            szWork: 'login',
            szType: 'json',
            szUid: user.id,
            szPassword: user.password,
            isSaveId: false,
            szScriptVar: 'oLoginRet',
            szAction: '',
            isLoginRetain: 'Y',
        });

        const response = await this.client.post<unknown>(`${AUTH_BASE_URL}/app/LoginAction.php`, formData, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                Origin: AUTH_BASE_URL,
                Referer: LOGIN_PAGE_URL,
            },
            responseType: 'json',
            'axios-retry': { retries: 1 },
        });

        let resultCode: unknown;
        if (isRecord(response.data)) {
            resultCode = response.data.RESULT;
        }

        if (resultCode === 1) {
            if (!AuthApi.includesAuthToken(response.headers['set-cookie'])) {
                this.logger.info('cannot find auth token from login response header');
            }
            this.logger.info('login success');
        } else {
            this.logger.warn(`failed to login (data: ${response.data})`);
        }
    }
    
    private static includesAuthToken(cookieHeaders: string[] | undefined): boolean {
        if (!cookieHeaders) return false;

        const cookieKeys = new Set(cookieHeaders.map(header => Cookie.parse(header)?.key));

        return ['PdboxUser', 'PdboxTicket'].every(key => cookieKeys.has(key));
    }

    
}