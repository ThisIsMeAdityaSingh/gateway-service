import {Request, Response, NextFunction} from "express";
import { getErrorResponseObject } from "../utility";

const TELEGRAM_SECRET = process.env.TELEGRAM_SECRET;

export async function verifyTelegramRequest(request: Request, response: Response, next: NextFunction) {
    try {
        const token = request.header('x-telegram-bot-api-secret-token');

        if (!TELEGRAM_SECRET) {
            return response.status(500).json(getErrorResponseObject("Server misconfigured"));
        }

        if (token !== TELEGRAM_SECRET) {
            return response.status(401).json(getErrorResponseObject("unauthorized"));
        }

        next();
    } catch(error) {
        response.status(500).json(getErrorResponseObject("Something went wrong"));
    }
}