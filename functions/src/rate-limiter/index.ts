import {Request, Response, NextFunction} from "express";

// importing rate limiter settings
import {rateLimiterSettings, CustomRateLimiterSettings, RateLimitMapData} from "./limiter-settings";

// importing cleanup service
import {cleanupService} from "../utility/cleanup-service";
import { ErrorType, GatewayError } from "../error";

export function inMemoryRateLimiter(extraOptions?: CustomRateLimiterSettings) {
    const rateSettings = {...rateLimiterSettings, ...extraOptions};

    if (!rateSettings.timeWindow || rateSettings.timeWindow <= 0) {
        throw new Error('timeWindow must be > 0');
    }
    if (!rateSettings.maxRefillTokens || rateSettings.maxRefillTokens <= 0) {
        throw new Error('maxRefillTokens must be > 0');
    }
    if (!rateSettings.tokens || rateSettings.tokens <= 0) {
        throw new Error('tokens must be > 0');
    }
    if (rateSettings.costOfRequest !== undefined && rateSettings.costOfRequest <= 0) {
        throw new Error('costOfRequest must be > 0');
    }
    if (!rateSettings.requestIdGenerator || typeof rateSettings.requestIdGenerator !== 'function') {
        throw new Error('requestIdGenerator must be a function');
    }

    const requestMap = new Map<string, RateLimitMapData>();

    function refillPointsForRequest(requestData: RateLimitMapData, currentTime: number) {
        if (currentTime - requestData.lastTokenRefill <= 0) return requestData;

        const timeDuration = currentTime - requestData.lastTokenRefill;
        const tokenRefillPerMs = rateSettings.maxRefillTokens / rateSettings.timeWindow;

        const tokensToRefill = timeDuration * tokenRefillPerMs;
        const newTokens = Math.min(rateSettings.maxRefillTokens, requestData.currentTokensAvailable + tokensToRefill);

        return {currentTokensAvailable: newTokens, lastTokenRefill: currentTime};
    }

    function cleanupServiceCallback(){
        const currentTime = Date.now();
        const keysToDelete: string[] = [];

        for(const [key, value] of requestMap) {
            if (currentTime - value.lastTokenRefill >= rateSettings.cleanUpWindow) {
                keysToDelete.push(key);
            }
        }

        for(const key of keysToDelete) {
            requestMap.delete(key);
        }
    }

    cleanupService(rateSettings.cleanUpWindow, cleanupServiceCallback);

    return function (request: Request, response: Response, next: NextFunction) {
        const now = Date.now();

        try {
            if (typeof rateSettings.skip === 'function' && rateSettings.skip(request)) {
                return next();
            }

            const requestKey = rateSettings.requestIdGenerator(request);

            if (!requestKey) {
                throw new GatewayError(`Cannot determine request id`, ErrorType.VALIDATION_ERROR, 400);
            }

            let currentRequestData = requestMap.get(requestKey);
            const costOfRequest = Math.max(1, rateSettings.costOfRequest);

            if (!currentRequestData) {
                currentRequestData = {currentTokensAvailable: rateSettings.tokens, lastTokenRefill: now};
            } else {
                currentRequestData = refillPointsForRequest(currentRequestData, now);
            }

            
            
            const tokensPerMs = rateSettings.maxRefillTokens / rateSettings.timeWindow;
            if (currentRequestData.currentTokensAvailable < costOfRequest) {
                const tokensNeeded = costOfRequest - currentRequestData.currentTokensAvailable;
                const timeToRefill = Math.ceil(tokensNeeded / tokensPerMs);

                const waitPeriod = timeToRefill > 0 ? timeToRefill : rateSettings.timeWindow;
                
                response.setHeader('Retry-After', String(Math.ceil(waitPeriod / 1000)));
                response.setHeader('X-RateLimit-Reset', String(Math.floor((now + waitPeriod) / 1000)));
                response.setHeader('X-RateLimit-Limit', String(rateSettings.tokens));
                response.setHeader('X-RateLimit-Remaining', String(Math.floor(currentRequestData.currentTokensAvailable)));

                throw new GatewayError(`Too many requests`, ErrorType.RATE_LIMIT_EXCEEDED, 429);
            }
            
            currentRequestData.currentTokensAvailable = currentRequestData.currentTokensAvailable - costOfRequest;
            if (currentRequestData.currentTokensAvailable < 0) {
                currentRequestData.currentTokensAvailable = 0;
            }
            requestMap.set(requestKey, currentRequestData);

            const tokensToFull = rateSettings.tokens - currentRequestData.currentTokensAvailable;
            if (tokensToFull > 0 && tokensPerMs > 0) {
                const msToFull = Math.ceil(tokensToFull / tokensPerMs);
                response.setHeader('X-RateLimit-Reset', String(Math.floor((now + msToFull) / 1000)));
            } else {
                response.setHeader('X-RateLimit-Reset', String(Math.floor((now + rateSettings.timeWindow) / 1000)));
            }

            response.setHeader('X-RateLimit-Limit', String(rateSettings.tokens));
            response.setHeader('X-RateLimit-Remaining', String(Math.floor(currentRequestData.currentTokensAvailable)));

            next();
        } catch(error: any) {
            if (error instanceof GatewayError) {
                response.status(error.statusCode).json({
                    error: error.type,
                    message: error.message
                });
            } else {
                response.status(502).json({error: error.message || 'Gateway hiccup—Worker said no.'});
            }
        }
    };
}