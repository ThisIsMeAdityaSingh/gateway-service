import express, {Request, Response} from "express";
import { verifyTelegramRequest } from "../middlewares/verify-telegram-request";
import { inMemoryRateLimiter } from "../rate-limiter";

const app = express();
app.use(express.json());

// custom in-memory rate limiter
app.use(inMemoryRateLimiter());

app.post('/telegram-webhook', verifyTelegramRequest, async function(request: Request, response: Response) {
    
});

app.all('*', async function(request: Request, response: Response) {
    const method = request.method;

    response.status(405).json({
        success: false,
        error: `HTTP Method '${method} not allowed'`
    });
})