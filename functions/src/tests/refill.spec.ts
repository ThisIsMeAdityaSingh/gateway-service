import express from "express";
import supertest from "supertest";

import {inMemoryRateLimiter} from "../rate-limiter";

jest.useFakeTimers();

describe("Test refills in rate limiter", () => {
    let app: express.Express;

    beforeEach(() => {
        app = express();

        app.use(inMemoryRateLimiter({
            costOfRequest: 1,
            requestIdGenerator: (req) => 'test-client',
            cleanUpWindow: 60 * 10 * 1000
        }));

        app.get('/', (req, res) => res.status(200).send('ok'));
    });

    test("Refill test in in-memory rate limiter", async () => {
        await supertest(app).get('/').expect(200);
        await supertest(app).get('/').expect(200);
        await supertest(app).get('/').expect(200);
        await supertest(app).get('/').expect(200);
        await supertest(app).get('/').expect(200);
        await supertest(app).get('/').expect(200);
        await supertest(app).get('/').expect(200);
        await supertest(app).get('/').expect(200);
        await supertest(app).get('/').expect(200);
        await supertest(app).get('/').expect(200);

        await supertest(app).get('/').expect(429);

        jest.advanceTimersByTime(10 * 60 * 1000);

        await supertest(app).get('/').expect(200);
    });
});