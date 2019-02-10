export function oKeys<T>(o: T): (keyof T)[] {
    return Object.keys(o) as (keyof T)[];
}

export type StringKeys<T> = Extract<keyof T, string>;

export function cmpIgnoreCase(a: string, b: string): number {
    return a.localeCompare(b, undefined, {
        sensitivity: "accent"
    })
}
