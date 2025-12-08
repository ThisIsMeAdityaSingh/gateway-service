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

function incomingTelegramRequestidGeneratorCallbackFn(request: Request) {
    const body = request.body;

    const fromId = body?.message?.from?.id;

    if (typeof fromId !== "number") {
        throw new GatewayError(`Invalid request. You are in wrong place.`, ErrorType.VALIDATION_ERROR, 401);
    }

    return String(fromId);
}

export const loggingRateLimiterOverrideOptions: CustomRateLimiterSettings = {
    costOfRequest: 1,
    cleanUpWindow: 10 * 60 * 1000,
    requestIdGenerator: requestIdGeneratorCallbackFn
}


export const incomingTelegramRateLimiterOverrideOptions: CustomRateLimiterSettings = {
    costOfRequest: 1,
    cleanUpWindow: 10 * 60 * 1000,
    requestIdGenerator: incomingTelegramRequestidGeneratorCallbackFn
}