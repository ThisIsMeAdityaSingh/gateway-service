import express from "express";
import supertest from "supertest";

import {inMemoryRateLimiter} from "../rate-limiter";

describe("In memory rate limiter test", () => {
    let app: express.Express;
    beforeAll(() => {
        app = express();

        app.use(inMemoryRateLimiter({
            costOfRequest: 1,
            requestIdGenerator: (req) => 'test-client',
            cleanUpWindow: 60 * 10 * 1000
        }));

        app.get('/', (req, res) => res.status(200).send('ok'));
    });

    test("allow requests untill you get a 429 error", async () => {
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
        const res = await supertest(app).get('/');
        expect(res.status).toBe(429);
        expect(res.headers['retry-after']).toBeDefined();
        expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    });
});