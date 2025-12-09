import crypto from "crypto";

export function performTimeSafeEquals(sample1?: string, sample2?: string) {
    if (typeof sample1 !== "string" || typeof sample2 !== "string") {
        return false;
    }

    const buf1 = Buffer.from(sample1, 'utf-8');
    const buf2 = Buffer.from(sample2, 'utf-8');

    if (buf1.length !== buf2.length) {
        return false;
    }

    return crypto.timingSafeEqual(buf1, buf2);
}
