import React from "react";

import {parse as parseCsv} from "./parse";
import {CsvValueSealed, CsvValueType, interpretValue, stringifyValue} from "./values";
import {getSortMultiplier, SortDirection} from "../SortDirection";
import {CsvValueTypeSorting, sortingHelper} from "./sorting";
import {CharStream} from "../charStream";
import {AsyncSorter} from "../sort/async";
import {Table} from "../Table";
import {noUnhandledCase} from "../utils";

const MAX_COL_WIDTH = 15;

type CsvColumnUpdate = {
    name?: string,
    type?: CsvValueType,
    maxCharWidth?: number | { compute: CsvValueSealed[] },
    score?: number
};

/**
 * Column metadata.
 */
export class CsvColumn {
    readonly name: string;
    readonly type: CsvValueType;
    private sortingHelperCached: CsvValueTypeSorting<any> | undefined = undefined;
    /**
     * Size of the largest column, in characters (approx.).
     */
    readonly maxCharWidth: number;
    readonly score: number;

    constructor(name: string,
                type: CsvValueType,
                maxCharWidth: number,
                score: number = 1) {
        this.name = name;
        this.type = type;
        this.maxCharWidth = maxCharWidth;
        this.score = score;
    }

    get sortingHelper(): CsvValueTypeSorting<any> {
        let helper = this.sortingHelperCached;
        if (typeof helper === "undefined") {
            this.sortingHelperCached = helper = sortingHelper(this.type);
        }
        return helper;
    }

    private widthOfValue(value: CsvValueSealed): number {
        return stringifyValue(value, this.score).length + 1;
    }

    updateWidth(values: CsvValueSealed[]): CsvColumn {
        return this.with({
            maxCharWidth: {compute: values}
        });
    }

    with(fieldUpdate: CsvColumnUpdate): CsvColumn {
        const name = fieldUpdate.name || this.name;
        const type = fieldUpdate.type || this.type;
        const maxCharWidth = this.computeMaxCharWidth(fieldUpdate.maxCharWidth);
        const score = fieldUpdate.score || this.score;
        return new CsvColumn(name, type, maxCharWidth, score);
    }

    private computeMaxCharWidth(maxCharWidth: undefined | number | { compute: CsvValueSealed[] }): number {
        switch (typeof maxCharWidth) {
            case "undefined":
                return this.maxCharWidth;
            case "number":
                return maxCharWidth;
            case "object":
                if (maxCharWidth.compute.length === 0) {
                    return this.maxCharWidth;
                }
                let newWidth = 1;
                for (let value of maxCharWidth.compute) {
                    let w = this.widthOfValue(value);
                    newWidth = Math.max(newWidth, w);
                }
                return Math.min(newWidth, MAX_COL_WIDTH);
            default:
                return noUnhandledCase(maxCharWidth);
        }
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

export interface Sort {
    key: number
    direction: SortDirection
}

export class CsvData {
    static async parse(data: CharStream): Promise<CsvData> {
        const arr = await parseCsv(data);
        const rawVals: string[][] = arr.slice(1);

        const header: CsvColumn[] = arr[0].map(name => new CsvColumn(
            name,
            CsvValueType.STRING,
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
                header[i] = header[i].with({type: type});
            }
        }

        return new CsvData(header, values.map((v, i) => new CsvRow(v, i)));
    }

    header: CsvColumn[];
    values: CsvRow[];
    currentSort: Sort | undefined;

    constructor(header: CsvColumn[], values: CsvRow[], currentSort?: Sort) {
        this.header = header;
        this.values = values;
        this.currentSort = currentSort;
    }

    removeRow(row: number): CsvData {
        const newValues = this.values.slice();
        newValues.splice(row, 1);
        return this.withValues(newValues);
    }

    withColumn(colIndex: number, col: CsvColumn) {
        return new CsvData(
            this.header.map((x, i) => i === colIndex ? col : x),
            this.values,
            this.currentSort
        );
    }

    async sort(sort: Sort): Promise<CsvData> {
        if (this.currentSort && this.currentSort.key === sort.key) {
            if (this.currentSort.direction === sort.direction) {
                // we're already sorted
                return this;
            } else {
                // we're just backwards, we only need to move the bad values
                return this.withValues(await this.reverseValues(sort), sort);
            }
        } else {
            return this.withValues(await this.sortValues(sort), sort);
        }
    }

    private withValues(values: CsvRow[], sort?: Sort): CsvData {
        return new CsvData(
            this.header,
            values,
            sort || this.currentSort
        );
    }

    private async reverseValues(sort: Sort): Promise<CsvRow[]> {
        const sortingHelper = this.header[sort.key].sortingHelper;
        const result = new Array<CsvRow>();
        const badValues = new Array<CsvRow>();

        this.values.forEach(row => {
            const v = row.data[sort.key];
            if (sortingHelper.isGoodValue(v.value)) {
                result.push(row);
            } else {
                badValues.push(row);
            }
        });
        result.reverse();
        return result.concat(badValues);
    }

    private async sortValues(sort: Sort): Promise<CsvRow[]> {
        const sortMult = getSortMultiplier(sort.direction);
        const sortingHelper = this.header[sort.key].sortingHelper;
        const result = new Array<CsvRow>();
        const badValues = new Array<CsvRow>();

        this.values.forEach(row => {
            const v = row.data[sort.key];
            if (sortingHelper.isGoodValue(v.value)) {
                result.push(row);
            } else {
                badValues.push(row);
            }
        });
        const sorted = await new AsyncSorter(result, (a, b) => {
            return sortMult * sortingHelper.compare(a.data[sort.key].value, b.data[sort.key].value);
        }, 10).sort();
        return sorted.concat(badValues);
    }

    get columnNames(): string[] {
        return this.header.map(x => x.name);
    }
}
