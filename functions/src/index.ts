import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";

// importing app
import serverApp from "./controller";

setGlobalOptions({ maxInstances: 2 });

export const expressAppHandler = onRequest(
    {
        secrets: ['TELEGRAM_SECRET', 'MAIN_SERVICE_ENDPOINT', 'MAIN_SERVICE_HOST', 'LOGGING_SERVICE_TOKEN'],
        memory: '128MiB',
        timeoutSeconds: 60
    },
    serverApp
);