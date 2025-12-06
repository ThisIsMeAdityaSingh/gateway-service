export enum ErrorType {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    UPSTREAM_ERROR = 'UPSTREAM_ERROR',
    CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export class GatewayError extends Error {
    constructor(message: string, public type: ErrorType, public statusCode: number) {
        super(message);
    }
}