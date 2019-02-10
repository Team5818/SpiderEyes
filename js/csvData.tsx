import React from "react";

import {parse as parseCsv} from "./csv-parse";
import {CsvValueSealed, CsvValueType, interpretValue} from "./values";
import {getSortMultiplier, SortDirection} from "./SortDirection";
import {checkNotNull} from "./preconditions";

type CsvColumnCmpFunc = (a: any, b: any) => number;

const compareFunctions: Map<CsvValueType, CsvColumnCmpFunc> = new Map();
compareFunctions.set(CsvValueType.STRING, (a, b) => {
    const nonStringSort = sortBadToBottom(a, b, (x => typeof x === "string"));
    if (typeof nonStringSort !== "undefined") {
        return nonStringSort;
    }
    return (a as string).localeCompare(b as string);
});
compareFunctions.set(CsvValueType.BOOLEAN, (a, b) => {
    const nonBoolSort = sortBadToBottom(a, b, (x => typeof x === "boolean"));
    if (typeof nonBoolSort !== "undefined") {
        return nonBoolSort;
    }
    return compareNumber(+a, +b);
});
compareFunctions.set(CsvValueType.INTEGER, (a, b) => {
    const nonIntSort = sortBadToBottom(a, b, (x => Number.isInteger(x)));
    if (typeof nonIntSort !== "undefined") {
        return nonIntSort;
    }
    return compareNumber(a, b);
});
compareFunctions.set(CsvValueType.FLOAT, (a, b) => {
    const nonIntSort = sortBadToBottom(a, b, (x => typeof x === "number"));
    if (typeof nonIntSort !== "undefined") {
        return nonIntSort;
    }
    return compareNumber(a, b);
});

function sortBadToBottom<T>(a: T, b: T, isGood: (param: T) => boolean): number | undefined {
    const aGood = isGood(a);
    const bGood = isGood(b);
    if (!aGood || !bGood) {
        if (aGood && !bGood) {
            return 1;
        } else if (!aGood && bGood) {
            return -1;
        }
        return 0;
    }
    return undefined;
}

function compareNumber(a: number, b: number): number {
    const nanSort = sortBadToBottom(a, b, (x => isNaN(x)));
    if (typeof nanSort !== "undefined") {
        return nanSort;
    }
    if (a > b) {
        return 1;
    } else if (a < b) {
        return -1;
    } else {
        return 0;
    }
}

/**
 * Column metadata.
 */
export class CsvColumn {
    readonly name: string;
    type: CsvValueType;

    constructor(name: string, type: CsvValueType) {
        this.name = name;
        this.type = type;
    }

    get compareFunction(): CsvColumnCmpFunc {
        return checkNotNull(compareFunctions.get(this.type), `No compare function for ${this.type}`);
    }
}

export class CsvData {
    static parse(data: string): CsvData {
        const arr = parseCsv(data);
        const rawVals: string[][] = arr.slice(1);

        const header: CsvColumn[] = arr[0].map(name => new CsvColumn(name, CsvValueType.STRING));

        const columnTypeCounts: Map<number, Map<CsvValueType, number>> = new Map();

        const values: CsvValueSealed[][] = rawVals.map(row => {
            const ret = new Array(header.length);
            for (let i = 0; i < header.length; i++) {
                const v = row[i];
                const fixedValue = interpretValue(v);
                let countsMap = columnTypeCounts.get(i);
                if (typeof countsMap === "undefined") {
                    countsMap = new Map();
                    columnTypeCounts.set(i, countsMap);
                }
                countsMap.set(fixedValue.type, (countsMap.get(fixedValue.type) || 0) + 1);
                ret[i] = fixedValue;
            }
            return ret;
        });

        // initialize column types
        for (let i = 0; i < header.length; i++) {
            header[i].type = Array.from((columnTypeCounts.get(i) || new Map()).entries())
                .reduce((prev, curr) => {
                    return prev[1] < curr[1] ? curr : prev;
                })[0];
        }

        return new CsvData(header, values);
    }

    header: CsvColumn[];
    values: CsvValueSealed[][];

    constructor(header: CsvColumn[], values: CsvValueSealed[][]) {
        this.header = header;
        this.values = values;
    }

    removeRow(row: number): CsvData {
        const newValues = this.values.slice();
        newValues.splice(row, 1);
        return new CsvData(this.header, newValues);
    }

    sort(sortKey: number, direction: SortDirection): CsvValueSealed[][] {
        const sortMult = getSortMultiplier(direction);
        const sortFunc = this.header[sortKey].compareFunction;
        console.log(sortKey, this.header[sortKey]);
        return this.values.slice().sort((a, b) => {
            return sortMult * sortFunc(a[sortKey].value, b[sortKey].value);
        });
    }

    get columnNames(): string[] {
        return this.header.map(x => x.name);
    }
}
