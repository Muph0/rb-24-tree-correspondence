
export const sleep: (ms: number) => Promise<void> = (ms: number) => new Promise(resolve =>
    window.setTimeout(() => resolve(), ms)
);

export const sleepUntilNextFrame : () => Promise<void> = () => new Promise(resolve =>
    window.requestAnimationFrame(() => resolve())
);

export const nowMs = () => new Date().getTime();