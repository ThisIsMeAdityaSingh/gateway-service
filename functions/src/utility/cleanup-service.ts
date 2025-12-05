export function cleaupService(interval: number, callbackFn: Function) {
    setInterval(() => {
        callbackFn()
    }, interval).unref();
}