import express, {Request, Response} from "express";

// rate limiter
import { inMemoryRateLimiter } from "../rate-limiter";

// telegram router
import telegramRouter from "./telegram";

const app = express();
app.use(express.json({ limit: '5kb' }));
app.use(express.urlencoded({ limit: '5kb', extended: true }));

// custom in-memory rate limiter
app.use(inMemoryRateLimiter());

// Mount telegram router at /telegram
app.use('/telegram', telegramRouter);

app.use((request: Request, response: Response) => {
    const method = request.method;
    response.status(405).json({
      success: false,
      error: `HTTP Method '${method}' not allowed`
    });
});

export default app;