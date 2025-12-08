import {Request, Response, NextFunction} from "express";
import { ErrorType, GatewayError } from "../error";
import { performTimeSafeEquals } from "../utility/time-safe-equals";
import { addLogToStore, ErrorLevels, ServiceErrorTypes } from "../logging-service";
import { loggerDb } from "../admin";
import { generateErrorLogPayload } from "../utility/generate-error-log-payload";

export async function verifyLoggingRequest(request: Request, response: Response, next: NextFunction) {
    try {
        const requestTime = request.get('x-custom-request-sent-time') as string;
        
        // if request is older than 10 mins - reject
        if (!requestTime) {
            throw new GatewayError(`invalid request`, ErrorType.VALIDATION_ERROR, 502);
        }

        if (Date.now() - Number(requestTime) >= 10 * 60 * 1000) {
            throw new GatewayError("old request", ErrorType.VALIDATION_ERROR, 502);
        }

        const clientSecret = request.get('x-custom-client-id');

        if (!clientSecret || typeof clientSecret !== "string") {
            throw new GatewayError("unauthorized request", ErrorType.VALIDATION_ERROR, 401);
        }

        const availableSecret = process.env.LOGGING_SERVICE_TOKEN as string;
        if (!clientSecret) {
            throw new GatewayError("cannot verify request", ErrorType.CONFIGURATION_ERROR, 500);
        }

        if (!availableSecret) {
            throw new GatewayError("cannot verify request", ErrorType.CONFIGURATION_ERROR, 500);
        }

        if (!performTimeSafeEquals(clientSecret, availableSecret)) {
            throw new GatewayError("unauthorized request", ErrorType.VALIDATION_ERROR, 401);
        }

        return next();
    } catch(error: any) {
        addLogToStore(loggerDb, generateErrorLogPayload(ErrorLevels.ERROR, error.message, error.stack || "log verification", ServiceErrorTypes.GENRAL_ERROR));
        if (error instanceof GatewayError) {
            response.status(error.statusCode).json({
                error: error.type,
                message: error.message
            });
        } else {
            response.status(502).json({error: 'Something went wrong'}).end();
        }
    }
}