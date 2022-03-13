export function isNullOrUndefined<T>(param: T | null | undefined): param is null | undefined {
    return param === null || typeof param === 'undefined';
}

export function isDefined<T>(param: T | null | undefined): param is T {
    return !isNullOrUndefined(param);
}

export function firstNonNull<T>(first: T | null | undefined, second: T): T {
    if (isNullOrUndefined(first)) {
        return second;
    }
    return first;
}

export function checkNotNull<T>(obj: T | null | undefined, message?: string): T {
    if (obj === null) {
        throw new Error(firstNonNull<string>(message, "Object cannot be null!"));
    }
    if (typeof obj === 'undefined') {
        throw new Error(firstNonNull<string>(message, "Object cannot be undefined!"));
    }
    return obj;
}
