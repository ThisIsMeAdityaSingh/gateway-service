import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// For local development, use service account credentials
// For production deployment, Firebase auto-injects credentials
const credential = process.env.FUNCTIONS_EMULATOR === 'true'
    ? admin.credential.cert('./src/config/mo-money-44f21-firebase-adminsdk-fbsvc-8452fd0a59.json')
    : admin.credential.applicationDefault();

admin.initializeApp({
    credential,
    projectId: 'mo-money-44f21',
});

/**
 * Connect to the 'gateway-service' database as specified in firebase.json.
 * Using the default database caused 'NOT_FOUND' (code 5) errors because it likely doesn't exist or is not used.
 */
const loggerDb = getFirestore(admin.app(), 'gateway-service');

export { admin, loggerDb };