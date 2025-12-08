import { ErrorLevels, ErrorSource, ServiceErrorTypes } from "../logging-service";

export function generateErrorLogPayload(level: ErrorLevels, message: string, metadata: string|object, errorType: ServiceErrorTypes) {
    return {
        level,
        source: ErrorSource.CLOUDFARE_WORKER,
        message,
        requestId: `cloudfare_${crypto.randomUUID()}`,
        metadata,
        errorType
    }
}