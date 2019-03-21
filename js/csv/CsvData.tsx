import React from "react";

import {parse as parseCsv} from "./parse";
import {CsvValueSealed, CsvValueType, interpretValue, stringifyValue} from "./values";
import {getSortMultiplier, SortDirection} from "../SortDirection";
import {CsvValueTypeSorting, sortingHelper} from "./sorting";
import {CharStream} from "../charStream";
import {AsyncSorter} from "../sort/async";
import {Table} from "../Table";

const MAX_COL_WIDTH = 15;

function widthOfValue(value: CsvValueSealed): number {
    return stringifyValue(value).length + 1;
}

/**
 * Column metadata.
 */
export class CsvColumn {
    readonly name: string;
    readonly sortingHelper: CsvValueTypeSorting<any>;
    /**
     * Size of the largest column, in characters (approx.).
     */
    readonly maxCharWidth: number;

    constructor(name: string,
                sortingHelper: CsvValueTypeSorting<any>,
                maxCharWidth: number) {
        this.name = name;
        this.sortingHelper = sortingHelper;
        this.maxCharWidth = maxCharWidth;
    }

    withName(name: string): CsvColumn {
        return new CsvColumn(name, this.sortingHelper, this.maxCharWidth);
    }

    withType(type: CsvValueType): CsvColumn {
        return new CsvColumn(this.name, sortingHelper(type), this.maxCharWidth);
    }

    withWidth(maxCharWidth: number): CsvColumn {
        return new CsvColumn(this.name, this.sortingHelper, maxCharWidth);
    }

    updateWidth(values: CsvValueSealed[]): CsvColumn {
        if (values.length === 0) {
            return this;
        }
        let newWidth = 1;
        for (let value of values) {
            let w = widthOfValue(value);
            newWidth = Math.max(newWidth, w);
        }
        return this.withWidth(Math.min(newWidth, MAX_COL_WIDTH));
    }
}

export class CsvRow {
    readonly data: CsvValueSealed[];
    readonly originalIndex: number;

    constructor(data: CsvValueSealed[], originalIndex: number) {
        this.data = data;
        this.originalIndex = originalIndex;
    }
}

export class CsvData {
    static async parse(data: CharStream): Promise<CsvData> {
        const arr = await parseCsv(data);
        const rawVals: string[][] = arr.slice(1);

        const header: CsvColumn[] = arr[0].map(name => new CsvColumn(
            name,
            sortingHelper(CsvValueType.STRING),
            MAX_COL_WIDTH
        ));

        const columnTypeCounts: Table<number, CsvValueType, number> = new Table();

        const values: CsvValueSealed[][] = rawVals.map(row => {
            const ret = new Array(header.length);
            for (let i = 0; i < header.length; i++) {
                const v = row[i];
                const fixedValue = interpretValue(v);
                if (fixedValue.value !== "") {
                    const old = columnTypeCounts.get(i, fixedValue.type, 0);
                    columnTypeCounts.put(i, fixedValue.type, old + 1);
                }
                ret[i] = fixedValue;
            }
            return ret;
        });
        for (let i = 0; i < header.length; i++) {
            header[i] = header[i].updateWidth(values.map(x => x[i]));
        }

        // initialize column types
        for (let i = 0; i < header.length; i++) {
            const counts = columnTypeCounts.row(i);
            if (typeof counts !== "undefined" && counts.size > 0) {
                const type: CsvValueType = Array.from(counts.entries())
                    .reduce((prev, curr) => {
                        return prev[1] < curr[1] ? curr : prev;
                    })[0];
                header[i] = header[i].withType(type);
            }
        }

        return new CsvData(header, values.map((v, i) => new CsvRow(v, i)));
    }

    header: CsvColumn[];
    values: CsvRow[];
    currentSortKey: number | undefined;
    currentDirection: SortDirection | undefined;

    constructor(header: CsvColumn[], values: CsvRow[]) {
        this.header = header;
        this.values = values;
    }

    removeRow(row: number): CsvData {
        const newValues = this.values.slice();
        newValues.splice(row, 1);
        return new CsvData(this.header, newValues);
    }

    async sort(sortKey: number, direction: SortDirection): Promise<CsvData> {
        if (this.currentSortKey === sortKey) {
            if (this.currentDirection === direction) {
                // we're already sorted
                return this;
            } else {
                // we're just backwards, we only need to move the bad values
                return this.withValues(await this.reverseValues(sortKey, direction));
            }
        } else {
            return this.withValues(await this.sortValues(sortKey, direction));
        }
    }

    private withValues(values: CsvRow[]): CsvData {
        return new CsvData(this.header, values);
    }

    private async reverseValues(sortKey: number, direction: SortDirection): Promise<CsvRow[]> {
        this.currentDirection = direction;
        const sortingHelper = this.header[sortKey].sortingHelper;
        const result = new Array<CsvRow>();
        const badValues = new Array<CsvRow>();

        this.values.forEach(row => {
            const v = row.data[sortKey];
            if (sortingHelper.isGoodValue(v.value)) {
                result.push(row);
            } else {
                badValues.push(row);
            }
        });
        result.reverse();
        return result.concat(badValues);
    }

    private async sortValues(sortKey: number, direction: SortDirection): Promise<CsvRow[]> {
        this.currentSortKey = sortKey;
        this.currentDirection = direction;
        const sortMult = getSortMultiplier(direction);
        const sortingHelper = this.header[sortKey].sortingHelper;
        const result = new Array<CsvRow>();
        const badValues = new Array<CsvRow>();

        this.values.forEach(row => {
            const v = row.data[sortKey];
            if (sortingHelper.isGoodValue(v.value)) {
                result.push(row);
            } else {
                badValues.push(row);
            }
        });
        const sorted = await new AsyncSorter(result, (a, b) => {
            return sortMult * sortingHelper.compare(a.data[sortKey].value, b.data[sortKey].value);
        }, 10).sort();
        return sorted.concat(badValues);
    }

    get columnNames(): string[] {
        return this.header.map(x => x.name);
    }
}
