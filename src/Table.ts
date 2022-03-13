export class Table<R, C, V> {
    private readonly table: Map<R, Map<C, V>>;
    private sizeInternal = 0;

    constructor(table?: Table<R, C, V>) {
        this.table = typeof table === "undefined" ? new Map() : table.table;
    }

    get size() : number {
        return this.sizeInternal;
    }

    row(row: R): Map<C, V> {
        const innerTable = this.table.get(row);
        if (typeof innerTable === "undefined") {
            return new Map();
        }
        return new Map(innerTable);
    }

    get(row: R, col: C): V | undefined
    get<D>(row: R, col: C, def: D): V | D
    get(row: R, col: C, def?: unknown): unknown {
        const innerTable = this.table.get(row);
        if (typeof innerTable === "undefined") {
            return def;
        }
        if (!innerTable.has(col)) {
            return def;
        }
        return innerTable.get(col);
    }

    put(row: R, col: C, val: V): V | undefined {
        let innerTable = this.table.get(row);
        if (typeof innerTable === "undefined") {
            innerTable = new Map();
            this.table.set(row, innerTable);
        }
        const old = innerTable.get(col);
        innerTable.set(col, val);
        this.sizeInternal += 1;
        return old;
    }

    remove(row: R, col: C): V | undefined {
        const innerTable = this.table.get(row);
        if (typeof innerTable === "undefined") {
            return undefined;
        }
        const old = innerTable.get(col);
        if (innerTable.delete(col)) {
            this.sizeInternal -= 1;
        }
        return old;
    }

}
