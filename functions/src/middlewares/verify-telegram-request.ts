import {Request, Response, NextFunction} from "express";
import { ErrorType, GatewayError } from "../error";

const TELEGRAM_SECRET = process.env.TELEGRAM_SECRET;

export async function verifyTelegramRequest(request: Request, response: Response, next: NextFunction) {
    try {
        const token = request.header('x-telegram-bot-api-secret-token');

        if (!TELEGRAM_SECRET) {
            throw new GatewayError("Server misconfiguration", ErrorType.CONFIGURATION_ERROR, 400);
        }

        if (token !== TELEGRAM_SECRET) {
            throw new GatewayError("Unauthorized", ErrorType.VALIDATION_ERROR, 400);
        }

        return next();
    } catch(error) {
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