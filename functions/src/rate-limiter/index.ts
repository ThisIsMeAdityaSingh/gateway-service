import {Request, Response, NextFunction} from "express";

// importing rate limiter settings
import {rateLimiterSettings, CustomRateLimiterSettings, RateLimitMapData} from "./limiter-settings";

export async function inMemoryRateLimiter(extraOptions?: CustomRateLimiterSettings) {
    try {
        const rateSettings = {...rateLimiterSettings, ...extraOptions};
        const requestMap = new Map<string, RateLimitMapData>();

        function refillPointsForRequest(requestData: RateLimitMapData) {
            const currentTime = Date.now();
            if (currentTime - requestData.lastTokenRefill <= 0) {
                // no need to refill any token, just return
                return requestData;
            }

            const timeDuration = currentTime - requestData.lastTokenRefill;
            const tokenRefillPerMs = rateSettings.maxRefilTokens / rateSettings.timeWindow;

            const tokensToRefill = timeDuration * tokenRefillPerMs;
            const newTokens = Math.min(rateSettings.maxRefilTokens, requestData.currentTokensAvailable + tokensToRefill);

            return {currentTokensAvailable: newTokens, lastTokenRefill: Date.now()};
        }

        return function (request: Request, response: Response, next: NextFunction) {
            const requestIp = request.ip;

            if (!requestIp) {
                throw Error("Invalid request no IP detected");
            }

            // check if this ip has made request before or not
            let currentRequestData = requestMap.get(requestIp);

            if (!currentRequestData) {
                currentRequestData = {currentTokensAvailable: rateSettings.tokens, lastTokenRefill: Date.now()};
                requestMap.set(requestIp, currentRequestData);
            }

            
        };
    } catch(error) {

    }
}