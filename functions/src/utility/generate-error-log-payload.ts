import { ErrorLevels, ErrorSource, ServiceErrorTypes } from "../logging-service";

export function generateErrorLogPayload(level: ErrorLevels, message: string, metadata: string|object, errorType: ServiceErrorTypes) {
    return {
        level,
        source: ErrorSource.FIREBASE_FUNCTION, // since this function would only be used by gateway-service code
        message,
        requestId: `cloudfare_${crypto.randomUUID()}`,
        metadata,
        errorType
    }
}