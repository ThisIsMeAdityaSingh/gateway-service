import express, {Request, Response} from "express";
import fetch from "node-fetch";
import { verifyTelegramRequest } from "../middlewares/verify-telegram-request";
import { inMemoryRateLimiter } from "../rate-limiter";

const app = express();
app.use(express.json());

// custom in-memory rate limiter
app.use(inMemoryRateLimiter());

app.post('/telegram-webhook', verifyTelegramRequest, async function(request: Request, response: Response) {
    const workerUrl = process.env.MAIN_SERVICE_ENDPOINT;
    const workerHost = process.env.MAIN_SERVICE_HOST;

    if (!workerUrl || !workerHost) {
        throw new Error(`Service worker and host are not defined`);
    }

    try {
        // Filter headers to only include string values (exclude arrays)
        const safeHeaders: Record<string, string> = {};
        for (const [key, value] of Object.entries(request.headers)) {
            if (typeof value === 'string') {
                safeHeaders[key] = value;
            }
        }

        const serviceResponse = await fetch(workerUrl!, {
            method: "POST",
            headers: {
                ...safeHeaders,
                'host': process.env.MAIN_SERVICE_HOST!,
                'x-forwarded-for': request.ip!,
            },
            body: JSON.stringify(request.body)
        });

        response.status(serviceResponse.status || 200).end();
    } catch(error) {
        console.error('Proxy error:', error);
        response.status(502).json({ error: 'Gateway hiccup—Worker said no.' });
    }
});

app.all('*', async function(request: Request, response: Response) {
    const method = request.method;

    response.status(405).json({
        success: false,
        error: `HTTP Method '${method} not allowed'`
    });
})

export default app;