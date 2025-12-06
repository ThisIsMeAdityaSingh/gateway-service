import express, {Request, Response} from "express";
import fetch from "node-fetch";
import { verifyTelegramRequest } from "../../middlewares/verify-telegram-request";
import { ErrorType, GatewayError } from "../../error";

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

        const serviceResponse = await fetch(workerUrl!, {
            method: "POST",
            headers: safeHeaders,
            body: JSON.stringify(request.body)
        });
        const result = await serviceResponse.json();
        const statusCode = serviceResponse.status && serviceResponse.status >= 200 && serviceResponse.status < 600 ? serviceResponse.status : 200;

        response.status(statusCode).json(result).end();
    } catch(error) {
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