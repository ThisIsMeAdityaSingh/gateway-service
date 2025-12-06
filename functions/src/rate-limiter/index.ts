import {Request, Response, NextFunction} from "express";

// importing rate limiter settings
import {rateLimiterSettings, CustomRateLimiterSettings, RateLimitMapData} from "./limiter-settings";

// importing cleanup service
import {cleaupService} from "../utility/cleanup-service";
import { ErrorType, GatewayError } from "../error";

export function inMemoryRateLimiter(extraOptions?: CustomRateLimiterSettings) {
    const rateSettings = {...rateLimiterSettings, ...extraOptions};
    const requestMap = new Map<string, RateLimitMapData>();

    function refillPointsForRequest(requestData: RateLimitMapData, now: number) {
        if (now - requestData.lastTokenRefill <= 0) {
            // no need to refill any token, just return
            return requestData;
        }

        const timeDuration = now - requestData.lastTokenRefill;
        const tokenRefillPerMs = rateSettings.maxRefilTokens / rateSettings.timeWindow;

        const tokensToRefill = timeDuration * tokenRefillPerMs;
        const newTokens = Math.min(rateSettings.maxRefilTokens, requestData.currentTokensAvailable + tokensToRefill);

        return {currentTokensAvailable: newTokens, lastTokenRefill: now};
    }

    function cleanupServiceCallback(){
        // this would clean the hash map filled with old request. Saves space and money
        const now = Date.now();

        for(const [key, value] of requestMap) {
            if (now - value.lastTokenRefill >= rateSettings.cleanUpWindow) {
                requestMap.delete(key);
            }
        }
    }

    cleaupService(rateSettings.cleanUpWindow, cleanupServiceCallback);

    return function (request: Request, response: Response, next: NextFunction) {
        try {
            
            if (typeof rateSettings.skip === 'function' && rateSettings.skip(request)) {
                return next();
            }
            
            const requestKey = rateSettings.requestIdGenerator(request);
            const now = Date.now();

            if (!requestKey) {
                throw new GatewayError(`Cannot determine request id`, ErrorType.VALIDATION_ERROR, 400);
            }

            if (!rateSettings.timeWindow || rateSettings.timeWindow <= 0) throw new Error('timeWindow must be > 0');
            if (!rateSettings.maxRefilTokens || rateSettings.maxRefilTokens <= 0) throw new Error('maxRefilTokens must be > 0');

            // check if this ip has made request before or not
            let currentRequestData = requestMap.get(requestKey);
            const costOfRequest = Math.max(1, rateSettings.costOfRequest);

            if (!currentRequestData) {
                currentRequestData = {currentTokensAvailable: rateSettings.tokens, lastTokenRefill: now};
            } else {
                currentRequestData = refillPointsForRequest(currentRequestData, now);
            }

            
            
            const tokensPerMs = rateSettings.maxRefilTokens / rateSettings.timeWindow;
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
            
            currentRequestData.currentTokensAvailable = currentRequestData.currentTokensAvailable - rateSettings.costOfRequest;
            if (currentRequestData.currentTokensAvailable < 0) {
                currentRequestData.currentTokensAvailable = 0;
            }
            requestMap.set(requestKey, currentRequestData);

            if (tokensPerMs > 0) {
                const msUntilOne = Math.ceil(Math.max(0, 1 - (currentRequestData.currentTokensAvailable % 1)) / tokensPerMs);
                response.setHeader('X-RateLimit-Reset', String(Math.floor((now + msUntilOne) / 1000)));
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