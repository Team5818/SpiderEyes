import React from "react";

import {parse as parseCsv} from "./parse";
import {CsvValueSealed, CsvValueType, interpretValue} from "./values";
import {getSortMultiplier, SortDirection} from "../SortDirection";
import {CsvValueTypeSorting, sortingHelper} from "./sorting";

/**
 * Column metadata.
 */
export class CsvColumn {
    readonly name: string;
    readonly sortingHelper: CsvValueTypeSorting<any>;

    constructor(name: string, sortingHelper: CsvValueTypeSorting<any>) {
        this.name = name;
        this.sortingHelper = sortingHelper;
    }

    withName(name: string): CsvColumn {
        return new CsvColumn(name, this.sortingHelper);
    }

    withType(type: CsvValueType): CsvColumn {
        return new CsvColumn(this.name, sortingHelper(type));
    }
}

export class CsvData {
    static parse(data: string): CsvData {
        const arr = parseCsv(data);
        const rawVals: string[][] = arr.slice(1);

        const header: CsvColumn[] = arr[0].map(name => new CsvColumn(name, sortingHelper(CsvValueType.STRING)));

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
            const counts = columnTypeCounts.get(i);
            if (typeof counts !== "undefined") {
                const type: CsvValueType = Array.from(counts.entries())
                    .reduce((prev, curr) => {
                        return prev[1] < curr[1] ? curr : prev;
                    })[0];
                header[i] = header[i].withType(type);
            }
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
        const sortingHelper = this.header[sortKey].sortingHelper;
        const result = new Array<CsvValueSealed[]>();
        const badValues = new Array<CsvValueSealed[]>();

        this.values.forEach(row => {
            const v = row[sortKey];
            if (sortingHelper.isGoodValue(v.value)) {
                result.push(row);
            } else {
                badValues.push(row);
            }
        });

        return result.sort((a, b) => {
            return sortMult * sortingHelper.compare(a[sortKey].value, b[sortKey].value);
        }).concat(badValues);
    }

    get columnNames(): string[] {
        return this.header.map(x => x.name);
    }
}
