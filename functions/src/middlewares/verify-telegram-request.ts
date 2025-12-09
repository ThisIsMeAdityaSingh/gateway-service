import {Request, Response, NextFunction} from "express";
import { ErrorType, GatewayError } from "../error";
import { performTimeSafeEquals } from "../utility/time-safe-equals";
import { addLogToStore, ErrorLevels, ServiceErrorTypes } from "../logging-service";
import { loggerDb } from "../admin";
import { generateErrorLogPayload } from "../utility/generate-error-log-payload";


export async function verifyTelegramRequest(request: Request, response: Response, next: NextFunction) {
    try {
        const token = request.header('x-telegram-bot-api-secret-token');
        
        if (!token || typeof token !== "string") {
            throw new GatewayError("No telegram token signature", ErrorType.CONFIGURATION_ERROR, 400);
        }
        
        const TELEGRAM_SECRET = process.env.TELEGRAM_SECRET as string;
        if (!TELEGRAM_SECRET) {
            throw new GatewayError("Server misconfiguration", ErrorType.CONFIGURATION_ERROR, 400);
        }

        if (!performTimeSafeEquals(token, TELEGRAM_SECRET)) {
            throw new GatewayError("Unauthorized", ErrorType.VALIDATION_ERROR, 400);
        }

        return next();
    } catch(error: any) {
        addLogToStore(loggerDb, generateErrorLogPayload(ErrorLevels.CRITICAL_ERROR, error.message, error.stack || "Telegram verification middleware", ServiceErrorTypes.TELEGRAM_ERROR))
        if (error instanceof GatewayError) {
            response.status(error.statusCode).json({
                error: error.type,
                message: error.message
            });
        } else {
            response.status(502).json({error: 'Something went wrong'});
        }
    }
}