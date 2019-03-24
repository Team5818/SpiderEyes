import {sprintf} from "sprintf-js";
import {cmpIgnoreCase, noUnhandledCase, oKeys} from "../utils";
import {checkNotNull} from "../preconditions";

export enum CsvValueType {
    STRING = "string",
    INTEGER = "integer",
    FLOAT = "float",
    BOOLEAN = "boolean",
    AVERAGE = "average",
}

const SCORE_CAPABLE = new Set<CsvValueType>([
    CsvValueType.INTEGER,
    CsvValueType.FLOAT,
    CsvValueType.BOOLEAN,
    CsvValueType.AVERAGE
]);

const TYPE_TO_READABLE: Record<CsvValueType, string> = {
    [CsvValueType.STRING]: 'String',
    [CsvValueType.INTEGER]: 'Integer',
    [CsvValueType.FLOAT]: 'Float',
    [CsvValueType.BOOLEAN]: 'Boolean',
    [CsvValueType.AVERAGE]: 'Average',
};

const READABLE_TO_TYPE: Record<string, CsvValueType> = oKeys(TYPE_TO_READABLE)
    .map(k => {
        return {[TYPE_TO_READABLE[k]]: k}
    })
    .reduce<Record<string, CsvValueType>>((prev, curr) => ({...prev, ...curr}), {});

export namespace CsvValueType {
    export function values(): CsvValueType[] {
        return oKeys(TYPE_TO_READABLE);
    }

    export function isScoreCapable(type: CsvValueType): boolean {
        return SCORE_CAPABLE.has(type);
    }

    export function readable(type: CsvValueType): string {
        return checkNotNull(TYPE_TO_READABLE[type], `Unmapped type: ${type}`);
    }

    export function fromReadable(readable: string): CsvValueType | undefined {
        return READABLE_TO_TYPE[readable];
    }
}

export interface CsvValueToValueType {
    [CsvValueType.STRING]: string
    [CsvValueType.FLOAT]: number
    [CsvValueType.INTEGER]: number
    [CsvValueType.BOOLEAN]: boolean
    [CsvValueType.AVERAGE]: Average
}

export interface CsvValue<T extends CsvValueType> {
    value: CsvValueToValueType[T]
    type: T
}

export interface CsvValueS extends CsvValue<CsvValueType.STRING> {
}

export interface CsvValueF extends CsvValue<CsvValueType.FLOAT> {
}

export interface CsvValueI extends CsvValue<CsvValueType.INTEGER> {
}

export interface CsvValueB extends CsvValue<CsvValueType.BOOLEAN> {
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

export interface CsvValueAvg extends CsvValue<CsvValueType.AVERAGE> {
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

export function stringifyValue(v: CsvValueSealed, score: number = 1): string {
    switch (v.type) {
        case CsvValueType.BOOLEAN:
            if (score === 1) {
                return v.value ? 'TRUE' : 'FALSE';
            } else {
                return ((v.value ? 1 : 0) * score).toString();
            }
        case CsvValueType.INTEGER:
            return (v.value * score).toString();
        case CsvValueType.FLOAT:
            return floatToString(v.value * score);
        case CsvValueType.STRING:
            return v.value;
        case CsvValueType.AVERAGE:
            return `${floatToString(v.value.average * score)} ± ${floatToString(v.value.deviation * score)}`;
        default:
            return noUnhandledCase(v);
    }
}

export function reduceValues(previousValue: number, arrValue: CsvValueSealed, score: number = 1): number {
    const num = numerifyValue(arrValue) * score;
    return previousValue + num;
}

function numerifyValue(v: CsvValueSealed, round: boolean = false): number {
    let value;
    switch (v.type) {
        case CsvValueType.FLOAT:
        case CsvValueType.INTEGER:
            value = v.value;
            break;
        case CsvValueType.BOOLEAN:
            value = +v.value;
            break;
        case CsvValueType.STRING:
            value = 0;
            break;
        case CsvValueType.AVERAGE:
            value = v.value.average;
            break;
        default:
            return noUnhandledCase(v);
    }
    return round ? Math.round(value) : value;
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
            value: new Average(this.mean, Math.sqrt(this.m2 / (this.count - 1))),
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

type MigrationTable = {
    [P in CsvValueType]: (value: CsvValueSealed) => CsvValueToValueType[P] | undefined
};

const MIGRATIONS: MigrationTable = {
    [CsvValueType.STRING]: stringifyValue,
    [CsvValueType.INTEGER]: (v: CsvValueSealed) => numerifyValue(v, true),
    [CsvValueType.FLOAT]: numerifyValue,
    [CsvValueType.BOOLEAN]: (v: CsvValueSealed) => {
        switch (v.type) {
            case CsvValueType.STRING:
                return v.value.trim().length > 0;
            case CsvValueType.INTEGER:
            case CsvValueType.FLOAT:
                return v.value != 0;
            case CsvValueType.BOOLEAN:
                return v.value;
            case CsvValueType.AVERAGE:
                return v.value.average != 0;
            default:
                return noUnhandledCase(v);
        }
    },
    [CsvValueType.AVERAGE]: (v: CsvValueSealed) => {
        // nothing can really be converted to an average...
        return undefined;
    },
};

export function migrateValues<T extends CsvValueType>(to: T, value: CsvValueSealed): CsvValueSealed {
    const migrated: CsvValueToValueType[T] | undefined = MIGRATIONS[to](value);
    if (typeof migrated === "undefined") {
        return value;
    }
    return {
        value: migrated,
        type: to
    } as CsvValueSealed;
}
