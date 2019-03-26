import {Average, CsvValueToValueType, CsvValueType} from "./values";

export interface CsvValueTypeSorting<T extends CsvValueType> {
    readonly type: T

    compare(a: CsvValueToValueType[T], b: CsvValueToValueType[T]): number

    isGoodValue(v: any): v is CsvValueToValueType[T]
}

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
    const nanSort = sortBadToBottom(a, b, (x => !isNaN(x)));
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

export type SortingHelperMap = {
    [P in CsvValueType]: CsvValueTypeSorting<P>
};

const sortingHelpers: SortingHelperMap = {
    [CsvValueType.STRING]: {
        type: CsvValueType.STRING,
        compare(a: string, b: string): number {
            return a.localeCompare(b);
        },
        isGoodValue(v: any): v is string {
            return typeof v === "string" && v.trim().length > 0;
        }
    },
    [CsvValueType.FLOAT]: {
        type: CsvValueType.FLOAT,
        compare: compareNumber,
        isGoodValue(v: any): v is number {
            return typeof v === "number" && !Number.isNaN(v);
        }
    },
    [CsvValueType.INTEGER]: {
        type: CsvValueType.INTEGER,
        compare: compareNumber,
        isGoodValue(v: any): v is number {
            return typeof v === "number" && Number.isInteger(v);
        }
    },
    [CsvValueType.BOOLEAN]: {
        type: CsvValueType.BOOLEAN,
        compare(a: boolean, b: boolean): number {
            return compareNumber(+a, +b);
        },
        isGoodValue(v: any): v is boolean {
            return typeof v === "boolean";
        }
    },
    [CsvValueType.AVERAGE]: {
        type: CsvValueType.AVERAGE,
        compare(a: Average, b: Average): number {
            return compareNumber(a.average, b.average);
        },
        isGoodValue: Average.isInstance
    },
};

export function sortingHelper<T extends keyof SortingHelperMap>(type: T): SortingHelperMap[T] {
    return sortingHelpers[type];
}
