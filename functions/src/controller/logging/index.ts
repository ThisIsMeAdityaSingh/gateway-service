import express, {Request, Response} from "express";
import { verifyLoggingRequest } from "../../middlewares/verify-logging-request";
import { addLogToStore, verifyLoggingPayload } from "../../logging-service";
import { ErrorType, GatewayError } from "../../error";
import { loggerDb } from "../../admin";

const router = express.Router();

router.post('/', verifyLoggingRequest, async function(request: Request, response: Response) {
    try {
        const payload = request.body;
        if (!verifyLoggingPayload(payload)) {
            throw new GatewayError(`invalid payload`, ErrorType.VALIDATION_ERROR, 400);
        }

        const loggingServiceResponse = await addLogToStore(loggerDb, payload);

        response.status(200).json(loggingServiceResponse);
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
});

export default router;