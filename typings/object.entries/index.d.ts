declare const entries: EntriesShim;

declare module 'object.entries' {
    export = entries;
}

interface EntriesShim {
    shim(): void;
}

declare interface Object {
    entries<O, V>(object: Record<keyof O, V>): Array<[keyof O, V]>
    entries<O>(object: O): Array<[keyof O, any]>
}
