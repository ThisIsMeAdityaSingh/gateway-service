import {Request} from "express";
import { ErrorType, GatewayError } from "../error";
import { CustomRateLimiterSettings } from "../rate-limiter/limiter-settings";

function requestIdGeneratorCallbackFn(request: Request) {
    const body = request.body;
    const requestId = body?.requestId;

    if (!requestId || typeof requestId !== "string") {
        throw new GatewayError(`Invalid request. You are in wrong place.`, ErrorType.VALIDATION_ERROR, 401);
    }

    return requestId;
}

export const loggingRateLimiterOverrideOptions: CustomRateLimiterSettings = {
    costOfRequest: 1,
    cleanUpWindow: 10 * 60 * 1000,
    requestIdGenerator: requestIdGeneratorCallbackFn
}