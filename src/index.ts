import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import duration from 'dayjs/plugin/duration.js';
import { TIMEZONE_SEOUL } from "./web-api/constants.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(duration)
dayjs.tz.setDefault(TIMEZONE_SEOUL);

export * from './web-api/WebApiClient.js';
export * from './types.js';

export type { LivePreviewImage } from './web-api/liveImageApi/LiveImageApi.js';
export type { ProfileImage } from './web-api/stationImageApi/StationImageApi.js';