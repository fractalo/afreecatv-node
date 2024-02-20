import { SafeAny } from "./SafeAny.js";
import JSON5 from 'json5'

export const parseJsonp = (text: string): SafeAny => {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');

    const jsonString = text.slice(start, end + 1);

    return JSON5.parse(jsonString);
};