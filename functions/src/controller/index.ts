import express, {Request, Response} from "express";

// rate limiter
import { inMemoryRateLimiter } from "../rate-limiter";

// telegram router
import telegramRouter from "./telegram";
// logging route
import loggerRouter from "./logging";
import { incomingTelegramRateLimiterOverrideOptions, loggingRateLimiterOverrideOptions } from "../logging-service/rate-limiter-service";

const app = express();
app.use(express.json({ limit: '5kb' }));
app.use(express.urlencoded({ limit: '5kb', extended: true }));

// Mount telegram router at /telegram
app.use('/telegram', inMemoryRateLimiter(incomingTelegramRateLimiterOverrideOptions), telegramRouter);
app.use('/logger', inMemoryRateLimiter(loggingRateLimiterOverrideOptions), loggerRouter);

app.use((request: Request, response: Response) => {
    const method = request.method;
    response.status(405).json({
      success: false,
      error: `HTTP Method '${method}' not allowed`
    });
});

export default app;