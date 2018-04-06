export const OR_REDUCER = (previousValue: boolean, currentValue: any): boolean => {
    return previousValue || currentValue;
};
export const AND_REDUCER = (previousValue: boolean, currentValue: any): boolean => {
    return previousValue && currentValue;
};

export function anyFalse(iter: Iterable<any> | any[]) {
    const a: any[] = Array.isArray(iter) ? iter : Array.from(iter);
    return !a.reduce(AND_REDUCER, true);
}

export interface ElvisOperator<T> {
    val: T | undefined

    <K extends keyof T>(key: K): ElvisOperator<NonNullable<T[K]>>
}

export interface DefinedElvisOperator<T> extends ElvisOperator<T> {
    val: T
}

export interface UndefinedElvisOperator extends ElvisOperator<any> {
    val: undefined

    (key: any): UndefinedElvisOperator
}

const undefinedElvis: UndefinedElvisOperator = Object.assign(() => undefinedElvis, {val: undefined});

export function elvis<T>(value: undefined): UndefinedElvisOperator;
export function elvis<T>(value: NonNullable<T>): DefinedElvisOperator<T>;
export function elvis<T>(value: NonNullable<T> | undefined): ElvisOperator<T> {
    if (typeof value === "undefined") {
        return undefinedElvis;
    }
    return Object.assign((k: keyof T) => elvis((value as any)[k]), {val: value});
}

export const e = elvis;

export function oKeys<T>(o: T): (keyof T)[] {
    return Object.keys(o) as (keyof T)[];
}
