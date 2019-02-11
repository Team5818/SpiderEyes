import {sprintf} from "sprintf-js";
import {cmpIgnoreCase, noUnhandledCase} from "../utils";

export enum CsvValueType {
    STRING = "string",
    INTEGER = "integer",
    FLOAT = "float",
    BOOLEAN = "boolean",
    AVERAGE = "average",
}

export interface CsvValue<V, T extends CsvValueType> {
    value: V
    type: T
}

export interface CsvValueS extends CsvValue<string, CsvValueType.STRING> {
}

export interface CsvValueF extends CsvValue<number, CsvValueType.FLOAT> {
}

export interface CsvValueI extends CsvValue<number, CsvValueType.INTEGER> {
}

export interface CsvValueB extends CsvValue<boolean, CsvValueType.BOOLEAN> {
}

/**
 * An average value, with standard deviation.
 */
export class Average {
    average: number;
    deviation: number;

    constructor(average: number, deviation: number) {
        this.average = average;
        this.deviation = deviation;
    }
}

export interface CsvValueAvg extends CsvValue<Average, CsvValueType.AVERAGE> {
}

export type CsvValueSealed = CsvValueS | CsvValueF | CsvValueI | CsvValueB | CsvValueAvg;

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

const booleanStarters = new Set<string>("tTfF");
function isPotentialBoolean(str: string): boolean {
    return booleanStarters.has(str[0]);
}

export function interpretValue(v: any): CsvValueSealed {
    const rawConverts = interpretRaw(v);

    if (typeof rawConverts !== "undefined") {
        return rawConverts;
    }

    const str = (typeof v === "string"
        ? v
        : v.toString());

    // perf optimization -- cmpIgnoreCase is slow
    // avoid calling it if there's no chance of a boolean
    if (isPotentialBoolean(str)) {
        const isTrue = cmpIgnoreCase(str, 'true') === 0;
        if (isTrue || cmpIgnoreCase(str, 'false') === 0) {
            return {value: isTrue, type: CsvValueType.BOOLEAN};
        }
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

function floatToString(f: number): string {
    return sprintf('%.02f', f);
}

export function stringifyValue(v: CsvValueSealed): string {
    switch (v.type) {
        case CsvValueType.BOOLEAN:
            return v.value ? 'TRUE' : 'FALSE';
        case CsvValueType.INTEGER:
            return v.value.toString();
        case CsvValueType.FLOAT:
            return floatToString(v.value);
        case CsvValueType.STRING:
            return v.value;
        case CsvValueType.AVERAGE:
            return `${floatToString(v.value.average)} ± ${floatToString(v.value.deviation)}`;
        default:
            return noUnhandledCase(v);
    }
}

export function reduceValues(previousValue: number, arrValue: CsvValueSealed): number {
    const num = numerifyValue(arrValue);
    return typeof num === "undefined" ? previousValue : previousValue + num;
}

function numerifyValue(v: CsvValueSealed): number | undefined {
    switch (v.type) {
        case CsvValueType.FLOAT:
        case CsvValueType.INTEGER:
            return v.value;
        case CsvValueType.BOOLEAN:
            return +v.value;
        case CsvValueType.STRING:
            return undefined;
        case CsvValueType.AVERAGE:
            return v.value.average;
        default:
            return noUnhandledCase(v);
    }
}

// Implements Welford's standard variance algorithm.
export class AvgInfo {
    mean: number;
    m2: number;
    count: number;

    constructor(mean: number, m2: number, count: number) {
        this.mean = mean;
        this.m2 = m2;
        this.count = count;
    }

    get value(): CsvValueAvg {
        return {
            value: {
                average: this.mean,
                deviation: Math.sqrt(this.m2 / (this.count - 1))
            },
            type: CsvValueType.AVERAGE
        };
    }

    addValue(value: CsvValueSealed): AvgInfo {
        const asNum = numerifyValue(value) || 0;
        const newCount = this.count + 1;
        const delta = asNum - this.mean;
        const newMean = this.mean + delta / newCount;
        const delta2 = asNum - this.mean;
        const newM2 = this.m2 + (delta * delta2);
        return new AvgInfo(newMean, newM2, newCount);
    }
}

export function averageRows(valueInfo: AvgInfo[], row: CsvValueSealed[]): AvgInfo[] {
    return valueInfo.map((v, i) => v.addValue(row[i]));
}

export function genAverageRowArray(length: number): AvgInfo[] {
    const arr: AvgInfo[] = new Array(length);
    for (let i = 0; i < length; i++) {
        arr[i] = new AvgInfo(0, 0, 0);
    }
    return arr;
}
