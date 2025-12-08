import admin from "firebase-admin";
import { ErrorType, GatewayError } from "../error";
import { isEmptyObject } from "../utility";

export enum ErrorLevels {
    CRITICAL_ERROR = "CRITICAL_ERROR",
    ERROR = "ERROR",
    WARNING = "WARNING",
    INFO = "INFO"
}

export enum ErrorSource {
    CLOUDFARE_WORKER = "CLOUDFARE_WORKER",
    FIREBASE_FUNCTION = "FIREBASE_FUNCTION"
}

export enum ServiceErrorTypes {
    TELEGRAM_ERROR = 'TELEGRAM_ERROR',
    AI_ERROR = 'AI_ERROR',
    DATABASE_ERROR = 'DATABASE_ERROR',
    SIGNAL_ERROR = 'SIGNAL_ERROR',
    UNAUTHORIZED_ACCESS_ERROR = 'UNAUTHORIZED_ACCESS_ERROR',
    WRONG_METHOD_ERROR = 'WRONG_METHOD_ERROR',
    REQUEST_ERROR = 'REQUEST_ERROR',
    GENRAL_ERROR = 'GENRAL_ERROR',
    RATE_LIMITER_ERROR = 'RATE_LIMITER_ERROR',
    WORKER_CALL_SERVICE = 'WORKER_CALL_SERVICE'
}

export type LoggingErrorType = ErrorType | ServiceErrorTypes;

export const LoggingError = {
    ...ErrorType,
    ...ServiceErrorTypes
}

export interface LoggingPayload {
    level: ErrorLevels,
    source: ErrorSource,
    message: string,
    requestId: string,
    metadata: object|string,
    errorType: LoggingErrorType
}

export function verifyLoggingPayload(data: any): data is LoggingPayload {
    if (isEmptyObject(data)) {
        throw new GatewayError(`invalid payload`, ErrorType.VALIDATION_ERROR, 400);
    }

    const {level, source, message, requestId, metadata, errorType} = data;

    const validLevels = Object.values(ErrorLevels);
    const validSources = Object.values(ErrorSource);
    const validTypes = [...Object.values(ErrorType), ...Object.values(ServiceErrorTypes)];

    const isMessageValid = typeof message === "string";
    const isRequestIdValid = typeof requestId === "string";
    const isMetaDataValid = typeof metadata === "string" || !isEmptyObject(metadata);
    const isLevelValid = validLevels.includes(level);
    const isSourceValid = validSources.includes(source);
    const isErrorTypeValid = validTypes.includes(errorType);

    return isMessageValid && isRequestIdValid && isMetaDataValid && isLevelValid && isSourceValid && isErrorTypeValid;
}

export async function addLogToStore(logDbInstance: admin.firestore.Firestore, payload: LoggingPayload) {
    // TODO: in case of critical errors do send a notification to telegram log bot
    const insertionResponse = await logDbInstance.collection('gateway-service').add({
        ...payload,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return insertionResponse;
}