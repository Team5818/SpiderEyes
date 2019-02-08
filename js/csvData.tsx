import React from "react";

import {parse as parseCsv} from "./csv-parse";
import {CsvValue, CsvValueSealed, CsvValueType, interpretValue} from "./values";
import {AdvancedTable} from "./AdvancedTable";
import {SortDirection} from "./SortDirection";


export type CsvColumnType<V extends CsvValue<any, any>> = V['type'];
export type CsvColumnValue<V extends CsvValue<any, any>> = V['value'] | undefined;
/**
 * Column of CSV values.
 */
export class CsvColumn<V extends CsvValue<any, any>> {
    type: CsvColumnType<V>;
    /**
     * Values in the column.
     */
    values: CsvColumnValue<V>[];

    constructor(type: CsvColumnType<V>, values: CsvColumnValue<V>[]) {
        this.type = type;
        this.values = values;
    }

    sortedValues(direction: SortDirection): CsvColumnValue<V>[] {
        const copy = this.values.slice();

        return copy;
    }
}

function sortBadToBottom(a: any, b: any, isGood: (param: any) => boolean): number | undefined {
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

export class CsvData {
    static parse(data: string): CsvData {
        const arr = parseCsv(data);
        const header: string[] = arr[0];
        const rawVals: string[][] = arr.slice(1);
        const values: CsvValueSealed[][] = rawVals.map(row => {
            const ret = new Array(header.length);
            for (let i = 0; i < header.length; i++) {
                const v = row[i];
                ret[i] = interpretValue(v);
            }
            return ret;
        });
        return new CsvData(header, values);
    }

    header: string[];
    values: CsvValueSealed[][];

    constructor(header: string[], values: CsvValueSealed[][]) {
        this.header = header;
        this.values = values;
    }

    removeRow(row: number): CsvData {
        const newValues = this.values.slice();
        newValues.splice(row, 1);
        return new CsvData(this.header, newValues);
    }
}
