export function oKeys<T>(o: T): (keyof T)[] {
    return Object.keys(o) as (keyof T)[];
}

export type StringKeys<T> = Extract<keyof T, string>;

export function cmpIgnoreCase(a: string, b: string): number {
    return a.localeCompare(b, undefined, {
        sensitivity: "accent"
    })
}

/**
 * Validate that the `default` branch of a switch is never taken.
 * @param x - the switch expression, which will evaluate to `never` if the default branch will never be taken
 */
export function noUnhandledCase(x: never): never {
    throw new Error("Unhandled case: " + x);
}

function nextAnimFrame(): Promise<void> {
    return new Promise(resolve => {
        requestAnimationFrame(() => resolve());
    });
}

/**
 * Return a promise that resolves after the next render.
 */
export function afterNextRender(): Promise<void> {
    // Pass a frame.
    return nextAnimFrame().then(() => nextAnimFrame());
}

