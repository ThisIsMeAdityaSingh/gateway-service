import {Request} from "express";

export interface CustomRateLimiterSettings {
    costOfRequest: number,
    cleanUpWindow: number,
    requestIdGenerator: (request: Request) => string,
}

export interface RateLimitMapData {
    currentTokensAvailable: number,
    lastTokenRefill: number
}

export const rateLimiterSettings = {
    timeWindow: 60 * 1000, // giving a time window of 1 mins
    tokens: 10,
    maxRefilTokens: 10,
    costOfRequest: 1,
    cleanUpWindow: 10 * 60 * 1000, // clean up memory every 10 mins
    requestIdGenerator: (request: Request) => request.ip,
}