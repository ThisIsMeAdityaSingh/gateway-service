import express, {Request, Response} from "express";
import fetch from "node-fetch";
import { verifyTelegramRequest } from "../../middlewares/verify-telegram-request";
import { ErrorType, GatewayError } from "../../error";
import { addLogToStore, ErrorLevels, ServiceErrorTypes } from "../../logging-service";
import { loggerDb } from "../../admin";
import { generateErrorLogPayload } from "../../utility/generate-error-log-payload";

const router = express.Router();

router.post("/", verifyTelegramRequest, async function(request: Request, response: Response) {
    const workerUrl = process.env.MAIN_SERVICE_ENDPOINT;
    const workerHost = process.env.MAIN_SERVICE_HOST;

    if (!workerUrl || !workerHost) {
        throw new GatewayError(`Cannot determine upstream service worker`, ErrorType.UPSTREAM_ERROR, 400);
    }

    try {
        const hopByHop = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade']);
        const safeHeaders: Record<string, string> = {};
        for (const [key, value] of Object.entries(request.headers)) {
            if (typeof value === 'string') {
                const lower = key.toLowerCase();
                if (!hopByHop.has(lower)) safeHeaders[lower] = value;
            }
        }

        safeHeaders['content-type'] = 'application/json';
        safeHeaders['host'] = workerHost;
        safeHeaders['x-forwarded-for'] = request.ip || (request.headers['x-forwarded-for'] as string) || '';

        const customHeaders: Record<string, string> = {
            'x-custom-request-sent-time': Date.now().toString()
        }

        if (process.env.EXTERNAL_SERVICE_CALL_KEY) {
            customHeaders['x-custom-client-id'] = process.env.EXTERNAL_SERVICE_CALL_KEY;
        }

        const serviceResponse = await fetch(workerUrl!, {
            method: "POST",
            headers: {...safeHeaders, ...customHeaders},
            body: JSON.stringify(request.body)
        });
        const result = await serviceResponse.json();
        const statusCode = serviceResponse.status && serviceResponse.status >= 200 && serviceResponse.status < 600 ? serviceResponse.status : 200;

        response.status(statusCode).json(result).end();
    } catch(error: any) {
        addLogToStore(loggerDb, generateErrorLogPayload(ErrorLevels.ERROR, error.message, error.stack || "Worker service", ServiceErrorTypes.WORKER_CALL_SERVICE))
        if (error instanceof GatewayError) {
            response.status(error.statusCode).json({
                error: error.type,
                message: error.message
            });
        } else {
            response.status(502).json({error: 'Gateway hiccup—Worker said no'});
        }
    }
})

export default router;