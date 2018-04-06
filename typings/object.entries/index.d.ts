declare const entries: EntriesShim;

declare module 'object.entries' {
    export = entries;
}

interface EntriesShim {
    shim(): void;
}

declare interface Object {
    entries<V>(object: { [key: string]: V }): Array<[string, V]>
}
