export function isEmptyObject(obj: any) {
    if (!obj || typeof obj !== "object") return true;
    return Object.keys(obj).length === 0;
}

export function getErrorResponseObject(errorMessage: string, extraData?: object) {
    if (!errorMessage){
        errorMessage = "Error encountered";
    }

    if (isEmptyObject(extraData)) {
        extraData = {};
    }

    return {
        success: false,
        error: errorMessage,
        data: extraData
    }
}