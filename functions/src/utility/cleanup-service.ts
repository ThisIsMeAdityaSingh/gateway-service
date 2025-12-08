export function cleanupService(interval: number, callbackFn: Function) {
    setInterval(() => {
        callbackFn()
    }, interval).unref();
}