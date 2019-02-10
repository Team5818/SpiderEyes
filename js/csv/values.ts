import {sprintf} from "sprintf-js";
import {cmpIgnoreCase} from "../utils";

export enum CsvValueType {
    STRING = "string",
    INTEGER = "integer",
    FLOAT = "float",
    BOOLEAN = "boolean",
}

export interface CsvValue<V, T extends CsvValueType> {
    value: V
    type: T
}

export interface CsvValueS extends CsvValue<string, CsvValueType.STRING> {
}

export interface CsvValueF  extends CsvValue<number, CsvValueType.FLOAT>{
}

export interface CsvValueI  extends CsvValue<number, CsvValueType.INTEGER>{
}

export interface CsvValueB  extends CsvValue<boolean, CsvValueType.BOOLEAN>{
}

export type CsvValueSealed = CsvValueS | CsvValueF | CsvValueI | CsvValueB

function interpretRaw(v: any): CsvValueSealed | undefined {
    if (typeof v === "boolean") {
        return {value: v, type: CsvValueType.BOOLEAN};
    }
    if (typeof v === "number") {
        if (Number.isInteger(v)) {
            return {value: v, type: CsvValueType.INTEGER};
        }
        return {value: v, type: CsvValueType.FLOAT};
    }
    if (v === null || typeof v === "undefined") {
        return {value: "", type: CsvValueType.STRING};
    }
    return undefined;
}

export function interpretValue(v: any): CsvValueSealed {
    const rawConverts = interpretRaw(v);

    if (typeof rawConverts !== "undefined") {
        return rawConverts;
    }

    const str = (typeof v === "string"
        ? v
        : v.toString());

    const isTrue = cmpIgnoreCase(str, 'true') === 0;
    if (isTrue || cmpIgnoreCase(str, 'false') === 0) {
        return {value: isTrue, type: CsvValueType.BOOLEAN};
    }
    const integer = parseInt(str);
    if (isNaN(integer)) {
        const float = parseFloat(str);
        if (isNaN(float)) {
            return {value: str, type: CsvValueType.STRING};
        }
        return {value: float, type: CsvValueType.FLOAT};
    }
    return {value: integer, type: CsvValueType.INTEGER};
}

export function stringifyValue(v: CsvValueSealed): string {
    switch (v.type) {
        case CsvValueType.BOOLEAN:
            return v.value ? 'TRUE' : 'FALSE';
        case CsvValueType.INTEGER:
            return v.value.toString();
        case CsvValueType.FLOAT:
            return sprintf('%.02f', v.value);
        case CsvValueType.STRING:
            return v.value;
    }
}

export function reduceValues(previousValue: number, arrValue: CsvValueSealed): number {
    switch (arrValue.type) {
        case CsvValueType.FLOAT:
        case CsvValueType.INTEGER:
            return previousValue + arrValue.value;
        case CsvValueType.STRING:
            return previousValue;
        case CsvValueType.BOOLEAN:
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
            type: CsvValueType.FLOAT
        };
    }

    addValue(value: CsvValueSealed): AvgInfo {
        const newSum = reduceValues(this.sum, value);
        return new AvgInfo(newSum, this.count + (value.type === CsvValueType.STRING ? 0 : 1));
    }
}

export function averageRows(valueInfo: AvgInfo[], row: CsvValueSealed[]): AvgInfo[] {
    return valueInfo.map((v, i) => v.addValue(row[i]));
}

export function genAverageRowArray(length: number): AvgInfo[] {
    const arr: AvgInfo[] = new Array(length);
    for (let i = 0; i < length; i++) {
        arr[i] = new AvgInfo(0, 0);
    }
    return arr;
}
