import {sprintf} from "sprintf-js";

export interface CsvValueS {
    value: string
    type: 'string'
}

export interface CsvValueF {
    value: number
    type: 'float'
}

export interface CsvValueI {
    value: number
    type: 'integer'
}

export interface CsvValueB {
    value: boolean
    type: 'boolean'
}

export type CsvValue = CsvValueS | CsvValueF | CsvValueI | CsvValueB

function interpretRaw(v: any): CsvValue | undefined {
    if (typeof v === "boolean") {
        return {value: v, type: "boolean"};
    }
    if (typeof v === "number") {
        if (Number.isInteger(v)) {
            return {value: v, type: "integer"};
        }
        return {value: v, type: "float"};
    }
    if (v === null || typeof v === "undefined") {
        return {value: "", type: "string"};
    }
    return undefined;
}

export function interpretValue(v: any): CsvValue {
    const rawConverts = interpretRaw(v);

    if (typeof rawConverts !== "undefined") {
        return rawConverts;
    }

    if (typeof v !== "string") {
        v = v.toString();
    }

    if (v === 'TRUE' || v === 'FALSE') {
        return {value: v === 'TRUE', type: "boolean"};
    }
    const integer = parseInt(v);
    if (isNaN(integer)) {
        return {value: v, type: "string"};
    }
    return {value: integer, type: "integer"};
}

export function stringifyValue(v: CsvValue): string {
    switch (v.type) {
        case "boolean":
            return v.value ? 'TRUE' : 'FALSE';
        case 'integer':
            return v.value.toString();
        case 'float':
            return sprintf('%.02f', v.value);
        case 'string':
            return v.value;
    }
}

export function compareValue(a: CsvValue, b: CsvValue): number {
    if (a.type === "string" || b.type === "string") {
        return a.value.toString().localeCompare(b.value.toString());
    }

    let aNum: number | boolean = +a.value;
    let bNum: number | boolean = +b.value;

    if (isNaN(aNum) || isNaN(bNum)) {
        // sort NaNs using the boolean value instead
        aNum = isNaN(aNum);
        bNum = isNaN(bNum);
    }

    if (aNum > bNum) {
        return 1;
    }
    if (aNum === bNum) {
        return 0;
    }
    return -1;
}

export function reduceValues(previousValue: number, arrValue: CsvValue): number {
    switch (arrValue.type) {
        case 'float':
        case 'integer':
            return previousValue + arrValue.value;
        case 'string':
            return previousValue;
        case 'boolean':
            return previousValue + (arrValue.value ? 1 : 0);
    }
}

export class AvgInfo {
    sum: number;
    count: number;

    constructor(sum: number, count: number) {
        this.sum = sum;
        this.count = count;
    }

    get value(): CsvValueF {
        return {
            value: this.sum / this.count,
            type: 'float'
        };
    }

    addValue(value: CsvValue): AvgInfo {
        const newSum = reduceValues(this.sum, value);
        return new AvgInfo(newSum, this.count + (value.type === 'string' ? 0 : 1));
    }
}

export function averageRows(valueInfo: AvgInfo[], row: CsvValue[]): AvgInfo[] {
    return valueInfo.map((v, i) => v.addValue(row[i]));
}

export function genAverageRowArray(length: number): AvgInfo[] {
    const arr: AvgInfo[] = new Array(length);
    for (let i = 0; i < length; i++) {
        arr[i] = new AvgInfo(0, 0);
    }
    return arr;
}
