import React from "react";

import {parse as parseCsv} from "./csv-parse";
import {CsvValue, interpretValue} from "./values";
import {AdvancedTable} from "./AdvancedTable";

export class CsvData {
    static parse(data: string): CsvData {
        const arr = parseCsv(data);
        const header: string[] = arr[0];
        const rawVals: string[][] = arr.slice(1);
        const values: CsvValue[][] = rawVals.map(row => {
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
    values: CsvValue[][];

    constructor(header: string[], values: CsvValue[][]) {
        this.header = header;
        this.values = values;
    }

    removeRow(row: number): CsvData {
        const newValues = this.values.slice();
        newValues.splice(row, 1);
        return new CsvData(this.header, newValues);
    }
}
